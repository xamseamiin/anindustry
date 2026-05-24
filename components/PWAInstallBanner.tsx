'use client';

import React, { useState, useEffect } from 'react';
import { Download, X, Share } from 'lucide-react';

export default function PWAInstallBanner() {
    const [showBanner, setShowBanner] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // Hubi in horay loo damiyay 7-dii maalmood ee la soo dhaafay
        const lastDismissed = localStorage.getItem('pwa_banner_dismissed');
        if (lastDismissed) {
            const daysSinceDismissed = (new Date().getTime() - Number(lastDismissed)) / (1000 * 3600 * 24);
            if (daysSinceDismissed < 7) return; // Qari muddo 7 maalmood ah
        }

        // Hubi inuu yahay Standalone (Horey loo xareeyay)
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
        if (isStandalone) return;

        // Hubi PWA prompt-ga rasmiga ah (Android/Chrome)
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            (window as any).deferredPrompt = e; // Expose globally for /download page
            window.dispatchEvent(new Event('pwa-prompt-ready')); // Notify listeners
            setShowBanner(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Hubi haduu yahay iOS/iPhone (Apple mayeesho beforeinstallprompt)
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
        if (isIOSDevice) {
            setIsIOS(true);
            setShowBanner(true);
        }

        // Check standalone fallback
        window.addEventListener('appinstalled', () => {
            setShowBanner(false);
        });

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt && !isIOS) return;

        if (isIOS) {
            // Tilmaan Apple ahaan inuu u samaysto (No API limits it)
            alert("Si aad App-ka u dagsato: Guji calaamadda 'Share' (Qeybta hoose) ka dibna dooro 'Add to Home Screen'.");
            return;
        }

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setShowBanner(false);
        }
        setDeferredPrompt(null);
    };

    const handleDismiss = () => {
        setShowBanner(false);
        localStorage.setItem('pwa_banner_dismissed', new Date().getTime().toString());
    };

    if (!showBanner) return null;

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[95%] max-w-md animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="bg-gradient-to-br from-gray-900 via-[#0f172a] to-[#1e293b] border border-blue-500/30 rounded-3xl p-5 shadow-[0_20px_50px_rgba(8,_112,_184,_0.4)] backdrop-blur-2xl">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl text-white shadow-lg shadow-blue-500/40 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-white/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            {isIOS ? <Share size={24} /> : <Download size={24} className="animate-bounce" />}
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-white tracking-tight leading-tight">Ku Rakib Taleefankaaga</h3>
                            <p className="text-[11px] text-gray-400 font-medium mt-0.5 leading-tight">
                                {isIOS ? "Dooro Share -> 'Add to Home Screen'." : "Sida App caadi ah ugu shubo Revlo si dhaqso ah."}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                        <button
                            onClick={handleInstallClick}
                            className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-black rounded-xl transition-all shadow-lg shadow-blue-500/20 uppercase tracking-widest active:scale-95"
                        >
                            {isIOS ? 'Sida Loo Dagsado' : 'Install'}
                        </button>
                        <button
                            onClick={handleDismiss}
                            className="p-2.5 bg-white/5 text-gray-400 hover:text-white hover:bg-red-500/20 rounded-xl transition-colors"
                            title="Ha i tusin mar kale"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
