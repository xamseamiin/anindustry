'use client';

import { useEffect, useState } from 'react';
import { Check, Loader2, ShieldCheck, UserCog } from 'lucide-react';

const controls = [
  ['isActive', 'App-ka geli'], ['viewDashboard', 'Dashboard arag'], ['viewTransactions', 'Transactions arag'],
  ['addExpense', 'Kharash/dalab geli'], ['viewSales', 'Sales history arag'], ['addSales', 'Sale cusub geli'],
  ['viewProduction', 'Production history arag'], ['addProduction', 'Production cusub geli'],
  ['viewReports', 'Reports arag'], ['viewProfile', 'Profile arag'], ['manageUsers', 'Users maamul'],
  ['manageExpenses', 'Kharash ansixi/diid']
] as const;

export default function AccessControlPanel({ initData }: { initData: string }) {
  const [users, setUsers] = useState<any[]>([]);
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState('');
  const [message, setMessage] = useState('');

  const load = async () => {
    if (!initData) return;
    setLoading(true);
    try {
      const response = await fetch('/api/telegram/access', { cache: 'no-store', headers: { 'x-telegram-init-data': initData } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Access list lama helin.');
      setAllowed(Boolean(data.current?.permissions?.manageUsers));
      setUsers(data.users || []);
    } catch (error: any) { setMessage(error.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, [initData]);
  if (!initData || (!loading && !allowed)) return null;

  const toggle = (id: string, key: string) => setUsers(current => current.map(user => {
    if (user.id !== id) return user;
    const enabled = !user.permissions[key];
    if (key === 'isAdmin' && enabled) {
      return { ...user, permissions: { ...user.permissions, isAdmin: true, isActive: true, ...Object.fromEntries(controls.map(([permission]) => [permission, true])) } };
    }
    return { ...user, permissions: { ...user.permissions, [key]: enabled } };
  }));
  const save = async (user: any) => {
    setSavingId(user.id); setMessage('');
    try {
      const response = await fetch('/api/telegram/access', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ initData, id: user.id, permissions: user.permissions }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Permissions lama kaydin.');
      setMessage(`${user.displayName}: permissions waa la kaydiyey.`);
      await load();
    } catch (error: any) { setMessage(error.message); }
    finally { setSavingId(''); }
  };

  return <section className="space-y-3 rounded-3xl border border-emerald-400/25 bg-slate-950/80 p-4">
    <div className="flex items-center justify-between"><div><h3 className="flex items-center gap-2 text-xs font-black text-white"><UserCog size={15} className="text-emerald-300" /> User Access Control</h3><p className="mt-1 text-[9px] font-bold text-slate-500">Qof kasta waxa uu arki karo iyo waxa uu samayn karo.</p></div><ShieldCheck size={20} className="text-emerald-400" /></div>
    {message && <p role="status" className="rounded-xl bg-cyan-500/10 p-2 text-[10px] font-bold text-cyan-100">{message}</p>}
    {loading ? <p className="flex items-center justify-center gap-2 py-6 text-xs text-slate-400"><Loader2 size={14} className="animate-spin" /> Users loading…</p> : users.length === 0 ? <p className="text-[10px] text-slate-500">Qof kale weli Mini App-ka ma furin. Markuu furo halkan ayuu kasoo muuqanayaa.</p> : users.map(user => <article key={user.id} className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
      <div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="truncate text-xs font-black text-white">{user.displayName}</p><p className="truncate text-[9px] text-slate-500">{user.username ? `@${user.username} · ` : ''}ID {user.telegramId}</p></div><span className={`rounded-lg px-2 py-1 text-[8px] font-black ${user.permissions.isAdmin ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-800 text-slate-300'}`}>{user.permissions.isAdmin ? 'ADMIN' : 'MEMBER'}</span></div>
      <label className="flex items-center justify-between rounded-xl bg-white/5 p-2 text-[10px] font-bold text-amber-100">Admin ka dhig<input type="checkbox" checked={Boolean(user.permissions.isAdmin)} onChange={() => toggle(user.id, 'isAdmin')} className="h-4 w-4 accent-emerald-400" /></label>
      <div className="grid grid-cols-2 gap-1.5">{controls.map(([key, label]) => <label key={key} className="flex min-h-10 items-center justify-between gap-2 rounded-xl bg-slate-900 p-2 text-[9px] font-bold text-slate-300"><span>{label}</span><input type="checkbox" checked={Boolean(user.permissions[key])} onChange={() => toggle(user.id, key)} className="h-4 w-4 shrink-0 accent-emerald-400" /></label>)}</div>
      <button type="button" disabled={savingId === user.id} onClick={() => save(user)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 p-2.5 text-[10px] font-black text-slate-950 disabled:opacity-50">{savingId === user.id ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Kaydi permissions-ka</button>
    </article>)}
  </section>;
}
