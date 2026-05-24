'use client';

import React, { useEffect, useState } from 'react';
import { Download, Share } from 'lucide-react';

export default function PWAInstallButton() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        // Check if already installed/standalone
        setIsStandalone(window.matchMedia('(display-mode: standalone)').matches);

        // Check if device is iOS
        setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream);

        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallClick = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setDeferredPrompt(null);
            }
        }
    };

    // If already installed, don't show anything
    if (isStandalone) return null;

    // iOS Instructions
    if (isIOS) {
        return (
            <button
                onClick={() => alert(`To install on iPhone/iPad:\n1. Tap the Share button below\n2. Scroll down and tap "Add to Home Screen"`)}
                className="group flex items-center justify-center gap-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 px-6 py-3 rounded-full font-bold text-sm hover:border-cyan-400 dark:hover:border-cyan-800 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-50/30 transition-all shadow-sm"
            >
                <Share size={18} /> Install App
            </button>
        );
    }

    // Android/Desktop Install Button
    if (!deferredPrompt) return null; // Don't show if browser doesn't support it or already handled

    return (
        <button
            onClick={handleInstallClick}
            className="group flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white px-8 py-3 rounded-full font-bold text-sm sm:text-base shadow-xl shadow-green-500/30 transition-all hover:scale-[1.02] active:scale-95 w-full sm:w-auto overflow-hidden animate-fade-in"
        >
            <Download size={18} className="group-hover:animate-bounce" />
            Ku shubo "Revlo App"
        </button>
    );
}
