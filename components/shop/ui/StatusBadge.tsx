'use client';

import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Clock, RotateCcw, Truck, AlertOctagon, Info } from 'lucide-react';

interface StatusBadgeProps {
    status: string;
    type?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
}

/**
 * --- STATUS BADGE ---
 * Automatically maps common status strings to icons/colors, or allows manual type override.
 */
export default function StatusBadge({ status, type }: StatusBadgeProps) {

    // Auto-detect type based on status string if not provided
    let detectedType = type;
    if (!detectedType) {
        const s = status.toLowerCase();
        if (s.includes('completed') || s.includes('active') || s.includes('paid') || s.includes('in stock') || s.includes('received')) detectedType = 'success';
        else if (s.includes('pending') || s.includes('low') || s.includes('on hold') || s.includes('ordered')) detectedType = 'warning';
        else if (s.includes('cancelled') || s.includes('out') || s.includes('refunded') || s.includes('terminated') || s.includes('inactive')) detectedType = 'danger';
        else detectedType = 'neutral';
    }

    const styles = {
        success: 'bg-[#2ECC71]/10 text-[#2ECC71] border-[#2ECC71]/20',
        warning: 'bg-[#F39C12]/10 text-[#F39C12] border-[#F39C12]/20',
        danger: 'bg-red-500/10 text-red-500 border-red-500/20',
        info: 'bg-[#3498DB]/10 text-[#3498DB] border-[#3498DB]/20',
        neutral: 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
    };

    const icons = {
        success: CheckCircle2,
        warning: AlertTriangle,
        danger: XCircle,
        info: Info,
        neutral: Clock
    };

    // Override specific icons for specific statuses
    let Icon = icons[detectedType as keyof typeof icons] || Info;
    const s = status.toLowerCase();
    if (s.includes('pending')) Icon = Clock;
    if (s.includes('ordered')) Icon = Truck;
    if (s.includes('refunded')) Icon = RotateCcw;

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${styles[detectedType as keyof typeof styles]} whitespace-nowrap`}>
            <Icon size={14} strokeWidth={2.5} />
            {status}
        </span>
    );
}
