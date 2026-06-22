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
    UserCircle,
    Video,
    DollarSign
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
        { name: t.sidebar.dashboard, href: '/manufacturing', icon: <LayoutDashboard size={15} /> },
        { name: t.sidebar.purchases, href: '/manufacturing/material-purchases', icon: <ShoppingCart size={15} /> },
        { name: t.sidebar.rawStock, href: '/manufacturing/inventory/raw', icon: <Database size={15} /> },
        { name: t.sidebar.products, href: '/manufacturing/products', icon: <ClipboardList size={15} /> },
        { name: t.sidebar.manufacturing, href: '/manufacturing/production-orders', icon: <Factory size={15} /> },
        { name: t.sidebar.finishedGoods, href: '/manufacturing/inventory/finished', icon: <CheckCircle2 size={15} /> },
        { name: t.sidebar.salesHub, href: '/manufacturing/sales', icon: <BadgeDollarSign size={15} /> },
        { name: t.sidebar.financialHub, href: '/manufacturing/reports', icon: <Briefcase size={15} /> },
        { name: t.sidebar.accountingHub, href: '/manufacturing/accounting', icon: <Wallet size={15} /> },
        { name: t.sidebar.expenses, href: '/manufacturing/expenses', icon: <DollarSign size={15} /> },
        { name: t.sidebar.fiscalControl, href: '/manufacturing/fiscal', icon: <Lock size={15} /> },
        { name: t.sidebar.auditLogs, href: '/manufacturing/audit', icon: <Shield size={15} /> },
        { name: t.sidebar.employees, href: '/manufacturing/employees', icon: <Users size={15} /> },
        { name: t.sidebar.suppliers, href: '/manufacturing/vendors', icon: <UserIcon size={15} /> },
        { name: t.sidebar.customerHub, href: '/manufacturing/customers', icon: <Users size={15} /> },
        { name: t.sidebar.cctvCounter, href: '/manufacturing/cctv-counter', icon: <Video size={15} /> },
        { name: t.sidebar.settings, href: '/manufacturing/settings', icon: <Settings size={15} /> },
        { name: t.sidebar.profile, href: '/manufacturing/profile', icon: <UserCircle size={15} /> },
    ];

    return (
        <div className={`flex flex-col h-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-800 transition-colors duration-300`}>
            {/* Branding */}
            <div className={`h-[60px] flex items-center ${isCollapsed ? 'justify-center' : 'px-4'} border-b border-slate-100 dark:border-slate-800/50`}>
                {isCollapsed ? (
                    <div className="w-10 h-10 relative flex items-center justify-center bg-white rounded-lg shadow-lg shadow-emerald-500/10 p-1 border border-slate-100 dark:border-slate-800">
                        <Image src="/an-logo-combined.png" alt="AN Logo" fill className="object-contain p-1" />
                    </div>
                ) : (
                    <div className="flex items-center w-full">
                        <div className="relative w-full h-10 bg-white rounded-lg shadow-sm flex items-center justify-center overflow-hidden">
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
            <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 scrollbar-hide">
                <ul className="space-y-0.5">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <li key={item.name}>
                                <Link
                                    href={item.href}
                                    onClick={handleNavClick}
                                    className={`
                                        flex items-center px-3 py-2 rounded-lg transition-all duration-200 group relative
                                        ${isActive
                                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 font-bold'
                                            : 'text-slate-500 dark:text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 font-medium'}
                                        ${isCollapsed ? 'justify-center' : ''}
                                    `}
                                >
                                    <span className={`transition-transform duration-200 ${isActive ? 'scale-105' : 'group-hover:scale-105'}`}>
                                        {item.icon}
                                    </span>
                                    {!isCollapsed && (
                                        <span className="ml-2.5 text-xs tracking-tight">{item.name}</span>
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
            <div className="p-3 border-t border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/30">
                <button
                    onClick={handleLogout}
                    className={`flex items-center gap-2.5 w-full p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all ${isCollapsed ? 'justify-center' : ''}`}
                >
                    <LogOut size={16} />
                    {!isCollapsed && <span className="font-bold text-xs">{t.sidebar.logout}</span>}
                </button>
            </div>
        </div>
    );
};

export default FactorySidebar;
