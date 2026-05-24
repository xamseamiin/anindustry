'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Package, DollarSign, Truck, Users, TrendingUp, ChevronRight, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface ShopNotification {
    id: string;
    type: string;
    severity: 'critical' | 'warning' | 'info' | 'success';
    title: string;
    message: string;
    icon: string;
    link: string;
    createdAt: string;
    read: boolean;
}

const severityConfig = {
    critical: { dot: 'bg-red-500', badge: 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800', text: 'text-red-600 dark:text-red-400' },
    warning: { dot: 'bg-orange-400', badge: 'bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-800', text: 'text-orange-600 dark:text-orange-400' },
    info: { dot: 'bg-blue-400', badge: 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800', text: 'text-blue-600 dark:text-blue-400' },
    success: { dot: 'bg-green-400', badge: 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800', text: 'text-green-600 dark:text-green-400' },
};

export default function ShopNotificationBell() {
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState<ShopNotification[]>([]);
    const [loading, setLoading] = useState(false);
    const [readIds, setReadIds] = useState<Set<string>>(new Set());
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchNotifications();
        // Poll every 2 minutes
        const interval = setInterval(fetchNotifications, 120000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/shop/notifications');
            const data = await res.json();
            setNotifications(data.notifications || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const unreadCount = notifications.filter(n => !readIds.has(n.id)).length;

    const handleOpen = () => {
        setOpen(v => !v);
        if (!open) {
            // Mark all as read when opened
            setReadIds(new Set(notifications.map(n => n.id)));
        }
    };

    return (
        <div className="relative" ref={ref}>
            {/* Bell Button */}
            <button
                onClick={handleOpen}
                className="relative p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                aria-label="Notifications"
            >
                <Bell size={20} className="text-gray-600 dark:text-gray-300" />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute right-0 top-12 w-80 bg-white dark:bg-[#1f2937] rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 z-[100] overflow-hidden animate-fade-in">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
                        <div>
                            <h3 className="font-black text-gray-900 dark:text-white text-sm">Ogeysiisyada</h3>
                            <p className="text-xs text-gray-400 mt-0.5">{notifications.length} ogeysiis</p>
                        </div>
                        <div className="flex items-center gap-2">
                            {loading && <Loader2 size={14} className="animate-spin text-gray-400" />}
                            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    {/* List */}
                    <div className="max-h-[360px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="py-10 text-center">
                                <p className="text-2xl mb-2">✅</p>
                                <p className="text-sm font-bold text-gray-400">Wax ogeysiis ah lama helin</p>
                                <p className="text-xs text-gray-300">Ganacsigaagu waa fiican yahay!</p>
                            </div>
                        ) : (
                            notifications.map(notif => {
                                const config = severityConfig[notif.severity];
                                const isRead = readIds.has(notif.id);
                                return (
                                    <Link
                                        key={notif.id}
                                        href={notif.link}
                                        onClick={() => setOpen(false)}
                                        className={`flex items-start gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border-b border-gray-50 dark:border-gray-800/50 last:border-0 ${!isRead ? 'bg-gray-50/50 dark:bg-gray-800/20' : ''}`}
                                    >
                                        {/* Icon */}
                                        <div className={`flex-shrink-0 w-9 h-9 rounded-xl ${config.badge} border flex items-center justify-center text-base`}>
                                            {notif.icon}
                                        </div>
                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${config.dot}`} />
                                                <p className={`text-xs font-black ${config.text} uppercase tracking-wide`}>{notif.title}</p>
                                            </div>
                                            <p className="text-xs text-gray-600 dark:text-gray-300 font-medium leading-snug">{notif.message}</p>
                                        </div>
                                        <ChevronRight size={14} className="text-gray-300 flex-shrink-0 mt-1" />
                                    </Link>
                                );
                            })
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="p-3 border-t border-gray-100 dark:border-gray-800 text-center">
                            <button onClick={fetchNotifications} className="text-xs font-bold text-[#3498DB] hover:underline">
                                Cusboonaysii
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
