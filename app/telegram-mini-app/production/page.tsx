'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, Factory, Loader2, Users } from 'lucide-react';
import MiniAppBottomNav from '../MiniAppBottomNav';

type Product = { id: string; name: string; unit: string; sellingPrice: number };
type Employee = { id: string; fullName: string; role: string; department?: string; productionRate: number; isPercentageLinked: boolean };
type Worker = { employeeId: string; rate: number };

async function readJson(response: Response) {
  const text = await response.text();
  try { return text ? JSON.parse(text) : { error: `Server error (${response.status})` }; }
  catch { return { error: `Server error (${response.status})` }; }
}

export default function TelegramProductionPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [productionDate, setProductionDate] = useState(new Date().toISOString().slice(0, 10));
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/telegram/production').then(async r => { const data = await readJson(r); if (!r.ok) throw new Error(data.error); setProducts(data.products || []); setEmployees(data.employees || []); }).catch(e => setMessage(e.message || 'Xogta lama soo qaadin.')).finally(() => setLoading(false));
  }, []);

  const product = products.find(p => p.id === productId);
  const productionValue = (Number(quantity) || 0) * Number(product?.sellingPrice || 0);
  const commissionTotal = useMemo(() => workers.reduce((sum, w) => sum + productionValue * Number(w.rate || 0) / 100, 0), [workers, productionValue]);

  const toggleWorker = (employee: Employee) => setWorkers(current => current.some(w => w.employeeId === employee.id) ? current.filter(w => w.employeeId !== employee.id) : [...current, { employeeId: employee.id, rate: employee.productionRate || 0 }]);
  const changeRate = (employeeId: string, rate: number) => setWorkers(current => current.map(w => w.employeeId === employeeId ? { ...w, rate: Math.max(0, Math.min(100, rate || 0)) } : w));

  const save = async () => {
    if (!productId || !Number.isInteger(Number(quantity)) || Number(quantity) <= 0 || !workers.length) return setMessage('Dooro product, geli tiro sax ah, kadibna dooro shaqaalihii joogay.');
    setSaving(true); setMessage('Wax-soo-saarka iyo commission-ka waa la kaydinayaa...');
    try {
      const initData = (window as any).Telegram?.WebApp?.initData || '';
      const response = await fetch('/api/telegram/production', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId, quantity: Number(quantity), productionDate, workers, initData }) });
      const data = await readJson(response); if (!response.ok) throw new Error(data.error);
      setMessage(`Waa la kaydiyey: ${data.production.quantity} ${product?.unit || 'pcs'} · Commission ${Number(data.production.commissionTotal).toLocaleString()} ETB.`);
      setQuantity(''); setWorkers([]);
    } catch (error: any) { setMessage(error.message || 'Production-ka lama kaydin.'); } finally { setSaving(false); }
  };

  return <main className="min-h-screen bg-[#020617] px-4 py-4 pb-28 text-slate-100"><div className="mx-auto max-w-md space-y-4">
    <header className="flex items-center justify-between rounded-3xl border border-white/15 bg-slate-900/75 p-4"><button onClick={() => window.location.href = '/telegram-mini-app'} className="rounded-full border border-white/20 bg-white/10 p-2"><ArrowLeft size={19} /></button><div className="text-center"><p className="text-xs font-black tracking-wider">AN-INDUSTRY TERMINAL</p><p className="text-[11px] font-bold text-slate-400">Daily Production & Commission</p></div><Factory className="text-violet-300" size={22} /></header>
    {message && <div className="rounded-2xl border border-violet-400/30 bg-violet-500/10 p-3 text-xs font-bold text-violet-100">{message}</div>}
    <section className="space-y-4 rounded-3xl border border-violet-400/30 bg-slate-900/75 p-4">
      <div className="flex items-center justify-between"><h1 className="text-lg font-black">Production-ka Maanta</h1><span className="text-[10px] font-black text-violet-300">{productionDate}</span></div>
      <label className="block text-[10px] font-black uppercase text-slate-400">Taariikh<input type="date" value={productionDate} onChange={e => setProductionDate(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 p-3 text-sm" /></label>
      <label className="block text-[10px] font-black uppercase text-slate-400">Product<select value={productId} disabled={loading} onChange={e => setProductId(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 p-3 text-sm"><option value="">{loading ? 'Loading...' : 'Dooro product'}</option>{products.map(p => <option key={p.id} value={p.id}>{p.name} · {p.sellingPrice.toLocaleString()} ETB/{p.unit}</option>)}</select></label>
      <label className="block text-[10px] font-black uppercase text-slate-400">Tirada la soo saaray<input type="number" min="1" step="1" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="Tusaale: 1200" className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 p-3 text-sm" /></label>
      <div className="grid grid-cols-2 gap-2"><div className="rounded-2xl bg-cyan-500/10 p-3"><p className="text-[9px] font-black uppercase text-cyan-300">Production Value</p><p className="text-sm font-black">{productionValue.toLocaleString()} ETB</p></div><div className="rounded-2xl bg-emerald-500/10 p-3"><p className="text-[9px] font-black uppercase text-emerald-300">Commission Total</p><p className="text-sm font-black">{commissionTotal.toLocaleString()} ETB</p></div></div>
      <div><div className="mb-2 flex items-center gap-2"><Users size={16} className="text-violet-300" /><p className="text-[10px] font-black uppercase text-slate-400">Shaqaalihii maanta joogay</p></div><div className="max-h-[320px] space-y-2 overflow-y-auto">
        {employees.map(employee => { const selected = workers.find(w => w.employeeId === employee.id); const amount = selected ? productionValue * selected.rate / 100 : 0; return <div key={employee.id} className={`rounded-2xl border p-3 ${selected ? 'border-emerald-400/40 bg-emerald-500/10' : 'border-white/10 bg-white/5'}`}><div className="flex items-center justify-between gap-2"><button type="button" onClick={() => toggleWorker(employee)} className="min-w-0 flex-1 text-left"><p className="truncate text-xs font-black">{employee.fullName}</p><p className="text-[9px] font-bold text-slate-400">{employee.role}{employee.department ? ` · ${employee.department}` : ''}</p></button><input type="checkbox" checked={!!selected} onChange={() => toggleWorker(employee)} className="h-4 w-4 accent-emerald-400" /></div>{selected && <div className="mt-2 grid grid-cols-2 gap-2"><label className="text-[9px] font-black text-slate-400">RATE %<input type="number" min="0" max="100" step="0.01" value={selected.rate} onChange={e => changeRate(employee.id, Number(e.target.value))} className="mt-1 w-full rounded-lg bg-slate-950 p-2 text-xs text-white" /></label><div className="rounded-lg bg-slate-950 p-2"><p className="text-[9px] font-black text-slate-400">COMMISSION</p><p className="mt-1 text-xs font-black text-emerald-300">{amount.toLocaleString()} ETB</p></div></div>}</div>; })}
      </div></div>
      <button onClick={save} disabled={saving || loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 p-3.5 text-xs font-black text-slate-950 disabled:opacity-50">{saving ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />} Kaydi Production-ka</button>
      <p className="text-center text-[9px] font-bold leading-relaxed text-slate-500">Kaydintu waxay kordhinaysaa finished stock, waxay jaraysaa BOM raw materials, waxay diiwaangelinaysaa attendance-ka, commission-kana waxay gelinaysaa production cost. Account lacag lagama jaro ilaa commission-ka dhab ahaan la bixiyo.</p>
    </section>
  </div><MiniAppBottomNav active="PRODUCTION" /></main>;
}
