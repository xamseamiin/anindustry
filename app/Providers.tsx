'use client';

import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'react-hot-toast';
import { Toaster as SonnerToaster } from 'sonner';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { UserProvider } from '@/components/providers/UserProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <LanguageProvider>
        <UserProvider>
          <NotificationProvider>
            {children}
            <Toaster position="top-right" />
            <SonnerToaster position="bottom-right" />
          </NotificationProvider>
        </UserProvider>
      </LanguageProvider>
    </SessionProvider>
  );
}
