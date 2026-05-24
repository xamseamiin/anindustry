// components/Sidebar.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Database, 
  Factory, 
  CheckCircle2, 
  BadgeDollarSign, 
  Users, 
  Wallet,
  Briefcase,
  X,
  Menu,
  Settings,
  UserCircle
} from 'lucide-react';
import Brand from './Brand';

interface NavItemProps {
  name: string;
  href: string;
  icon: React.ReactNode;
  isCollapsed: boolean;
  isActive: boolean;
  onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ name, href, icon, isCollapsed, isActive, onClick }) => (
  <li>
    <Link
      href={href}
      onClick={onClick}
      className={`
        flex items-center space-x-3 py-3 px-4 rounded-xl transition-all duration-200 group relative
        ${isActive 
          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' 
          : 'text-slate-400 hover:text-white hover:bg-slate-800'
        }
      `}
    >
      <div className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
        {icon}
      </div>
      {!isCollapsed && (
        <span className="font-bold text-sm tracking-tight">
          {name}
        </span>
      )}
      {isCollapsed && (
        <div className="absolute left-full ml-4 w-auto bg-slate-900 text-white text-xs px-2 py-1.5 rounded-md whitespace-nowrap opacity-0 invisible group-hover:visible group-hover:opacity-100 transition-all z-50 shadow-xl border border-slate-700">
          {name}
        </div>
      )}
    </Link>
  </li>
);

interface SidebarProps {
  setIsSidebarOpen: (isOpen: boolean) => void;
  isCollapsed: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ setIsSidebarOpen, isCollapsed }) => {
  const pathname = usePathname();
  
  const navItems = [
    { name: 'Dashboard', href: '/manufacturing', icon: <LayoutDashboard size={20} /> },
    { name: 'Purchases', href: '/manufacturing/material-purchases', icon: <ShoppingCart size={20} /> },
    { name: 'Raw Materials', href: '/manufacturing/inventory/raw', icon: <Database size={20} /> },
    { name: 'Manufacturing', href: '/manufacturing/production-orders', icon: <Factory size={20} /> },
    { name: 'Finished Goods', href: '/manufacturing/inventory/finished', icon: <CheckCircle2 size={20} /> },
    { name: 'Sales Hub', href: '/manufacturing/sales', icon: <BadgeDollarSign size={20} /> },
    { name: 'Financial Hub', href: '/manufacturing/reports', icon: <Briefcase size={20} /> },
    { name: 'Employees', href: '/manufacturing/employees', icon: <Users size={20} /> },
    { name: 'Settings', href: '/manufacturing/settings', icon: <Settings size={20} /> },
    { name: 'Profile', href: '/manufacturing/profile', icon: <UserCircle size={20} /> },
  ];

  return (
    <aside className={`h-full bg-[#0F172A] text-white p-4 flex flex-col justify-between shadow-2xl ${isCollapsed ? 'w-24' : 'w-72'} transition-all duration-300 ease-in-out border-r border-slate-800`}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex justify-between items-center mb-10 px-2 mt-2">
          <Brand isCollapsed={isCollapsed} />
          
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden text-slate-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto scrollbar-hide">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <NavItem
                key={item.name}
                {...item}
                isCollapsed={isCollapsed}
                isActive={pathname === item.href}
                onClick={() => setIsSidebarOpen(false)}
              />
            ))}
          </ul>
        </nav>

        {/* Footer info / Branding */}
        {!isCollapsed && (
          <div className="mt-auto pt-6 border-t border-slate-800">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-center">
              AN-Industory v2.0
            </p>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;