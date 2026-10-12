'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { 
  Building2, FileText, Loader2, Smartphone, 
  WalletCards, Receipt, Factory, History, ArrowRight,
  LogOut, Shield, Sparkles, TrendingUp
} from 'lucide-react';
import { signOut } from 'next-auth/react';

type Account = { id: string; name: string; type: string; balance?: number; currency: string };
type Setup = { 
  user: { id: string; name: string; role: string; email?: string }; 
  accounts: Account[];
};

async function readJson(response: Response) {
  const text = await response.text();
  try { return text ? JSON.parse(text) : { error: 'Server error' }; } catch { return { error: 'Server error' }; }
}

export default function StaffPortalPage() {
  const [setup, setSetup] = useState<Setup | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch('/api/staff/device-setup', { cache: 'no-store' });
        if (response.status === 401) { 
          window.location.assign('/login?callbackUrl=%2Fstaff'); 
          return; 
        }
        const data = await readJson(response);
        if (!response.ok) { 
          setMessage(data.error || 'Staff setup lama soo qaadin.'); 
          setLoading(false); 
          return; 
        }
        setSetup(data);
      } catch (err: any) {
        setMessage(err.message || 'Cilad ayaa dhacday.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const totalBalance = useMemo(() => {
    return (setup?.accounts || []).reduce((sum, a) => sum + (Number(a.balance) || 0), 0);
  }, [setup]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#020617] text-white flex flex-col items-center justify-center space-y-4">
        <Loader2 className="animate-spin text-cyan-400" size={36} />
        <p className="text-xs font-black tracking-widest text-slate-400 uppercase">AN-Industry Staff Hub...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#020617] text-slate-100 px-4 py-5 pb-24 font-sans select-none">
      <div className="mx-auto max-w-md space-y-4">
        {/* TOP HEADER */}
        <header className="rounded-3xl border border-white/10 bg-slate-900/80 p-4 shadow-2xl backdrop-blur-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
              <Smartphone size={22} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400">AN-INDUSTRY</span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <h1 className="text-sm font-black text-white">{setup?.user.name || 'Staff Operations'}</h1>
              <p className="text-[10px] font-bold text-slate-400">{setup?.user.role || 'CASHIER'}</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={() => signOut({ callbackUrl: '/login' })}
            title="Log Out"
            className="h-9 w-9 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-slate-400 hover:text-rose-400 transition-colors">
            <LogOut size={16} />
          </button>
        </header>

        {message && (
          <div className="rounded-2xl border border-cyan-400/30 bg-cyan-500/10 p-3.5 text-xs font-bold text-cyan-100">
            {message}
          </div>
        )}

        {/* FINANCIAL SUMMARY CARD */}
        <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/90 via-slate-900/50 to-slate-950 p-4 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold">
              <TrendingUp size={14} className="text-cyan-400" />
              <span>Accounts Active</span>
            </div>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
              Synced
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            {(setup?.accounts || []).slice(0, 2).map((acc) => (
              <div key={acc.id} className="rounded-2xl border border-white/5 bg-slate-950/60 p-3">
                <p className="text-[10px] font-bold text-slate-400 truncate">{acc.name}</p>
                <p className="text-xs font-black text-white mt-1">{(acc.balance || 0).toLocaleString()} <span className="text-[9px] text-cyan-300 font-semibold">ETB</span></p>
              </div>
            ))}
          </div>
        </section>

        {/* PRIMARY ACTIONS: SALES & RECEIPT SCAN */}
        <section className="space-y-2">
          <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 px-1">Hawlaha Maalinlaha ah (Operations)</p>

          {/* ADD SALE & SCAN */}
          <Link 
            href="/telegram-mini-app/sales"
            className="group flex items-center justify-between rounded-3xl border border-cyan-400/30 bg-gradient-to-r from-cyan-500/15 via-blue-500/10 to-indigo-500/15 p-4 shadow-[0_0_20px_rgba(6,182,212,0.1)] active:scale-[0.98] transition-all">
            <div className="flex items-center gap-3.5">
              <div className="h-12 w-12 rounded-2xl bg-cyan-400/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.25)] group-hover:scale-105 transition-transform">
                <Receipt size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-white">Sales & Rasiid Scan</h3>
                  <span className="rounded-md bg-cyan-400/20 px-1.5 py-0.5 text-[9px] font-black uppercase text-cyan-200">AI Camera</span>
                </div>
                <p className="text-[11px] font-bold text-slate-300 mt-0.5">Sawir rasiidka ama geli iib cusub</p>
              </div>
            </div>
            <ArrowRight size={18} className="text-cyan-400 group-hover:translate-x-1 transition-transform" />
          </Link>

          {/* PRODUCTION ORDERS */}
          <Link 
            href="/telegram-mini-app/production"
            className="group flex items-center justify-between rounded-3xl border border-white/10 bg-slate-900/80 p-4 shadow-lg active:scale-[0.98] transition-all hover:border-white/20">
            <div className="flex items-center gap-3.5">
              <div className="h-12 w-12 rounded-2xl bg-indigo-500/15 border border-indigo-400/30 flex items-center justify-center text-indigo-300 group-hover:scale-105 transition-transform">
                <Factory size={24} />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">Production Orders</h3>
                <p className="text-[11px] font-bold text-slate-400 mt-0.5">Dalabyada warshadda & status-ka</p>
              </div>
            </div>
            <ArrowRight size={18} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
          </Link>

          {/* EXPENSES & PURCHASES */}
          <Link 
            href="/telegram-mini-app"
            className="group flex items-center justify-between rounded-3xl border border-white/10 bg-slate-900/80 p-4 shadow-lg active:scale-[0.98] transition-all hover:border-white/20">
            <div className="flex items-center gap-3.5">
              <div className="h-12 w-12 rounded-2xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-amber-300 group-hover:scale-105 transition-transform">
                <WalletCards size={24} />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">Kharash & Dalab Lacag</h3>
                <p className="text-[11px] font-bold text-slate-400 mt-0.5">Diiwaangeli kharash ama dalab cusub</p>
              </div>
            </div>
            <ArrowRight size={18} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
          </Link>

          {/* WEB DASHBOARD */}
          <Link 
            href="/manufacturing"
            className="group flex items-center justify-between rounded-3xl border border-white/10 bg-slate-900/80 p-4 shadow-lg active:scale-[0.98] transition-all hover:border-white/20">
            <div className="flex items-center gap-3.5">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center text-emerald-300 group-hover:scale-105 transition-transform">
                <Building2 size={24} />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">Full System Portal</h3>
                <p className="text-[11px] font-bold text-slate-400 mt-0.5">Maamulka buuxa ee warshadda</p>
              </div>
            </div>
            <ArrowRight size={18} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
          </Link>
        </section>

        {/* SECURITY & PRIVACY FOOTER */}
        <footer className="pt-2 flex flex-col items-center gap-2 text-center">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
            <Shield size={12} className="text-cyan-400" />
            <span>AN-Industry Private Staff Network · Play Store Ready</span>
          </div>
          <Link href="/privacy/staff-app" className="text-[10px] font-bold text-slate-400 hover:text-white underline decoration-slate-600">
            Privacy & Security Policy
          </Link>
        </footer>
      </div>
    </main>
  );
}
