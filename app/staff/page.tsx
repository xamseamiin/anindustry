'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { BellRing, Building2, Loader2, ShieldCheck, Smartphone, Store, WalletCards } from 'lucide-react';

type Account = { id: string; name: string; type: string; currency: string };
type Setup = { user: { id: string; name: string; role: string }; accounts: Account[]; canEnableSmsReader: boolean };

declare global {
  interface Window {
    ANStaffBridge?: {
      getDeviceFingerprint?: () => string;
      enableCashierPaymentReader?: (config: string) => void;
      disableCashierPaymentReader?: () => void;
    };
  }
}

async function readJson(response: Response) {
  const text = await response.text();
  try { return text ? JSON.parse(text) : { error: 'Server error' }; } catch { return { error: 'Server error' }; }
}

function browserFingerprint() {
  const key = 'an_industry_staff_device_id';
  const previous = window.localStorage.getItem(key);
  if (previous) return previous;
  const fresh = 'web-' + crypto.randomUUID();
  window.localStorage.setItem(key, fresh);
  return fresh;
}

export default function StaffPortalPage() {
  const [setup, setSetup] = useState<Setup | null>(null);
  const [ebirrAccountId, setEbirrAccountId] = useState('');
  const [cbeAccountId, setCbeAccountId] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const nativeApp = typeof window !== 'undefined' && Boolean(window.ANStaffBridge);
  const accountOptions = useMemo(() => setup?.accounts || [], [setup]);

  useEffect(() => {
    (async () => {
      const response = await fetch('/api/staff/device-setup', { cache: 'no-store' });
      if (response.status === 401) { window.location.assign('/login?callbackUrl=%2Fstaff'); return; }
      const data = await readJson(response);
      if (!response.ok) { setMessage(data.error || 'Staff setup lama soo qaadin.'); setLoading(false); return; }
      setSetup(data);
      const ebirr = data.accounts.find((account: Account) => /e-?birr/i.test(account.name));
      const cbe = data.accounts.find((account: Account) => /cbe|commercial/i.test(account.name));
      setEbirrAccountId(ebirr?.id || '');
      setCbeAccountId(cbe?.id || '');
      setLoading(false);
    })();
  }, []);

  const registerCashierDevice = async () => {
    if (!nativeApp) return setMessage('Fur boggan gudaha AN-Industry Staff App si SMS reader loo shido.');
    if (!setup?.canEnableSmsReader) return setMessage('SMS reader waxaa loo oggol yahay cashier-ka oo keliya.');
    if (!ebirrAccountId && !cbeAccountId) return setMessage('Dooro ugu yaraan hal account oo E-Birr ama CBE ah.');
    setRegistering(true);
    try {
      const fingerprint = window.ANStaffBridge?.getDeviceFingerprint?.() || browserFingerprint();
      const response = await fetch('/api/staff/devices/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceFingerprint: fingerprint, name: 'AN Staff Android', enableSmsReader: true })
      });
      const data = await readJson(response);
      if (!response.ok) throw new Error(data.error || 'Device lama diiwaangelin.');
      window.ANStaffBridge?.enableCashierPaymentReader?.(JSON.stringify({
        deviceToken: data.deviceToken,
        ebirrAccountId,
        cbeAccountId
      }));
      setMessage('Cashier device waa la diiwaangeliyey. Android ayaa hadda ku weydiinaya oggolaanshaha RECEIVE_SMS.');
    } catch (error: any) {
      setMessage(error.message || 'Device lama diiwaangelin.');
    } finally {
      setRegistering(false);
    }
  };

  if (loading) return <main className="min-h-screen bg-slate-950 text-white grid place-items-center"><Loader2 className="animate-spin text-emerald-300" /></main>;

  return <main className="min-h-screen bg-[#020617] px-4 py-7 text-slate-100"><div className="mx-auto max-w-md space-y-4">
    <header className="rounded-3xl border border-white/15 bg-slate-900/80 p-5 shadow-2xl"><div className="flex items-center gap-3"><div className="rounded-2xl bg-emerald-400/15 p-3 text-emerald-300"><Smartphone size={24} /></div><div><p className="text-xs font-black tracking-wider">AN-INDUSTRY STAFF</p><p className="text-[11px] font-bold text-slate-400">{setup?.user.name || 'Staff portal'} · {setup?.user.role || 'STAFF'}</p></div></div></header>
    {message && <div className="rounded-2xl border border-cyan-300/30 bg-cyan-400/10 p-3 text-xs font-bold text-cyan-100">{message}</div>}
    <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-4"><div className="mb-3 flex items-center gap-2"><Store className="text-cyan-300" size={18} /><h1 className="font-black">Shaqada warshadda</h1></div><div className="grid grid-cols-2 gap-2"><Link href="/manufacturing" className="rounded-2xl bg-cyan-400/15 p-4 text-center text-xs font-black text-cyan-100"><Building2 className="mx-auto mb-2" size={20} />Dashboard</Link><Link href="/manufacturing/sales/add" className="rounded-2xl bg-emerald-400/15 p-4 text-center text-xs font-black text-emerald-100"><WalletCards className="mx-auto mb-2" size={20} />New sale</Link></div><p className="mt-3 text-[10px] font-bold text-slate-500">Bogagga kale ee system-ka waxaa laga furayaa Dashboard-ka, iyadoo role-ka qofku go'aaminayo waxa uu qaban karo.</p></section>
    <section className="rounded-3xl border border-amber-300/25 bg-amber-400/5 p-4"><div className="flex items-start gap-3"><BellRing className="mt-0.5 text-amber-200" size={20} /><div><h2 className="text-sm font-black text-amber-100">Cashier payment reader</h2><p className="mt-1 text-[10px] font-bold text-slate-400">Wuxuu qabtaa SMS cusub oo E-Birr/CBE ah oo keliya; ma akhriyo SMS-yadii hore ama OTP/PIN.</p></div></div>
      {!setup?.canEnableSmsReader ? <p className="mt-3 rounded-xl bg-slate-950/70 p-3 text-[10px] font-bold text-slate-400">Role-kan SMS reader looma fasixin.</p> : <><label className="mt-3 block text-[10px] font-black uppercase text-slate-400">E-Birr account<select value={ebirrAccountId} onChange={event => setEbirrAccountId(event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 p-3 text-sm text-white"><option value="">Ha isticmaalin E-Birr</option>{accountOptions.map(account => <option value={account.id} key={account.id}>{account.name}</option>)}</select></label><label className="mt-3 block text-[10px] font-black uppercase text-slate-400">CBE account<select value={cbeAccountId} onChange={event => setCbeAccountId(event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 p-3 text-sm text-white"><option value="">Ha isticmaalin CBE</option>{accountOptions.map(account => <option value={account.id} key={account.id}>{account.name}</option>)}</select></label><button onClick={registerCashierDevice} disabled={registering || !nativeApp} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 p-3 text-xs font-black text-slate-950 disabled:opacity-50">{registering ? <Loader2 className="animate-spin" size={15} /> : <ShieldCheck size={15} />}{nativeApp ? 'Diiwaangeli oo shid SMS reader' : 'Ku fur gudaha Staff App'}</button></>}
    </section>
  </div></main>;
}
