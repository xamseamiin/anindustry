'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useLanguage } from './LanguageContext';
import Toast, { ToastType } from '@/components/common/Toast';
import { AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';

// Notification Types
export interface Notification {
  id: string;
  type: ToastType;
  message: string;
  timestamp: Date;
  read: boolean;
  source?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Notification Context Type
interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
  refreshNotifications: () => void;
}

// Create Context
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Notification Provider Component
export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [toasts, setToasts] = useState<{ id: string; message: string; type: ToastType }[]>([]);
  const { t } = useLanguage();
  const { data: session } = useSession();

  // Fetch notifications from API (FAST READ ONLY)
  const fetchNotifications = useCallback(async () => {
    if (!session) return;
    try {
      const response = await fetch('/api/notifications?limit=20');
      if (response.ok) {
        const data = await response.json();
        const mappedNotifications: Notification[] = data.notifications.map((n: any) => ({
          id: n.id,
          type: (n.type.toLowerCase() as ToastType) || 'info',
          message: n.message,
          timestamp: new Date(n.createdAt),
          read: n.read,
          source: n.details?.includes('ProjectID') ? 'Finance' : 'System',
          action: n.details?.includes('ProjectID') ? {
            label: 'View Invoice',
            onClick: () => {
              const pid = n.details.split('ProjectID:')[1];
              if (pid) window.location.href = `/projects/${pid}/invoice`;
            }
          } : undefined
        }));
        setNotifications(mappedNotifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, [session]);

  // Run the HEAVY system check ONLY once per user session (not every minute!)
  useEffect(() => {
    if (session) {
       fetch('/api/notifications/check', { method: 'POST' }).catch(() => {});
    }
  }, [session]);

  // Initial fetch ONLY (No background polling as per architectural decision)
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Calculate unread count
  const unreadCount = notifications.filter(notification => !notification.read).length;

  const playNotificationSound = (type: Notification['type']) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      const frequencies = {
        'info': 800,
        'success': 1000,
        'warning': 600,
        'error': 400
      };

      oscillator.frequency.setValueAtTime(frequencies[type] || 800, audioContext.currentTime);
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      // Silent fail
    }
  };

  const addNotification = useCallback(async (notificationData: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    // Optimistic UI update
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const notification: Notification = {
      ...notificationData,
      id,
      timestamp: new Date(),
      read: false,
    };

    setNotifications(prev => [notification, ...prev.slice(0, 49)]);
    setToasts(prev => [...prev, { id, message: notification.message, type: notification.type }]);
    playNotificationSound(notification.type);

    // Persist to DB
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: notificationData.message,
          type: notificationData.type,
          details: notificationData.source
        })
      });
      // Silently refresh to get real ID if needed, or just leave it
    } catch (e) { console.error("Failed to persist notification", e) }

  }, []);

  const removeToast = useCallback((id?: string) => {
    if (id) {
      setToasts(prev => prev.filter(t => t.id !== id));
    } else {
      setToasts([]);
    }
  }, []);

  const markAsRead = async (id: string) => {
    // Optimistic update
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
    // API call would go here if we had a specific mark-read endpoint
    // For now we assume we can build one or just leave it local for session
    try {
      await fetch(`/api/notifications/${id}`, { method: 'PATCH', body: JSON.stringify({ read: true }) });
    } catch (e) { }
  };

  const markAllAsRead = async () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
    // API Call
    try {
      await fetch(`/api/notifications/mark-all-read`, { method: 'POST' });
    } catch (e) { }
  };

  const removeNotification = async (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
    try {
      await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
    } catch (e) { }
  };

  const clearAllNotifications = async () => {
    setNotifications([]);
    try {
      await fetch(`/api/notifications`, { method: 'DELETE' });
    } catch (e) { }
  };

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    refreshNotifications: fetchNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => (
            <Toast
              key={toast.id}
              id={toast.id}
              message={toast.message}
              type={toast.type}
              onClose={removeToast}
            />
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
