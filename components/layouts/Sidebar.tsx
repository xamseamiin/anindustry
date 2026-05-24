'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard, Briefcase, DollarSign, Users, Truck,
  Settings, X, UserCircle, LogOut,
  Landmark, UserCogIcon, Shield, Calendar, Menu, Wrench, Factory,
  Package, BarChart3, Scissors, MessageCircle, ShoppingCart, Tag, Mail,
  ClipboardList, LayoutGrid, Hammer, Warehouse, HardDrive, Lock, CheckCircle
} from 'lucide-react';

import { usePathname } from 'next/navigation';

interface SidebarProps {
  setIsSidebarOpen: (open: boolean) => void;
  isCollapsed: boolean;
  currentTime?: Date;
  currentUser: any; // Using any for now to avoid extensive type imports, or refine if User type is available
  currentCompany: any;
  handleLogout: () => void;
  onNavItemClick?: () => void;
}

interface NavItemProps {
  name: string;
  href: string;
  icon: React.ReactNode;
  isCollapsed?: boolean;
  onClick?: () => void;
  badge?: number;
}

const NavItem: React.FC<NavItemProps> = ({ name, href, icon, isCollapsed, onClick, badge }) => {
  const pathname = usePathname();
  const isActive = pathname === href || pathname?.startsWith(`${href}/`);

  return (
    <li>
      <Link
        href={href}
        onClick={onClick}
        className={`
          flex items-center py-2.5 px-3 mx-2 rounded-xl transition-all duration-300 group relative
          ${isActive
            ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
            : 'text-gray-600 dark:text-gray-400 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 dark:hover:text-green-400'
          }
          ${isCollapsed ? 'justify-center' : 'justify-start space-x-3'}
        `}
      >
        <span className={`text-xl transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110 group-hover:-rotate-6'}`}>
          {icon}
        </span>

        {!isCollapsed && (
          <span className="font-medium text-sm truncate flex-1">
            {name}
          </span>
        )}

        {/* Badge */}
        {badge && !isCollapsed && (
          <span className={`${isActive ? 'bg-white text-green-600' : 'bg-red-500 text-white'} text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm`}>
            {badge}
          </span>
        )}

        {/* Tooltip for collapsed state */}
        {isCollapsed && (
          <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
            {name}
          </div>
        )}
      </Link>
    </li>
  );
};

const menuConfig = {
  SUPER_ADMIN: {
    main: [
      { name: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard />, group: 'Main' },
      { name: 'Super Admin', href: '/admin/super-dashboard', icon: <Shield />, group: 'Main', badge: 1 },
    ],
    projects: [
      { name: 'Projects', href: '/projects/main', icon: <Briefcase />, group: 'Projects' },
      { name: 'Employees', href: '/projects/employees', icon: <UserCogIcon />, group: 'Projects' },
      { name: 'Project Vendors', href: '/projects/vendors', icon: <Truck />, group: 'Projects' },
      { name: 'Project Customers', href: '/projects/customers', icon: <Users />, group: 'Projects' },
      { name: 'Project Expenses', href: '/projects/expenses', icon: <DollarSign />, group: 'Projects' },
      { name: 'Accounting', href: '/projects/accounting', icon: <Landmark />, group: 'Projects' },
      { name: 'Project Store', href: '/projects/inventory', icon: <Warehouse />, group: 'Projects' },
      { name: 'Workshop', href: '/workshop', icon: <Hammer />, group: 'Projects' },
    ],
    shop: [
      { name: 'Retail Shop', href: '/shop', icon: <ShoppingCart />, group: 'Shop' },
      { name: 'Shop Inventory', href: '/shop/inventory', icon: <Package />, group: 'Shop' },
      { name: 'Shop Reports', href: '/shop/reports', icon: <BarChart3 />, group: 'Shop' },
    ],
    manufacturing: [
      { name: 'Manufacturing', href: '/manufacturing', icon: <Factory />, group: 'Manufacturing' },
      { name: 'Factory Vendors', href: '/manufacturing/vendors', icon: <Truck />, group: 'Manufacturing' },
      { name: 'Factory Customers', href: '/manufacturing/customers', icon: <Users />, group: 'Manufacturing' },
      { name: 'Factory Expenses', href: '/manufacturing/expenses', icon: <DollarSign />, group: 'Manufacturing' },
      { name: 'Factory Materials', href: '/manufacturing/inventory', icon: <Factory />, group: 'Manufacturing' },
      { name: 'Factories List', href: '/manufacturing/factories', icon: <Factory />, group: 'Manufacturing' },
    ],
    reports: [
      { name: 'Project Reports', href: '/reports', icon: <BarChart3 />, group: 'Reports' },
    ],
    admin: [
      { name: 'Users', href: '/settings/users', icon: <Shield />, group: 'Administration' },
      { name: 'Messages', href: '/admin/super-dashboard/messages', icon: <Mail />, group: 'Administration' },
      { name: 'Period Locking', href: '/projects/accounting/periods', icon: <Lock />, group: 'Administration' },
      { name: 'Approvals', href: '/projects/accounting/approvals', icon: <CheckCircle />, group: 'Administration' },
      { name: 'Super Settings', href: '/admin/super-dashboard/settings', icon: <Wrench />, group: 'Administration' },
      { name: 'Download App', href: '/download', icon: <HardDrive />, group: 'Administration' },
    ]
  },
  ADMIN: {
    main: [
      { name: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard />, group: 'Main' },
    ],
    projects: [
      { name: 'Projects', href: '/projects/main', icon: <Briefcase />, group: 'Projects' },
      { name: 'Employees', href: '/projects/employees', icon: <UserCogIcon />, group: 'Projects' },
      { name: 'Project Vendors', href: '/projects/vendors', icon: <Truck />, group: 'Projects' },
      { name: 'Project Customers', href: '/projects/customers', icon: <Users />, group: 'Projects' },
      { name: 'Project Expenses', href: '/projects/expenses', icon: <DollarSign />, group: 'Projects', badge: 3 },
      { name: 'Accounting', href: '/projects/accounting', icon: <Landmark />, group: 'Projects' },
      { name: 'Project Store', href: '/projects/inventory', icon: <Warehouse />, group: 'Projects' },
      { name: 'Workshop', href: '/workshop', icon: <Hammer />, group: 'Projects' },
    ],
    shop: [
      { name: 'Retail Shop', href: '/shop', icon: <ShoppingCart />, group: 'Shop' },
      { name: 'Shop Inventory', href: '/shop/inventory', icon: <Package />, group: 'Shop' },
      { name: 'Shop Reports', href: '/shop/reports', icon: <BarChart3 />, group: 'Shop' },
    ],
    manufacturing: [
      { name: 'Manufacturing', href: '/manufacturing', icon: <Factory />, group: 'Manufacturing' },
      { name: 'Factory Vendors', href: '/manufacturing/vendors', icon: <Truck />, group: 'Manufacturing' },
      { name: 'Factory Customers', href: '/manufacturing/customers', icon: <Users />, group: 'Manufacturing' },
      { name: 'Factory Expenses', href: '/manufacturing/expenses', icon: <DollarSign />, group: 'Manufacturing' },
      { name: 'Factory Materials', href: '/manufacturing/inventory', icon: <Factory />, group: 'Manufacturing' },
      { name: 'Factories List', href: '/manufacturing/factories', icon: <Factory />, group: 'Manufacturing' },
    ],
    reports: [
      { name: 'Reports', href: '/shop/reports', icon: <BarChart3 />, group: 'Reports' },
    ],
    admin: [
      { name: 'Users', href: '/settings/users', icon: <Shield />, group: 'Administration' },
      { name: 'Period Locking', href: '/projects/accounting/periods', icon: <Lock />, group: 'Administration' },
      { name: 'Approvals', href: '/projects/accounting/approvals', icon: <CheckCircle />, group: 'Administration' },
      { name: 'Download App', href: '/download', icon: <HardDrive />, group: 'Administration' },
    ]
  },
  MANAGER: {
    main: [
      { name: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard />, group: 'Main' },
    ],
    projects: [
      { name: 'Projects', href: '/projects/main', icon: <Briefcase />, group: 'Projects' },
      { name: 'Employees', href: '/projects/employees', icon: <UserCogIcon />, group: 'Projects' },
      { name: 'Project Vendors', href: '/projects/vendors', icon: <Truck />, group: 'Projects' },
      { name: 'Project Customers', href: '/projects/customers', icon: <Users />, group: 'Projects' },
      { name: 'Project Expenses', href: '/projects/expenses', icon: <DollarSign />, group: 'Projects' },
      { name: 'Accounting', href: '/projects/accounting', icon: <Landmark />, group: 'Projects' },
      { name: 'Project Store', href: '/projects/inventory', icon: <Warehouse />, group: 'Projects' },
      { name: 'Workshop', href: '/workshop', icon: <Hammer />, group: 'Projects' },
    ],
    shop: [
      { name: 'Retail Shop', href: '/shop', icon: <ShoppingCart />, group: 'Shop' },
      { name: 'Shop Inventory', href: '/shop/inventory', icon: <Package />, group: 'Shop' },
    ],
    manufacturing: [
      { name: 'Manufacturing', href: '/manufacturing', icon: <Factory />, group: 'Manufacturing' },
      { name: 'Factory Materials', href: '/manufacturing/inventory', icon: <Factory />, group: 'Manufacturing' },
    ],
    reports: [
      { name: 'Reports', href: '/reports', icon: <BarChart3 />, group: 'Reports' },
    ],
    administration: [
      { name: 'Download App', href: '/download', icon: <HardDrive />, group: 'Administration' },
    ]
  },
  MEMBER: {
    main: [
      { name: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard />, group: 'Main' },
    ],
    business: [
      { name: 'Projects', href: '/projects/main', icon: <Briefcase />, group: 'Business' },
      { name: 'Project Vendors', href: '/projects/vendors', icon: <Truck />, group: 'Business' },
      { name: 'Retail Shop', href: '/shop', icon: <ShoppingCart />, group: 'Business' },
    ],
    financial: [
      { name: 'Project Expenses', href: '/projects/expenses', icon: <DollarSign />, group: 'Financial' },
      { name: 'Shop Inventory', href: '/shop/inventory', icon: <Package />, group: 'Financial' },
      { name: 'Project Store', href: '/projects/inventory', icon: <Warehouse />, group: 'Financial' },
    ]
  },
  VIEWER: {
    main: [
      { name: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard />, group: 'Main' },
    ],
    business: [
      { name: 'Projects', href: '/projects/main', icon: <Briefcase />, group: 'Business' },
    ]
  },
  PROJECTS_ADMIN: {
    main: [
      { name: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard />, group: 'Main' },
    ],
    business: [
      { name: 'Projects', href: '/projects/main', icon: <Briefcase />, group: 'Business' },
      { name: 'Project Vendors', href: '/projects/vendors', icon: <Truck />, group: 'Business' },
      { name: 'Project Customers', href: '/projects/customers', icon: <Users />, group: 'Business' },
      { name: 'Employees', href: '/projects/employees', icon: <UserCogIcon />, group: 'Business' },
    ],
    financial: [
      { name: 'Project Expenses', href: '/projects/expenses', icon: <DollarSign />, group: 'Financial' },
      { name: 'Accounting', href: '/projects/accounting', icon: <Landmark />, group: 'Financial' },
      { name: 'Project Store', href: '/projects/inventory', icon: <Warehouse />, group: 'Financial' },
    ],
    reports: [
      { name: 'Reports', href: '/reports', icon: <BarChart3 />, group: 'Reports' },
    ],
    admin: [
      { name: 'Settings', href: '/settings', icon: <Wrench />, group: 'Administration' },
      { name: 'Period Locking', href: '/projects/accounting/periods', icon: <Lock />, group: 'Administration' },
      { name: 'Approvals', href: '/projects/accounting/approvals', icon: <CheckCircle />, group: 'Administration' },
      { name: 'Download App', href: '/download', icon: <HardDrive />, group: 'Administration' },
    ]
  },
  SHOP_ADMIN: {
    main: [
      { name: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard />, group: 'Main' },
    ],
    business: [
      { name: 'Retail Shop', href: '/shop', icon: <ShoppingCart />, group: 'Business' },
    ],
    financial: [
      { name: 'Shop Inventory', href: '/shop/inventory', icon: <Package />, group: 'Financial' },
    ],
    reports: [
      { name: 'Reports', href: '/shop/reports', icon: <BarChart3 />, group: 'Reports' },
    ],
    admin: [
      { name: 'Settings', href: '/settings', icon: <Wrench />, group: 'Administration' },
      { name: 'Download App', href: '/download', icon: <HardDrive />, group: 'Administration' },
    ]
  },
  MANUFACTURING_ADMIN: {
    main: [
      { name: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard />, group: 'Main' },
    ],
    business: [
      { name: 'Manufacturing', href: '/manufacturing', icon: <Factory />, group: 'Business' },
      { name: 'Factory Vendors', href: '/manufacturing/vendors', icon: <Truck />, group: 'Business' },
      { name: 'Factory Customers', href: '/manufacturing/customers', icon: <Users />, group: 'Business' },
    ],
    financial: [
      { name: 'Factory Materials', href: '/manufacturing/inventory', icon: <Factory />, group: 'Financial' },
      { name: 'Factories List', href: '/manufacturing/factories', icon: <Factory />, group: 'Financial' },
    ],
    reports: [
      { name: 'Reports', href: '/reports', icon: <BarChart3 />, group: 'Reports' },
    ],
    admin: [
      { name: 'Settings', href: '/settings', icon: <Wrench />, group: 'Administration' },
      { name: 'Download App', href: '/download', icon: <HardDrive />, group: 'Administration' },
    ]
  }
};


const Sidebar: React.FC<SidebarProps> = ({
  setIsSidebarOpen,
  isCollapsed,
  currentTime,
  currentUser,
  currentCompany,
  handleLogout,
  onNavItemClick,
}) => {
  const [collapsed, setCollapsed] = useState(isCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [planType, setPlanType] = useState<string>('COMBINED');

  // Detect mobile
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch plan type
  // Fetch plan type ONLY ONCE when the user ID is available
  useEffect(() => {
    const fetchPlanType = async () => {
      try {
        const response = await fetch('/api/company/plan-type');
        const data = await response.json();
        setPlanType(data.planType || 'COMBINED');
      } catch (error) {
        setPlanType('COMBINED');
      }
    };
    if (currentUser?.id) {
      fetchPlanType();
    }
  }, [currentUser?.id]);

  // Auto close sidebar on mobile nav click
  const handleNavClick = () => {
    if (isMobile) setMobileOpen(false);
    if (onNavItemClick) onNavItemClick();
  };

  useEffect(() => {
    setCollapsed(isCollapsed);
  }, [isCollapsed]);

  const role = currentUser?.role?.toUpperCase() as keyof typeof menuConfig;
  let menuStructure = menuConfig[role] || menuConfig['VIEWER'];

  // Filter menu items based on planType AND User Role
  const filterMenuByPlan = (menu: any) => {
    // 1. Priority: If user has a specific module role, show ONLY that module
    if (role === 'SHOP_ADMIN') {
      return {
        main: [{ name: 'Shop Dashboard', href: '/shop/dashboard', icon: <LayoutDashboard />, group: 'Main' }],
        business: [{ name: 'Retail Shop', href: '/shop', icon: <ShoppingCart />, group: 'Business' }],
        financial: [{ name: 'Shop Inventory', href: '/shop/inventory', icon: <Package />, group: 'Financial' }],
        reports: [{ name: 'Reports', href: '/reports', icon: <BarChart3 />, group: 'Analytics' }],
        admin: menu.admin || []
      };
    }

    if (role === 'PROJECTS_ADMIN') {
      return {
        main: [{ name: 'Projects Dashboard', href: '/dashboard', icon: <LayoutDashboard />, group: 'Main' }],
        business: [
          { name: 'Projects', href: '/projects/main', icon: <Briefcase />, group: 'Operations' },
          { name: 'Employees', href: '/projects/employees', icon: <UserCogIcon />, group: 'Operations' },
          { name: 'Vendors', href: '/projects/vendors', icon: <Truck />, group: 'Operations' },
          { name: 'Customers', href: '/projects/customers', icon: <Users />, group: 'Operations' },
        ],
        financial: [
          { name: 'Expenses', href: '/projects/expenses', icon: <DollarSign />, group: 'Finance' },
          { name: 'Accounting', href: '/projects/accounting', icon: <Landmark />, group: 'Finance' },
          { name: 'Inventory', href: '/projects/inventory', icon: <Warehouse />, group: 'Finance' },
        ],
        reports: [{ name: 'Reports', href: '/reports', icon: <BarChart3 />, group: 'Analytics' }],
        admin: menu.admin || []
      };
    }

    // 2. Secondary: If limited by PlanType
    if (planType === 'FACTORIES_ONLY' || role === 'MANUFACTURING_ADMIN') {
      return {
        main: [{ name: 'Factory OS', href: '/manufacturing', icon: <Factory />, group: 'Main' }],
        business: [
          { name: 'Production', href: '/manufacturing/production-orders', icon: <ClipboardList />, group: 'Operations' },
          { name: 'Inventory', href: '/manufacturing/inventory', icon: <Package />, group: 'Operations' },
          { name: 'Recipes (BOM)', href: '/manufacturing/bom', icon: <LayoutGrid />, group: 'Engineering' },
        ],
        financial: [
          { name: 'Purchases', href: '/manufacturing/material-purchases', icon: <Truck />, group: 'Finance' },
          { name: 'Expenses', href: '/manufacturing/expenses', icon: <DollarSign />, group: 'Finance' },
        ],
        reports: [{ name: 'Reports', href: '/manufacturing/reports', icon: <BarChart3 />, group: 'Analytics' }],
        admin: menu.admin || []
      };
    }

    if (planType === 'PROJECTS_ONLY') {
      return {
        main: [{ name: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard />, group: 'Main' }],
        business: [
          { name: 'Projects', href: '/projects/main', icon: <Briefcase />, group: 'Operations' },
          { name: 'Employees', href: '/projects/employees', icon: <UserCogIcon />, group: 'Operations' },
          { name: 'Vendors', href: '/projects/vendors', icon: <Truck />, group: 'Operations' },
          { name: 'Customers', href: '/projects/customers', icon: <Users />, group: 'Operations' },
          { name: 'Workshop', href: '/workshop', icon: <Hammer />, group: 'Operations' },
        ],
        financial: [
          { name: 'Expenses', href: '/projects/expenses', icon: <DollarSign />, group: 'Finance' },
          { name: 'Accounting', href: '/projects/accounting', icon: <Landmark />, group: 'Finance' },
          { name: 'Inventory', href: '/projects/inventory', icon: <Warehouse />, group: 'Finance' },
        ],
        reports: [{ name: 'Reports', href: '/reports', icon: <BarChart3 />, group: 'Analytics' }],
        admin: menu.admin || []
      };
    }
    
    // 3. Fallback: Return original menu (combined) as defined in menuConfig
    return menu;
  };

  menuStructure = filterMenuByPlan(menuStructure);

  // SECURE EXCLUSIVE ACCESS: Only the specific SUPER_ADMIN for company 6789dbe7-1d48-4775-a722-2f7fa8cbae38
  // is allowed to see Period Locking and Approvals
  const isExclusiveAdmin = role === 'SUPER_ADMIN' && currentUser?.companyId === '6789dbe7-1d48-4775-a722-2f7fa8cbae38';
  
  if (!isExclusiveAdmin && 'admin' in menuStructure && Array.isArray((menuStructure as any).admin)) {
     (menuStructure as any).admin = (menuStructure as any).admin.filter(
        (item: any) => item.name !== 'Period Locking' && item.name !== 'Approvals'
     );
  }



  const bottomItems = [
    { name: 'Settings', href: '/settings', icon: <Settings /> },
    { name: 'Log Out', href: '#', icon: <LogOut />, onClick: handleLogout },
  ];


  // Render menu section
  const renderMenuSection = (sectionName: string, items: any[]) => (
    <div key={sectionName} className="mb-6">
      {!collapsed && (
        <h3 className="text-xs font-semibold text-mediumGray/70 uppercase tracking-wider mb-2 px-3">
          {sectionName}
        </h3>
      )}
      <ul className="space-y-1">
        {items.map((item) => (
          <NavItem
            key={item.name}
            {...item}
            isCollapsed={collapsed}
            onClick={handleNavClick}
          />
        ))}
      </ul>
    </div>
  );

  // Mobile sidebar overlay
  if (isMobile) {
    return (
      <>
        {/* Hamburger menu (logo hidden when sidebar closed) */}
        {!mobileOpen && (
          <button
            className="fixed top-4 left-4 z-50 p-2 rounded-md bg-darkGray text-white shadow-lg md:hidden flex items-center"
            onClick={() => setMobileOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu size={28} />
          </button>
        )}
        {/* Sidebar Drawer */}
        <div
          className={`fixed inset-0 z-40 transition-all duration-300 ${mobileOpen ? 'visible' : 'invisible pointer-events-none'}`}
        >
          {/* Overlay */}
          <div
            className={`absolute inset-0 bg-black bg-opacity-40 transition-opacity duration-300 ${mobileOpen ? 'opacity-100' : 'opacity-0'}`}
            onClick={() => setMobileOpen(false)}
          />
          {/* Sidebar */}
          <aside
            className={`
              h-full bg-white dark:bg-[#0f172a] flex flex-col shadow-2xl
              w-60 transition-transform duration-300 ease-in-out
              fixed top-0 left-0 z-50 border-r border-gray-100 dark:border-gray-800
              ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
              min-w-[240px] max-w-[240px]
            `}
          >
            {/* Top: Logo, Close Button */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800/50">
              <span className="text-2xl font-black tracking-tight select-none text-gray-900 dark:text-white font-sans">
                Revl<span className="text-green-500">o</span>
              </span>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Close sidebar"
              >
                <X size={20} />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-1 custom-scrollbar">
              <div className="space-y-4 pb-8">
                {Object.entries(menuStructure).map(([sectionName, items]) =>
                  renderMenuSection(sectionName, items)
                )}
              </div>
            </nav>
            {/* Bottom: Settings, Logout */}
            {/* Bottom: Settings, Logout */}
            <div className="px-2 pb-6 border-t border-gray-100 dark:border-gray-800 pt-4">
              <ul className="space-y-1">
                {bottomItems.map((item) =>
                  item.name === 'Log Out' ? (
                    <li key={item.name}>
                      <button
                        onClick={item.onClick}
                        className="w-full flex items-center text-sm font-medium py-2.5 px-3 mx-2 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors duration-300 group relative justify-start space-x-3"
                      >
                        <span className="text-xl">{item.icon}</span>
                        <span className="truncate transition-all duration-300">{item.name}</span>
                      </button>
                    </li>
                  ) : (
                    <NavItem
                      key={item.name}
                      {...item}
                      isCollapsed={false}
                      onClick={handleNavClick}
                    />
                  )
                )}
              </ul>
            </div>
          </aside>
        </div>
      </>
    );
  }

  // Desktop version
  return (
    <aside
      className={`
        h-full bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-xl flex flex-col shadow-[1px_0_20px_rgba(0,0,0,0.03)] dark:shadow-none
        ${collapsed ? 'w-20 min-w-[80px] max-w-[80px]' : 'w-64 min-w-[256px] max-w-[256px]'}
        transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]
        fixed md:static top-0 left-0 z-40
        border-r border-gray-200/60 dark:border-gray-800
      `}
    >
      {/* Top: Branding / Logo */}
      <div className={`flex items-center ${collapsed ? 'justify-center' : 'pl-8'} py-8 mb-2 transition-all duration-300`}>
        {collapsed ? (
          <div className="h-10 w-10 bg-green-500 rounded-lg flex items-center justify-center text-white font-black text-xl shadow-lg shadow-green-500/30">
            R
          </div>
        ) : (
          <span className="text-3xl font-black tracking-tight select-none text-gray-900 dark:text-white flex items-center font-sans">
            Revl<span className="text-green-500">o</span>
          </span>
        )}
      </div>


      {/* Navigation (scrollable) */}
      <nav className="flex-1 overflow-y-auto px-1 sidebar-scrollbar">
        <div className="space-y-4 pb-8">
          {Object.entries(menuStructure).map(([sectionName, items]) =>
            renderMenuSection(sectionName, items)
          )}
        </div>
      </nav>

      {/* Bottom: Settings, Logout */}
      {/* Bottom: Settings, Logout */}
      {!collapsed && (
        <div className="px-2 pb-6 border-t border-gray-100 dark:border-gray-800 pt-4 bg-gray-50/50 dark:bg-gray-900/30">
          <ul className="space-y-1">
            {bottomItems.map((item) =>
              item.name === 'Log Out' ? (
                <li key={item.name}>
                  <button
                    onClick={item.onClick}
                    className="w-full flex items-center text-sm font-medium py-2.5 px-3 mx-2 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors duration-300 group relative justify-start space-x-3"
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="truncate transition-all duration-300">{item.name}</span>
                  </button>
                </li>
              ) : (
                <NavItem
                  key={item.name}
                  {...item}
                  isCollapsed={collapsed}
                  onClick={onNavItemClick}
                />
              )
            )}
          </ul>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
