'use client';

import { BarChart3, Factory, Home, Layers, PlusCircle, ShoppingBag, User } from 'lucide-react';

type Props = { active?: 'HOME' | 'SALES' | 'PRODUCTION' | 'TRANSACTIONS' | 'REPORTS' | 'PROFILE' | 'NEW' };

const go = (target: string) => { window.location.href = target; };

export default function MiniAppBottomNav({ active }: Props) {
  const itemClass = (name: Props['active']) => `flex w-full flex-col items-center justify-center gap-0.5 rounded-full py-1.5 text-center transition-all ${active === name ? 'font-extrabold text-cyan-400' : 'text-slate-400 hover:text-white'}`;
  const iconClass = (name: Props['active']) => active === name ? 'text-cyan-400 drop-shadow-[0_0_8px_#22d3ee]' : '';

  return <nav aria-label="Mini App navigation" className="fixed bottom-1 left-1 right-1 z-50 mx-auto grid max-w-lg grid-cols-7 items-center rounded-full border border-white/20 bg-slate-950/95 px-1.5 py-1.5 shadow-[0_0_30px_rgba(0,0,0,0.75),inset_0_1px_1px_rgba(255,255,255,0.3)] backdrop-blur-2xl">
    <button type="button" onClick={() => go('/telegram-mini-app')} className={itemClass('HOME')}><Home size={17} className={iconClass('HOME')} /><span className="text-[8px]">Home</span></button>
    <button type="button" onClick={() => go('/telegram-mini-app?tab=TRANSACTIONS')} className={itemClass('TRANSACTIONS')}><Layers size={17} className={iconClass('TRANSACTIONS')} /><span className="text-[8px]">Txns</span></button>
    <button type="button" onClick={() => go('/telegram-mini-app/sales')} className={itemClass('SALES')}><ShoppingBag size={17} className={iconClass('SALES')} /><span className="text-[8px]">Sales</span></button>
    <button type="button" onClick={() => go('/telegram-mini-app?tab=NEW')} title="Diiwaangeli Kharash/Mushahar" className="relative mx-auto flex h-11 w-11 -translate-y-3 items-center justify-center overflow-hidden rounded-full border-2 border-emerald-200 bg-gradient-to-tr from-emerald-600 via-emerald-400 to-teal-300 text-slate-950 shadow-[0_0_25px_rgba(16,185,129,0.8),inset_0_2px_4px_rgba(255,255,255,0.9)] transition-all active:scale-95"><span className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-b from-white/40 via-transparent to-black/20" /><PlusCircle size={24} className="z-10 stroke-[2.5]" /></button>
    <button type="button" onClick={() => go('/telegram-mini-app/production')} className={itemClass('PRODUCTION')}><Factory size={17} className={iconClass('PRODUCTION')} /><span className="text-[8px]">Prod.</span></button>
    <button type="button" onClick={() => go('/telegram-mini-app?tab=REPORTS')} className={itemClass('REPORTS')}><BarChart3 size={17} className={iconClass('REPORTS')} /><span className="text-[8px]">Reports</span></button>
    <button type="button" onClick={() => go('/telegram-mini-app?tab=PROFILE')} className={itemClass('PROFILE')}><User size={17} className={iconClass('PROFILE')} /><span className="text-[8px]">Profile</span></button>
  </nav>;
}
