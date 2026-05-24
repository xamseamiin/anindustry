// lib/notifications.ts - Real-time notification system for reports
import { cache } from './cache';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  companyId: string;
  userId?: string;
  actionUrl?: string;
  data?: any;
}

export interface ReportAlert {
  id: string;
  type: 'threshold' | 'anomaly' | 'deadline' | 'performance';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  threshold?: number;
  currentValue?: number;
  timestamp: number;
  companyId: string;
  resolved: boolean;
}

class NotificationManager {
  private notifications = new Map<string, Notification[]>();
  private reportAlerts = new Map<string, ReportAlert[]>();

  // Add notification
  addNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) {
    const id = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newNotification: Notification = {
      ...notification,
      id,
      timestamp: Date.now(),
      read: false
    };

    const key = `${notification.companyId}_${notification.userId || 'all'}`;
    const existing = this.notifications.get(key) || [];
    existing.unshift(newNotification);
    
    // Keep only last 100 notifications
    if (existing.length > 100) {
      existing.splice(100);
    }
    
    this.notifications.set(key, existing);
    
    // Clear cache to trigger refresh
    this.clearReportCache(notification.companyId);
    
    return newNotification;
  }

  // Get notifications
  getNotifications(companyId: string, userId?: string): Notification[] {
    const key = `${companyId}_${userId || 'all'}`;
    return this.notifications.get(key) || [];
  }

  // Mark notification as read
  markAsRead(companyId: string, notificationId: string, userId?: string) {
    const key = `${companyId}_${userId || 'all'}`;
    const notifications = this.notifications.get(key) || [];
    const notification = notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
    }
  }

  // Add report alert
  addReportAlert(alert: Omit<ReportAlert, 'id' | 'timestamp' | 'resolved'>) {
    const id = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newAlert: ReportAlert = {
      ...alert,
      id,
      timestamp: Date.now(),
      resolved: false
    };

    const key = alert.companyId;
    const existing = this.reportAlerts.get(key) || [];
    existing.unshift(newAlert);
    
    // Keep only last 50 alerts
    if (existing.length > 50) {
      existing.splice(50);
    }
    
    this.reportAlerts.set(key, existing);
    
    return newAlert;
  }

  // Get report alerts
  getReportAlerts(companyId: string): ReportAlert[] {
    return this.reportAlerts.get(companyId) || [];
  }

  // Resolve alert
  resolveAlert(companyId: string, alertId: string) {
    const alerts = this.reportAlerts.get(companyId) || [];
    const alert = alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
    }
  }

  // Clear report cache
  private clearReportCache(companyId: string) {
    const cacheKeys = [
      'reports:overview',
      'reports:daily',
      'reports:profit-loss',
      'reports:expenses',
      'reports:project-performance',
      'reports:debts',
      'reports:bank',
      'reports:payment-schedule'
    ];

    cacheKeys.forEach(key => {
      cache.delete(`${key}:companyId:${companyId}`);
    });
  }

  // Check for report anomalies and create alerts
  checkReportAnomalies(companyId: string, data: any) {
    const alerts: ReportAlert[] = [];

    // Check for negative profit
    if (data.netProfit < 0) {
      alerts.push({
        id: `negative-profit-${Date.now()}`,
        type: 'performance',
        title: 'Negative Profit Alert',
        message: `Your company is showing a negative profit of $${Math.abs(data.netProfit).toLocaleString()}`,
        severity: 'high',
        currentValue: data.netProfit,
        timestamp: Date.now(),
        companyId,
        resolved: false
      });
    }

    // Check for high expenses
    if (data.totalExpenses > data.totalIncome * 0.9) {
      alerts.push({
        id: `high-expenses-${Date.now()}`,
        type: 'threshold',
        title: 'High Expense Ratio',
        message: `Expenses are ${((data.totalExpenses / data.totalIncome) * 100).toFixed(1)}% of total income`,
        severity: 'medium',
        threshold: 90,
        currentValue: (data.totalExpenses / data.totalIncome) * 100,
        timestamp: Date.now(),
        companyId,
        resolved: false
      });
    }

    // Check for overdue projects
    if (data.onHoldProjects > 0) {
      alerts.push({
        id: `on-hold-projects-${Date.now()}`,
        type: 'deadline',
        title: 'Projects On Hold',
        message: `${data.onHoldProjects} project(s) are currently on hold`,
        severity: 'medium',
        currentValue: data.onHoldProjects,
        timestamp: Date.now(),
        companyId,
        resolved: false
      });
    }

    // Add alerts
    alerts.forEach(alert => this.addReportAlert(alert));

    return alerts;
  }
}

// Singleton instance
export const notificationManager = new NotificationManager();

// Helper functions
export const createNotification = (
  type: Notification['type'],
  title: string,
  message: string,
  companyId: string,
  userId?: string,
  actionUrl?: string
) => {
  return notificationManager.addNotification({
    type,
    title,
    message,
    companyId,
    userId,
    actionUrl
  });
};

export const createReportAlert = (
  type: ReportAlert['type'],
  title: string,
  message: string,
  severity: ReportAlert['severity'],
  companyId: string,
  threshold?: number,
  currentValue?: number
) => {
  return notificationManager.addReportAlert({
    type,
    title,
    message,
    severity,
    companyId,
    threshold,
    currentValue
  });
};
