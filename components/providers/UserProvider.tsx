'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';

interface UserType {
  id: string;
  fullName: string;
  email: string;
  role: string;
  companyId?: string;
  companyName?: string;
  avatar?: string;
  companyLogoUrl?: string;
}

interface UserContextType {
  user: UserType | null;
  setUser: (user: UserType | null) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextType>({
  user: null,
  setUser: () => {},
  logout: () => {},
});

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<UserType | null>(null);

  useEffect(() => {
    if (session?.user) {
      const newUser = {
        id: (session.user as any).id ?? '',
        fullName: session.user.name || '',
        email: session.user.email ?? '',
        role: (session.user as any).role ?? '',
        companyId: (session.user as any).companyId,
        companyName: (session.user as any).companyName,
        avatar: (session.user as any).avatar,
        companyLogoUrl: (session.user as any).companyLogoUrl,
      };

      // Detect session mismatch (multi-tab login)
      if (user && user.id !== newUser.id) {
        console.warn('Session mismatch detected. Reloading...');
        window.location.reload();
      }

      // Only update if something changed
      if (!user || user.id !== newUser.id || user.role !== newUser.role) {
        setUser(newUser);
      }
    } else if (status === 'unauthenticated') {
      if (user) {
        // If we had a user but now we don't (logout in another tab)
        window.location.reload();
      }
      setUser(null);
    }
  }, [session, status, user]);

  // Sync session on focus/visibility change to catch tab changes immediately
  useEffect(() => {
    const handleSync = () => {
      // Small delay to let cookies settle if a login just happened
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          // Trigger a session refresh from next-auth
          const event = new Event('storage');
          window.dispatchEvent(event);
        }
      }, 500);
    };

    window.addEventListener('focus', handleSync);
    window.addEventListener('visibilitychange', handleSync);
    return () => {
      window.removeEventListener('focus', handleSync);
      window.removeEventListener('visibilitychange', handleSync);
    };
  }, []);

  const logout = () => {
    setUser(null);
    signOut({ callbackUrl: '/login' });
  };

  return (
    <UserContext.Provider value={{ user, setUser, logout }}>
      {children}
    </UserContext.Provider>
  );
};