'use client';

import React, { useEffect } from 'react';
import { Search, User, Menu, ChevronDown, Globe } from 'lucide-react';
import { useShopLang } from '@/contexts/ShopLanguageContext';
import ShopNotificationBell from '@/components/shop/ShopNotificationBell';

export default function ShopHeader({ onMenuClick }: { onMenuClick?: () => void }) {
    const { lang, toggle, t } = useShopLang();

    // ✅ Force Somali as default — only runs once on first visit
    useEffect(() => {
        const stored = localStorage.getItem('shop-lang');
        if (!stored) {
            localStorage.setItem('shop-lang', 'so');
        }
    }, []);

    return (
        <header className="h-20 bg-white/70 dark:bg-[#111827]/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 sticky top-0 z-40 px-6 flex items-center justify-between transition-all duration-300">
            {/* Mobile Menu Toggle */}
            <button
                onClick={onMenuClick}
                className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
            >
                <Menu size={24} />
            </button>

            {/* Search Bar */}
            <div className="hidden md:flex items-center flex-1 max-w-lg ml-0 lg:ml-4">
                <div className="relative w-full group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400 group-focus-within:text-[#3498DB] transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder={t('search_placeholder')}
                        className="block w-full pl-11 pr-4 py-3 border border-transparent bg-gray-100/50 dark:bg-gray-800/50 rounded-2xl leading-5 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:bg-white dark:focus:bg-[#1f2937] focus:ring-2 focus:ring-[#3498DB]/20 focus:border-[#3498DB] shadow-inner transition-all duration-300 sm:text-sm font-medium"
                    />
                </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-3 lg:gap-4">

                {/* ===== LANGUAGE TOGGLE PILL ===== */}
                <div className="flex items-center rounded-xl border-2 border-[#3498DB]/40 overflow-hidden shadow-sm hover:border-[#3498DB] transition-all duration-200 bg-white dark:bg-[#1f2937]">
                    {/* SO side */}
                    <button
                        onClick={lang === 'en' ? toggle : undefined}
                        title="Soomaali"
                        className={`
                            flex items-center gap-1 px-3.5 py-2 text-xs font-black tracking-widest transition-all duration-200
                            ${lang === 'so'
                                ? 'bg-[#3498DB] text-white cursor-default'
                                : 'text-gray-400 hover:text-[#3498DB] cursor-pointer hover:bg-[#3498DB]/5'
                            }
                        `}
                    >
                        <Globe size={12} className={lang === 'so' ? 'text-white' : 'text-[#3498DB]/60'} />
                        SO
                    </button>

                    {/* Separator */}
                    <div className="w-px h-6 bg-[#3498DB]/25" />

                    {/* EN side */}
                    <button
                        onClick={lang === 'so' ? toggle : undefined}
                        title="English"
                        className={`
                            flex items-center gap-1 px-3.5 py-2 text-xs font-black tracking-widest transition-all duration-200
                            ${lang === 'en'
                                ? 'bg-[#3498DB] text-white cursor-default'
                                : 'text-gray-400 hover:text-[#3498DB] cursor-pointer hover:bg-[#3498DB]/5'
                            }
                        `}
                    >
                        EN
                    </button>
                </div>
                {/* =============================== */}

                {/* Smart Notifications Bell */}
                <ShopNotificationBell />

                {/* User Profile */}
                <div className="flex items-center gap-3 pl-2 sm:pl-4 border-l border-gray-200 dark:border-gray-800">
                    <button className="flex items-center gap-3 group focus:outline-none">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#3498DB] to-[#2980B9] flex items-center justify-center text-white shadow-lg shadow-blue-500/20 ring-2 ring-transparent group-hover:ring-[#3498DB]/30 transition-all">
                            <User size={20} strokeWidth={2.5} />
                        </div>
                        <div className="hidden md:block text-left">
                            <p className="text-sm font-bold text-gray-900 dark:text-gray-100 group-hover:text-[#3498DB] transition-colors">
                                {t('shop_manager')}
                            </p>
                            <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                {t('admin')}
                            </p>
                        </div>
                        <ChevronDown size={16} className="text-gray-400 hidden md:block group-hover:text-[#3498DB] transition-colors" />
                    </button>
                </div>
            </div>
        </header>
    );
}
