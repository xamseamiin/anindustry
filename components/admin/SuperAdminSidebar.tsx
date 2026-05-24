'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Building2, 
  CreditCard, 
  Users, 
  Settings, 
  ShieldCheck,
  ChevronRight,
  LogOut,
  BarChart3,
  MessageSquare
} from 'lucide-react';

const menuItems = [
  { icon: LayoutDashboard, label: 'Overview', href: '/admin/super-dashboard' },
  { icon: CreditCard, label: 'Payment Requests', href: '/admin/super-dashboard/payments' },
  { icon: Building2, label: 'Manage Shops', href: '/admin/super-dashboard/shops' },
  { icon: BarChart3, label: 'Analytics & Finance', href: '/admin/super-dashboard/analytics' },
  { icon: MessageSquare, label: 'Messages', href: '/admin/super-dashboard/messages' },
  { icon: Users, label: 'System Users', href: '/admin/super-dashboard/users' },
  { icon: ShieldCheck, label: 'Audit Logs', href: '/admin/super-dashboard/audit-logs' },
  { icon: Settings, label: 'Settings', href: '/admin/super-dashboard/settings' },
];

export default function SuperAdminSidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-white dark:bg-[#151C2C] border-r border-gray-100 dark:border-gray-800 flex flex-col h-full overflow-y-auto">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-red-500/20">
          <ShieldCheck size={24} />
        </div>
        <div>
          <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tighter">Super Admin</h2>
          <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Revlo Central</p>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1 mt-4">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive 
                  ? 'bg-red-50 dark:bg-red-900/10 text-red-600' 
                  : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon size={18} className={isActive ? 'text-red-500' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'} />
                <span className="text-xs font-bold">{item.label}</span>
              </div>
              {isActive && <ChevronRight size={14} />}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto border-t border-gray-100 dark:border-gray-800">
        <Link 
          href="/shop/dashboard"
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-600 transition-all"
        >
          <LogOut size={18} />
          <span className="text-xs font-bold">Exit Admin</span>
        </Link>
      </div>
    </div>
  );
}
