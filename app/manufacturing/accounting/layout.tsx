// app/manufacturing/accounting/layout.tsx - Premium Local Accounting Sidebar Layout
'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    History,
    ArrowUpRight,
    ArrowDownRight,
    DollarSign,
    Calendar,
    Wallet
} from 'lucide-react';

interface SidebarItemProps {
    name: string;
    href: string;
    icon: React.ComponentType<any>;
    active: boolean;
}

const SidebarItem = ({ name, href, icon: Icon, active }: SidebarItemProps) => (
    <button
        onClick={() => window.location.href = href}
        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
            active
            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-lg shadow-slate-900/10'
            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/70 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/50'
        }`}
    >
        <div className={`p-1.5 rounded-xl transition-all duration-300 ${
            active 
            ? 'bg-emerald-500 text-white' 
            : 'bg-slate-50 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
        }`}>
            <Icon size={16} />
        </div>
        <span>{name}</span>
    </button>
);

export default function AccountingLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    const menuItems = [
        {
            name: 'Dashboard / Hub',
            href: '/manufacturing/accounting',
            icon: LayoutDashboard,
            active: pathname === '/manufacturing/accounting' || pathname.startsWith('/manufacturing/accounting/accounts')
        },
        {
            name: 'Transactions Ledger',
            href: '/manufacturing/accounting/transactions',
            icon: History,
            active: pathname === '/manufacturing/accounting/transactions'
        },
        {
            name: 'Deymaha Macmiilka (Receivables)',
            href: '/manufacturing/accounting/receivables',
            icon: ArrowUpRight,
            active: pathname === '/manufacturing/accounting/receivables'
        },
        {
            name: 'Deymaha Lagugu Leeyahay (Payables)',
            href: '/manufacturing/accounting/payables',
            icon: ArrowDownRight,
            active: pathname === '/manufacturing/accounting/payables'
        },
        {
            name: 'Kharashyada (Expenses)',
            href: '/manufacturing/expenses',
            icon: DollarSign,
            active: pathname.startsWith('/manufacturing/expenses')
        },
        {
            name: 'Period Control (Fiscal)',
            href: '/manufacturing/fiscal',
            icon: Calendar,
            active: pathname.startsWith('/manufacturing/fiscal')
        }
    ];

    return (
        <div className="flex flex-col lg:flex-row gap-8 min-h-[80vh] items-stretch">
            {/* Local Accounting Sidebar */}
            <div className="w-full lg:w-[280px] shrink-0">
                <div className="card p-6 sticky top-24 space-y-6">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="p-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg">
                                <Wallet size={16} />
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Financial Suite</span>
                        </div>
                        <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight uppercase">Accounting Menu</h3>
                    </div>

                    <div className="space-y-1">
                        {menuItems.map((item, idx) => (
                            <SidebarItem
                                key={idx}
                                name={item.name}
                                href={item.href}
                                icon={item.icon}
                                active={item.active}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 min-w-0">
                {children}
            </div>
        </div>
    );
}
