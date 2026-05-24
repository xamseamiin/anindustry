'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { signOut } from 'next-auth/react';
import { Clock, AlertTriangle } from 'lucide-react';

interface AutoLogoutProps {
    enabled: boolean;
    timeoutMinutes?: number; // default 30
}

export default function AutoLogoutWatcher({ enabled, timeoutMinutes = 30 }: AutoLogoutProps) {
    const [showWarning, setShowWarning] = useState(false);
    const [countdown, setCountdown] = useState(60); // 60 second warning
    const timeoutRef = useRef<any>(null);
    const warningRef = useRef<any>(null);
    const countdownRef = useRef<any>(null);

    const timeoutMs = timeoutMinutes * 60 * 1000;
    const warningMs = timeoutMs - 60000; // Show warning 1 minute before logout

    const resetTimer = useCallback(() => {
        setShowWarning(false);
        setCountdown(60);

        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (warningRef.current) clearTimeout(warningRef.current);
        if (countdownRef.current) clearInterval(countdownRef.current);

        // Set warning timer
        warningRef.current = setTimeout(() => {
            setShowWarning(true);
            setCountdown(60);

            // Start countdown
            countdownRef.current = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(countdownRef.current);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }, warningMs);

        // Set logout timer
        timeoutRef.current = setTimeout(() => {
            signOut({ callbackUrl: '/login?reason=timeout' });
        }, timeoutMs);
    }, [timeoutMs, warningMs]);

    useEffect(() => {
        if (!enabled) return;

        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
        
        const handleActivity = () => {
            resetTimer();
        };

        events.forEach(event => window.addEventListener(event, handleActivity, { passive: true }));
        resetTimer();

        return () => {
            events.forEach(event => window.removeEventListener(event, handleActivity));
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            if (warningRef.current) clearTimeout(warningRef.current);
            if (countdownRef.current) clearInterval(countdownRef.current);
        };
    }, [enabled, resetTimer]);

    if (!enabled || !showWarning) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#161B2E] rounded-[2rem] p-8 max-w-sm mx-4 shadow-2xl text-center">
                <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="text-amber-500" size={32} />
                </div>
                <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2">Session Expiring</h2>
                <p className="text-sm text-gray-500 mb-6">
                    Nidaamku wuu is-xiri doonaa sabab la'aanta dhaqdhaqaaqa. Riix badhankan si aad u sii joogto.
                </p>

                <div className="flex items-center justify-center gap-2 mb-6">
                    <Clock size={18} className="text-amber-500" />
                    <span className="text-3xl font-black text-amber-600 tabular-nums">{countdown}s</span>
                </div>

                <button
                    onClick={resetTimer}
                    className="w-full py-4 bg-[#3498DB] hover:bg-[#2980B9] text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 transition-all active:scale-95 text-sm uppercase tracking-widest"
                >
                    Waan Joogaa — Sii Hay
                </button>
            </div>
        </div>
    );
}
