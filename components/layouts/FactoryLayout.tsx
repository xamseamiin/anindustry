'use client';

import React, { useState } from 'react';
import FactorySidebar from './FactorySidebar';
import { useUser } from '@/components/providers/UserProvider';
import { Menu, Bell, Search, User as UserIcon } from 'lucide-react';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Globe } from 'lucide-react';
import ShopAiChat from '@/components/shop/ShopAiChat';

export default function FactoryLayout({ children }: { children: React.ReactNode }) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const { language, setLanguage } = useLanguage();
    const { user, logout } = useUser();

    const currentUser = user ? {
        id: user.id,
        name: user.fullName || 'User',
        email: user.email || '',
        avatar: user.fullName?.charAt(0).toUpperCase() || 'U',
        role: user.role
    } : null;

    if (!user) return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
            <p className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Authenticating AN-Industory...</p>
        </div>
    );

    return (
        <NotificationProvider>
                <div className="flex h-screen overflow-hidden font-sans relative">
                    
                    {/* Dynamic Mesh Background */}
                    <div className="bg-mesh">
                        <div className="mesh-blob w-[500px] h-[500px] bg-emerald-400 -top-20 -left-20 animate-float" />
                        <div className="mesh-blob w-[600px] h-[600px] bg-blue-400 bottom-0 -right-20 animate-float-delayed" />
                    </div>

                    {/* Desktop Sidebar */}
                    <div className={`hidden md:block transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-56'} flex-shrink-0 relative z-20`}>
                        <FactorySidebar
                            isCollapsed={sidebarCollapsed}
                            currentUser={currentUser}
                            handleLogout={logout}
                        />
                        <button
                            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                            className="absolute -right-3 top-20 w-6 h-6 bg-white dark:bg-slate-800 rounded-full text-slate-400 hover:text-emerald-500 flex items-center justify-center shadow-md border border-slate-200 dark:border-slate-700 hover:scale-110 transition-all z-50"
                        >
                            <span className="text-[10px] font-bold">{sidebarCollapsed ? '→' : '←'}</span>
                        </button>
                    </div>

                    {/* Mobile Sidebar Overlay */}
                    {mobileSidebarOpen && (
                        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden transition-opacity" onClick={() => setMobileSidebarOpen(false)} />
                    )}
                    <div className={`fixed inset-y-0 left-0 w-56 transform transition-transform duration-300 z-50 md:hidden ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                        <FactorySidebar
                            isCollapsed={false}
                            currentUser={currentUser}
                            handleLogout={logout}
                            setIsSidebarOpen={setMobileSidebarOpen}
                        />
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">

                        {/* Top Header */}
                        <header className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 h-[56px] flex items-center justify-between px-6 z-10">
                            <div className="flex items-center gap-4">
                                <button
                                    className="p-2 -ml-2 text-slate-500 md:hidden hover:bg-slate-100 rounded-xl transition-colors"
                                    onClick={() => setMobileSidebarOpen(true)}
                                >
                                    <Menu size={24} />
                                </button>
                                <div className="hidden md:flex items-center gap-2 text-slate-400 bg-slate-100/50 dark:bg-slate-800/50 px-4 py-2 rounded-xl w-64 md:w-96 border border-transparent focus-within:border-emerald-500/30 focus-within:bg-white dark:focus-within:bg-slate-800 transition-all">
                                    <Search size={18} />
                                    <input
                                        type="text"
                                        placeholder={`${language === 'so' ? 'Raadi' : 'Search'} AN-Industory...`}
                                        className="bg-transparent border-none outline-none text-sm w-full text-slate-900 dark:text-white placeholder-slate-400 font-medium"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                {/* Global Language Switcher */}
                                <div className="relative">
                                    <button
                                        onClick={() => setLanguage(language === 'so' ? 'en' : 'so')}
                                        className="p-2 text-slate-500 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-xl transition-all relative flex items-center gap-1.5 cursor-pointer"
                                        title={language === 'so' ? 'Switch to English' : 'U beddel Soomaali'}
                                    >
                                        <Globe size={20} />
                                        <span className={`text-[10px] font-black uppercase text-white px-1.5 py-0.5 rounded-md ${language === 'so' ? 'bg-emerald-500' : 'bg-blue-500'}`}>
                                            {language === 'so' ? 'SO' : 'EN'}
                                        </span>
                                    </button>
                                </div>

                                <button className="relative p-2 text-slate-500 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-xl transition-all">
                                    <Bell size={20} />
                                    <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900"></span>
                                </button>
                                
                                <div className="flex items-center gap-3 pl-6 border-l border-slate-200 dark:border-slate-800">
                                    <div className="text-right hidden md:block">
                                        <p className="text-sm font-black text-slate-900 dark:text-white leading-none">{currentUser?.name}</p>
                                        <p className="text-[10px] text-emerald-500 uppercase tracking-widest font-black mt-1">{currentUser?.role}</p>
                                    </div>
                                    <div className="w-10 h-10 rounded-xl bg-brand-gradient p-[2px] shadow-lg shadow-emerald-500/20">
                                        <div className="w-full h-full rounded-[9px] bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden">
                                            {currentUser?.avatar === 'U' ? <UserIcon size={20} className="text-slate-400" /> : (
                                                <img src={currentUser?.avatar} alt="User" className="w-full h-full object-cover" />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </header>

                        {/* Page Content */}
                        <main className="flex-1 overflow-y-auto relative scrollbar-hide p-4 md:p-6">
                            <div className="max-w-[1920px] mx-auto w-full">
                                {children}
                            </div>
                        </main>

                        {/* AI Assistant Chatbot */}
                        <ShopAiChat />
                    </div>
                </div>
            </NotificationProvider>
    );
}
