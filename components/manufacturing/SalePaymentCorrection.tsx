'use client';
import { useState } from 'react';

export default function SalePaymentCorrection({ sale, onSaved }: { sale: any; onSaved: (sale: any) => void }) {
    const [open, setOpen] = useState(false);
    const [customers, setCustomers] = useState<any[]>([]);
    const [customerId, setCustomerId] = useState(sale.customerId || '');
    const [paid, setPaid] = useState(String(sale.paidAmount));
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const debt = Math.max(0, sale.total - Number(paid));
    const field = 'w-full rounded-xl border border-slate-600 bg-slate-900 text-white p-3';
    async function show() {
        setOpen(true); setPaid(String(sale.paidAmount)); setCustomerId(sale.customerId || ''); setError('');
        try {
            const res = await fetch('/api/manufacturing/customers');
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Customers lama helin.');
            setCustomers(data.customers || []);
        } catch (e: any) { setError(e.message); }
    }
    async function save(event: React.FormEvent) {
        event.preventDefault(); setBusy(true); setError('');
        try {
            const res = await fetch(`/api/manufacturing/sales/${sale.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customerId: customerId || null, paidAmount: Number(paid), reason, updatedAt: sale.updatedAt }) });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Sixitaanku ma kaydsamin.');
            onSaved(data.sale); setOpen(false); setReason('');
        } catch (e: any) { setError(e.message); } finally { setBusy(false); }
    }
    return <div className="print:hidden">
        <button type="button" onClick={show} className="rounded-xl bg-emerald-600 text-white px-4 py-2">Sax lacagta / Dayn</button>
        {open && <form onSubmit={save} className="mt-4 rounded-2xl bg-slate-950 text-slate-100 border border-slate-700 p-5 space-y-4">
            <h2 className="font-bold">Sax lacagta iibka {sale.invoiceNumber}</h2>
            <label className="block">Customer<select className={field} value={customerId} onChange={e => setCustomerId(e.target.value)}><option value="">Walk-in customer</option>{customers.map(c => <option key={c.id} value={c.id}>{c.name}{c.phone || c.phoneNumber ? ` · ${c.phone || c.phoneNumber}` : ' · telefoon ma leh'}</option>)}</select></label>
            <label className="block">Lacagta dhab ahaan la bixiyey (ETB)<input className={field} type="number" min="0" max={sale.total} step="0.01" required value={paid} onChange={e => setPaid(e.target.value)} /></label>
            <p>Dayn: {debt.toLocaleString()} ETB · Isbeddelka account-ka: {(Number(paid) - sale.paidAmount).toLocaleString()} ETB.</p>
            <p className="text-sm text-slate-300">Dayntu waxay u baahan tahay customer iyo telefoon. Tani waxay saxaysaa lacagta la diiwaangeliyey; alaabtii iibka ahayd way sii ahaanaysaa iib.</p>
            <label className="block">Sababta sixitaanka<textarea className={field} required minLength={5} value={reason} onChange={e => setReason(e.target.value)} /></label>
            {error && <p role="alert" className="text-rose-300">{error}</p>}
            <div className="flex gap-3"><button disabled={busy} className="rounded-xl bg-emerald-600 px-4 py-2">{busy ? 'Kaydinayaa…' : 'Kaydi sixitaanka'}</button><button type="button" disabled={busy} onClick={() => setOpen(false)}>Xir</button></div>
        </form>}
    </div>;
}
