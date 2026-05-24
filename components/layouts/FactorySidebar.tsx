'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import {
    LayoutDashboard,
    ClipboardList,
    Database,
    Factory,
    CheckCircle2,
    ShoppingCart,
    BadgeDollarSign,
    Wallet,
    Users,
    Briefcase,
    LogOut,
    Shield,
    Lock,
    User as UserIcon,
    Settings,
    UserCircle
} from 'lucide-react';

interface FactorySidebarProps {
    isCollapsed: boolean;
    currentUser: any;
    handleLogout: () => void;
    setIsSidebarOpen?: (isOpen: boolean) => void;
}

const FactorySidebar: React.FC<FactorySidebarProps> = ({
    isCollapsed,
    currentUser,
    handleLogout,
    setIsSidebarOpen
}) => {
    const pathname = usePathname();

    const handleNavClick = () => {
        if (setIsSidebarOpen) setIsSidebarOpen(false);
    };

    const { t } = useLanguage();

    const menuItems = [
        { name: t.sidebar.dashboard, href: '/manufacturing', icon: <LayoutDashboard size={20} /> },
        { name: t.sidebar.purchases, href: '/manufacturing/material-purchases', icon: <ShoppingCart size={20} /> },
        { name: t.sidebar.rawStock, href: '/manufacturing/inventory/raw', icon: <Database size={20} /> },
        { name: t.sidebar.products, href: '/manufacturing/products', icon: <ClipboardList size={20} /> },
        { name: t.sidebar.manufacturing, href: '/manufacturing/production-orders', icon: <Factory size={20} /> },
        { name: t.sidebar.finishedGoods, href: '/manufacturing/inventory/finished', icon: <CheckCircle2 size={20} /> },
        { name: t.sidebar.salesHub, href: '/manufacturing/sales', icon: <BadgeDollarSign size={20} /> },
        { name: t.sidebar.financialHub, href: '/manufacturing/reports', icon: <Briefcase size={20} /> },
        { name: t.sidebar.accountingHub, href: '/manufacturing/accounting', icon: <Wallet size={20} /> },
        { name: t.sidebar.fiscalControl, href: '/manufacturing/fiscal', icon: <Lock size={20} /> },
        { name: t.sidebar.auditLogs, href: '/manufacturing/audit', icon: <Shield size={20} /> },
        { name: t.sidebar.employees, href: '/manufacturing/employees', icon: <Users size={20} /> },
        { name: t.sidebar.suppliers, href: '/manufacturing/vendors', icon: <UserIcon size={20} /> },
        { name: t.sidebar.customerHub, href: '/manufacturing/customers', icon: <Users size={20} /> },
        { name: t.sidebar.settings, href: '/manufacturing/settings', icon: <Settings size={20} /> },
        { name: t.sidebar.profile, href: '/manufacturing/profile', icon: <UserCircle size={20} /> },
    ];

    return (
        <div className={`flex flex-col h-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-800 transition-colors duration-300`}>
            {/* Branding */}
            <div className={`h-[80px] flex items-center ${isCollapsed ? 'justify-center' : 'px-6'} border-b border-slate-100 dark:border-slate-800/50`}>
                {isCollapsed ? (
                    <div className="w-12 h-12 relative flex items-center justify-center bg-white rounded-xl shadow-lg shadow-emerald-500/10 p-1 border border-slate-100 dark:border-slate-800">
                        <Image src="/an-logo-combined.png" alt="AN Logo" fill className="object-contain p-1" />
                    </div>
                ) : (
                    <div className="flex items-center w-full">
                        <div className="relative w-full h-16 bg-white rounded-xl shadow-sm flex items-center justify-center overflow-hidden">
                            <Image 
                                src="/an-logo-combined.png" 
                                alt="AN Industory Logo" 
                                fill 
                                className="object-contain p-1"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1.5 scrollbar-hide">
                <ul className="space-y-1">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <li key={item.name}>
                                <Link
                                    href={item.href}
                                    onClick={handleNavClick}
                                    className={`
                                        flex items-center px-4 py-3 rounded-xl transition-all duration-200 group relative
                                        ${isActive
                                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 font-bold'
                                            : 'text-slate-500 dark:text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 font-medium'}
                                        ${isCollapsed ? 'justify-center' : ''}
                                    `}
                                >
                                    <span className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                                        {item.icon}
                                    </span>
                                    {!isCollapsed && (
                                        <span className="ml-3 text-sm tracking-tight">{item.name}</span>
                                    )}

                                    {isCollapsed && (
                                        <div className="absolute left-full ml-4 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all whitespace-nowrap z-50 border border-slate-700">
                                            {item.name}
                                        </div>
                                    )}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* User Profile / Logout */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/30">
                <button
                    onClick={handleLogout}
                    className={`flex items-center gap-3 w-full p-2.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all ${isCollapsed ? 'justify-center' : ''}`}
                >
                    <LogOut size={20} />
                    {!isCollapsed && <span className="font-bold text-sm">{t.sidebar.logout}</span>}
                </button>
            </div>
        </div>
    );
};

export default FactorySidebar;
