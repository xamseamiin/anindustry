'use client';

import { useSession, signOut } from 'next-auth/react';
import { LogOut, EyeOff } from 'lucide-react';

export default function ImpersonateBanner() {
  const { data: session } = useSession();
  
  const impersonatedBy = (session?.user as any)?.impersonatedBy;

  if (!impersonatedBy) return null;

  const handleReturnToAdmin = async () => {
    // Simply signing out will end the impersonated session.
    // The admin will need to log back in, or ideally, we'd have a system to restore their token.
    // For extreme security, logging out completely is safe. 
    // They can log back in with their super admin credentials.
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <div className="bg-red-600 text-white px-4 py-2 flex items-center justify-between text-sm font-bold z-[100] relative shadow-md">
      <div className="flex flex-col md:flex-row md:items-center gap-2">
        <div className="flex items-center gap-2">
          <EyeOff size={18} className="animate-pulse" />
          <span className="uppercase tracking-wide">Ghost Mode Active</span>
        </div>
        <span className="hidden md:inline text-red-200">|</span>
        <span className="font-medium">
          You are currently impersonating <strong>{session?.user?.name || session?.user?.email}</strong>. Any actions you take will be logged as this user.
        </span>
      </div>
      
      <button 
        onClick={handleReturnToAdmin}
        className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 px-3 py-1 rounded-md transition-colors whitespace-nowrap"
      >
        <LogOut size={16} />
        Exit Session
      </button>
    </div>
  );
}
