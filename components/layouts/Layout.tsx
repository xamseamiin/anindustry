'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useUser } from '@/components/providers/UserProvider';
import { NotificationProvider } from '../../contexts/NotificationContext';
import { LanguageProvider } from '../../contexts/LanguageContext';
import { Loader2 } from 'lucide-react';
import FloatingChat from '../common/FloatingChat';
import GlobalCalculator from '../common/GlobalCalculator';
import PWAInstallPrompt from '../common/PWAInstallPrompt';

interface LayoutProps {
  children: React.ReactNode;
}

// Sidebar width constants
const SIDEBAR_WIDTH = 260; // Slightly wider for modern feel
const SIDEBAR_COLLAPSED = 80;

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const { user, logout } = useUser();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const closeMobileSidebar = () => {
    setIsMobileSidebarOpen(false);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin mr-2" /> <span>Fadlan sug...</span>
      </div>
    );
  }

  const currentUser = {
    id: user.id,
    name: user.fullName,
    email: user.email,
    avatar: user.fullName?.charAt(0)?.toUpperCase() || 'U',
    role: user.role,
  };
  const currentCompany = {
    name: user.companyName || '',
    logoUrl: (user as any).companyLogoUrl || null
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <LanguageProvider>
      <NotificationProvider>
        <div className="flex h-screen bg-lightGray dark:bg-gray-900 overflow-hidden">
          {/* Sidebar (mobile & desktop, geeso jaran) */}
          {/* Mobile Sidebar */}
          <div className={`fixed inset-y-0 left-0 transform ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                       md:hidden transition-transform duration-300 ease-in-out z-40 shadow-xl`}>
            <Sidebar
              setIsSidebarOpen={closeMobileSidebar}
              isCollapsed={false}
              currentTime={currentTime}
              currentUser={currentUser}
              currentCompany={currentCompany}
              handleLogout={handleLogout}
            />
          </div>

          {/* Overlay for mobile when sidebar is open */}
          {isMobileSidebarOpen && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
              onClick={closeMobileSidebar}
            ></div>
          )}

          {/* Desktop Sidebar (geeso jaran, balac yar marka la qariyo) */}
          <div
            className={`hidden md:block flex-shrink-0 transition-all duration-300 ease-in-out`}
            style={{
              width: isDesktopSidebarCollapsed ? SIDEBAR_COLLAPSED : SIDEBAR_WIDTH,
              minWidth: isDesktopSidebarCollapsed ? SIDEBAR_COLLAPSED : SIDEBAR_WIDTH,
              maxWidth: isDesktopSidebarCollapsed ? SIDEBAR_COLLAPSED : SIDEBAR_WIDTH,
            }}
          >
            <Sidebar
              isCollapsed={isDesktopSidebarCollapsed}
              currentTime={currentTime}
              currentUser={currentUser}
              currentCompany={currentCompany}
              setIsSidebarOpen={() => { }} // No-op for desktop
              handleLogout={handleLogout}
            />
          </div>

          {/* Main Content Area (flexible, margin-left changes with sidebar) */}
          <div
            className="flex flex-col flex-1 transition-all duration-300"
            style={{
              marginLeft: 0, // No margin, sidebar is in the flex flow
            }}
          >
            {/* Topbar */}
            <Topbar
              onOpenSidebar={() => setIsMobileSidebarOpen(true)}
              onToggleSidebar={() => setIsDesktopSidebarCollapsed((prev) => !prev)}
              isSidebarCollapsed={isDesktopSidebarCollapsed}
              currentUser={currentUser}
              currentCompany={currentCompany}
              handleLogout={handleLogout}
            />
            <div className="flex-1 p-4 md:p-8 overflow-y-auto">
              {children}
            </div>
          </div>

          {/* Floating Chat */}
          <FloatingChat />

          {/* Global Calculator */}
          <GlobalCalculator />

          {/* PWA Install Prompt */}
          <PWAInstallPrompt />
        </div>
      </NotificationProvider>
    </LanguageProvider>
  );
};

export default Layout;