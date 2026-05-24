'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    History,
    Users,
    Settings,
    Truck,
    CreditCard,
    FileBarChart,
    LogOut,
    Menu,
    X,
    Briefcase,
    FileText,
    Landmark,
    Banknote,
    ShieldCheck
} from 'lucide-react';

interface SidebarItemProps {
    icon: any;
    label: string;
    href: string;
    active: boolean;
    collapsed: boolean;
    onClick?: () => void;
}

const SidebarItem = ({ icon: Icon, label, href, active, collapsed, onClick }: SidebarItemProps) => {
    return (
        <Link
            href={href}
            onClick={onClick}
            className={`
                flex items-center px-3 py-2.5 my-1 rounded-[14px] transition-all duration-300 group relative overflow-hidden
                ${active
                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold ring-1 ring-blue-500/20 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white font-medium'
                }
                ${collapsed ? 'justify-center' : ''}
            `}
        >


            {!active && (
                <Icon
                    size={22}
                    strokeWidth={2}
                    className={`
                        flex-shrink-0 z-10 transition-all duration-300 group-hover:scale-110 group-hover:text-green-500
                        ${collapsed ? '' : 'mr-3.5'}
                    `}
                />
            )}
            {active && (
                <Icon
                    size={22}
                    strokeWidth={2.5}
                    className={`
                        flex-shrink-0 z-10 transition-all duration-300 group-hover:scale-110
                        ${collapsed ? '' : 'mr-3.5'}
                    `}
                />
            )}

            {!collapsed && (
                <span className={`font-bold text-sm tracking-wide z-10 whitespace-nowrap overflow-hidden transition-all duration-300`}>
                    {label}
                </span>
            )}

            {/* Tooltip for collapsed mode */}
            {collapsed && (
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-[#1e293b] text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-50 whitespace-nowrap shadow-xl border border-white/10 translate-x-1 group-hover:translate-x-0">
                    {label}
                </div>
            )}
        </Link>
    );
};

import { useSession } from 'next-auth/react';

// ... types
interface ShopSidebarProps {
    mobileOpen?: boolean;
    setMobileOpen?: (open: boolean) => void;
}

export default function ShopSidebar({ mobileOpen = false, setMobileOpen }: ShopSidebarProps) {
    const { data: session } = useSession();
    const user = session?.user;

    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);
    // const [mobileOpen, setMobileOpen] = useState(false); // REMOVED local state
    const [isMobile, setIsMobile] = useState(false);

    // Detect mobile
    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 1024;
            setIsMobile(mobile);
            // Auto collapse on small screens if not explicitly mobile view (tablet)
            if (!mobile && window.innerWidth < 1280) {
                setCollapsed(true);
            } else if (!mobile && window.innerWidth >= 1280) {
                setCollapsed(false);
            }

            if (!mobile && setMobileOpen) {
                setMobileOpen(false);
            }
        };
        handleResize(); // Init
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [setMobileOpen]);

    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', href: '/shop/dashboard' },
        { icon: ShoppingCart, label: 'Point of Sale', href: '/shop/pos' },
        { icon: FileText, label: 'Manual Entry', href: '/shop/manual-entry' },
        { icon: Package, label: 'Inventory', href: '/shop/inventory' },
        { icon: History, label: 'Sales History', href: '/shop/sales' },
        { icon: Truck, label: 'Purchases', href: '/shop/purchases' },
        { icon: Landmark, label: 'Accounting', href: '/shop/accounting' },
        { icon: Users, label: 'Customers', href: '/shop/customers' },
        { icon: Truck, label: 'Vendors', href: '/shop/vendors' },
        { icon: Briefcase, label: 'Employees', href: '/shop/employees' },
        { icon: Banknote, label: 'Payroll', href: '/shop/payroll' },
        { icon: FileBarChart, label: 'Reports', href: '/shop/reports' },
        { icon: Settings, label: 'Settings', href: '/shop/settings' },
    ];

    // Add Super Admin for the specific user ID
    if ((user as any)?.id === process.env.NEXT_PUBLIC_SUPER_ADMIN_ID) {
        menuItems.push({ icon: ShieldCheck, label: 'Super Admin', href: '/admin/super-dashboard' });
    }

    const handleMobileClose = () => {
        if (setMobileOpen) setMobileOpen(false);
    };

    return (
        <>
            {/* Mobile Overlay */}
            {isMobile && mobileOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
                    onClick={handleMobileClose}
                />
            )}

            {/* Mobile Toggle Button REMOVED - Controlled by Header now */}

            {/* Sidebar Container */}
            <aside
                className={`
                    fixed lg:static inset-y-0 left-0 z-50
                    h-full lg:h-screen
                    bg-white dark:bg-[#0f172a] border-r border-gray-200 dark:border-gray-800
                    bg-gradient-to-b from-white to-gray-50 dark:from-[#0f172a] dark:to-[#0b1120]
                    transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
                    shadow-2xl lg:shadow-none
                    ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                    ${collapsed ? 'lg:w-[5.5rem]' : 'lg:w-[17rem]'}
                    w-64
                    flex-shrink-0
                    flex flex-col
                `}
            >
                {/* Logo Area */}
                <div className="h-20 flex-shrink-0 flex items-center justify-between px-5 border-b border-gray-100 dark:border-gray-800/60">
                    {!collapsed && (
                        <div className="flex flex-col">
                            <span className="text-xl font-black text-gray-900 dark:text-white tracking-tighter">
                                REVL<span className="text-green-500">O</span>
                            </span>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-0.5">Shop Manager</span>
                        </div>
                    )}
                    {collapsed && (
                        <div className="w-full flex justify-center">
                            <span className="text-xl font-black text-green-500">RV</span>
                        </div>
                    )}

                    {/* Desktop Collapse Toggle */}
                    {!isMobile && (
                        <button
                            onClick={() => setCollapsed(!collapsed)}
                            className={`
                                p-2 rounded-xl text-gray-400 hover:text-[#3498DB] hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all
                                ${collapsed ? 'mx-auto' : ''}
                            `}
                        >
                            {collapsed ? <Menu size={20} /> : <X size={20} />}
                        </button>
                    )}

                    {/* Mobile Close Button */}
                    {isMobile && (
                        <button
                            onClick={() => setMobileOpen && setMobileOpen(false)}
                            className="p-2 text-gray-400 hover:text-red-500"
                        >
                            <X size={24} />
                        </button>
                    )}
                </div>

                {/* Navigation Items */}
                <div className="flex-1 overflow-y-auto py-6 px-4 custom-scrollbar space-y-1">
                    {menuItems.map((item) => (
                        <SidebarItem
                            key={item.href}
                            icon={item.icon}
                            label={item.label}
                            href={item.href}
                            active={pathname === item.href}
                            collapsed={collapsed}
                            onClick={() => isMobile && setMobileOpen && setMobileOpen(false)}
                        />
                    ))}
                </div>

                {/* Footer / User Profile Summary */}
                <div className="p-4 border-t border-gray-100 dark:border-gray-800/60 bg-gray-50/50 dark:bg-[#0b1120]/50">
                    <Link href="/shop/profile" className={`w-full flex items-center ${collapsed ? 'justify-center' : 'justify-start'} gap-3 p-2 rounded-xl hover:bg-white dark:hover:bg-gray-800 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-700 group`}>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#F39C12] to-[#E67E22] flex items-center justify-center text-white font-bold shadow-lg shadow-orange-500/20">
                            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'U'}
                        </div>
                        {!collapsed && (
                            <div className="text-left overflow-hidden">
                                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user?.name || 'User'}</p>
                                <p className="text-xs text-green-500 font-medium flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Online
                                </p>
                            </div>
                        )}
                    </Link>
                </div>
            </aside>
        </>
    );
}
