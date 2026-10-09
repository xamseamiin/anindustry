'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { Loader2, Search, ChevronLeft, ChevronRight, RefreshCw, Pencil, Trash2, X, Check } from 'lucide-react';

export default function ActivityHistory({ kind }: { kind: 'sales' | 'production' }) {
  const [rows, setRows] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [refresh, setRefresh] = useState(0);

  // Edit / Delete states
  const [editingRow, setEditingRow] = useState<any>(null);
  const [deletingRow, setDeletingRow] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Edit fields
  const [editDate, setEditDate] = useState('');
  const [editQuantity, setEditQuantity] = useState('');
  const [editPaidAmount, setEditPaidAmount] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editPaymentMethod, setEditPaymentMethod] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError('');
    const timer = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams({ history: '1', page: String(page), search });
        const response = await fetch(`/api/telegram/${kind}?${params}`, { signal: controller.signal, cache: 'no-store', headers: { 'x-telegram-init-data': (window as any).Telegram?.WebApp?.initData || '' } });
        if (!response.ok) throw new Error(response.status === 403 ? 'Fadlan Telegram-ka ka fur si aad history-ga u aragto.' : 'History-ga lama soo qaadin. Mar kale isku day.');
        const data = await response.json();
        if (!controller.signal.aborted) { setRows(data.rows); setTotal(data.total); setStats(data.stats || null); }
      } catch (cause) {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Xogta lama helin.');
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }, 250);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [kind, page, search, refresh]);

  const openEdit = (row: any) => {
    setEditingRow(row);
    const dateObj = new Date(row.startDate || row.createdAt);
    setEditDate(dateObj.toISOString().slice(0, 10));
    setEditQuantity(String(row.quantity || (row.items?.[0]?.quantity || 1)));
    setEditPaidAmount(String(row.paidAmount || 0));
    setEditStatus(row.status || 'COMPLETED');
    setEditPaymentMethod(row.paymentMethod || 'CASH');
  };

  const handleUpdate = async () => {
    if (!editingRow) return;
    setActionLoading(true);
    setMessage('');
    try {
      const initData = (window as any).Telegram?.WebApp?.initData || '';
      const endpoint = `/api/telegram/${kind}/${editingRow.id}`;
      const payload: any = { initData };

      if (kind === 'sales') {
        payload.saleDate = editDate;
        payload.paidAmount = Number(editPaidAmount);
        payload.paymentMethod = editPaymentMethod;
        payload.items = editingRow.items || [{ productId: editingRow.items?.[0]?.productId, quantity: Number(editQuantity), unitPrice: editingRow.items?.[0]?.unitPrice || 0 }];
      } else {
        payload.startDate = editDate;
        payload.quantity = Number(editQuantity);
        payload.status = editStatus;
      }

      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-telegram-init-data': initData },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Cusboonaysiintu ma fashilantay.');

      setMessage('Waa la cusboonaysiiyey!');
      setEditingRow(null);
      setRefresh(r => r + 1);
    } catch (err: any) {
      setMessage(err.message || 'Error occurred during update.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingRow) return;
    setActionLoading(true);
    setMessage('');
    try {
      const initData = (window as any).Telegram?.WebApp?.initData || '';
      const endpoint = `/api/telegram/${kind}/${deletingRow.id}`;
      const res = await fetch(endpoint, {
        method: 'DELETE',
        headers: { 'x-telegram-init-data': initData }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Tirtiridu ma fashilantay.');

      setMessage('Diiwaanka waa la tirtiray!');
      setDeletingRow(null);
      setRefresh(r => r + 1);
    } catch (err: any) {
      setMessage(err.message || 'Error deleting item.');
    } finally {
      setActionLoading(false);
    }
  };

  const pages = Math.max(1, Math.ceil(total / 25));
  const money = (value: number) => Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 });
  const cards = kind === 'sales' ? [
    ['Total sales', stats ? stats.totalSales.toLocaleString() : '—', `${stats ? stats.totalQuantity.toLocaleString() : '—'} units`, 'border-cyan-400/30 bg-cyan-500/10'],
    ['Today', stats ? stats.todaySales.toLocaleString() : '—', `${stats ? stats.todayQuantity.toLocaleString() : '—'} units`, 'border-emerald-400/30 bg-emerald-500/10'],
    ['This month', stats ? `${Number(stats.monthValue).toLocaleString()} ETB` : '—', `${stats ? stats.totalQuantity.toLocaleString() : '—'} units`, 'border-violet-400/30 bg-violet-500/10']
  ] : [
    ['Total production', stats ? stats.totalBatches.toLocaleString() : '—', `${stats ? Number(stats.totalQuantity).toLocaleString() : '—'} units`, 'border-indigo-400/30 bg-indigo-500/10'],
    ['Today', stats ? stats.todayBatches.toLocaleString() : '—', `${stats ? Number(stats.todayQuantity).toLocaleString() : '—'} units`, 'border-emerald-400/30 bg-emerald-500/10'],
    ['This month', stats ? stats.monthBatches.toLocaleString() : '—', `${stats ? Number(stats.monthQuantity).toLocaleString() : '—'} units`, 'border-violet-400/30 bg-violet-500/10']
  ];

  return <section className="space-y-3" aria-label={`${kind} history`}>
    <Script src="https://telegram.org/js/telegram-web-app.js" strategy="afterInteractive" onReady={() => setRefresh(value => value + 1)} />
    <div className="grid grid-cols-3 gap-2">{cards.map(([label, value, sub, color]) => <div key={label} className={`min-h-[88px] rounded-2xl border p-3 ${color}`}><p className="text-[9px] font-black uppercase tracking-wide text-slate-300">{label}</p><p className="mt-3 truncate text-lg font-black text-white">{value}</p><p className="mt-1 text-[9px] font-bold text-slate-400">{sub}</p></div>)}</div>
    
    {message && <div className="rounded-2xl border border-cyan-400/30 bg-cyan-500/10 p-3 text-xs font-bold text-cyan-200">{message}</div>}

    <div className="flex items-center gap-2 rounded-2xl border border-slate-700/70 bg-slate-900/70 px-3">
      <Search size={16} className="shrink-0 text-slate-400" />
      <input aria-label={`Search ${kind} history`} value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} placeholder={kind === 'sales' ? 'Raadi customer, invoice ama product…' : 'Raadi product ama batch…'} className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-slate-500" />
      <button aria-label="Refresh history" disabled={loading} onClick={() => setRefresh(value => value + 1)} className="p-2 text-slate-400 disabled:opacity-40"><RefreshCw size={15} /></button>
    </div>

    {loading ? <div role="status" className="flex justify-center gap-2 py-12 text-sm text-slate-400"><Loader2 size={18} className="animate-spin" />History loading…</div> : error ? <div role="alert" className="rounded-2xl border border-amber-400/25 bg-amber-500/5 p-4 text-sm text-amber-200">{error}<button onClick={() => setRefresh(value => value + 1)} className="mt-3 block font-bold underline">Retry</button></div> : <>
      <p className="px-1 text-xs text-slate-400">{total.toLocaleString()} records · Newest first</p>
      {!rows.length && <div className="rounded-2xl border border-dashed border-slate-700 p-8 text-center text-sm text-slate-400">{search ? 'Raadintan wax diiwaan ah lagama helin.' : 'Weli wax diiwaan ah ma jiraan.'}</div>}
      
      {rows.map(row => <details key={row.id} className="group rounded-2xl border border-slate-700/60 bg-slate-900/70 p-4 open:border-cyan-700/50">
        <summary className="cursor-pointer list-none space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="break-words text-sm font-bold text-slate-100">{kind === 'sales' ? row.customer?.name || 'Walk-in customer' : row.productName}</p>
              <p className="mt-1 text-[11px] text-slate-400">{row.invoiceNumber || row.orderNumber}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="shrink-0 text-right text-sm font-semibold text-cyan-200">{kind === 'sales' ? `${money(row.total)} ${row.currency}` : `${money(row.quantity)} ${row.product?.unit || 'pcs'}`}</span>
              {/* Action Buttons: Edit & Delete */}
              <div className="flex items-center gap-1.5 pt-1">
                <button type="button" onClick={(e) => { e.stopPropagation(); openEdit(row); }} className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 p-1.5 text-cyan-300 hover:bg-cyan-500/20" title="Edit">
                  <Pencil size={13} />
                </button>
                <button type="button" onClick={(e) => { e.stopPropagation(); setDeletingRow(row); }} className="rounded-lg border border-rose-400/30 bg-rose-500/10 p-1.5 text-rose-300 hover:bg-rose-500/20" title="Delete">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 text-[10px]">
            <span className="text-slate-400">{new Date(row.startDate || row.createdAt).toLocaleDateString('en-GB', { timeZone: 'Africa/Nairobi', day: 'numeric', month: 'short', year: 'numeric' })}</span>
            <span className="rounded-md bg-white/5 px-2 py-1 text-slate-300">{row.paymentStatus || row.status}</span>
            <span className="text-slate-500 group-open:hidden">View details ↓</span>
          </div>
        </summary>

        <div className="mt-3 space-y-2 border-t border-slate-700/60 pt-3 text-xs text-slate-300">
          {kind === 'sales' ? <>{row.items?.map((item: any, index: number) => <div key={index} className="flex justify-between gap-3"><span>{item.productName} · {item.quantity} × {money(item.unitPrice)}</span><span>{money(item.total)}</span></div>)}<p className="pt-2 text-emerald-300">Paid: {money(row.paidAmount)} {row.currency}</p><p>Balance: {money(Math.max(0, row.total - row.paidAmount))} {row.currency}</p><p className="text-slate-400">Account: {row.account?.name || '—'} · {row.status}</p></> : <><p>Status: {row.status}</p><p className="text-slate-400">Shaqaalaha / commission rates</p>{row.workOrders?.length ? row.workOrders.map((worker: any, index: number) => <div key={index} className="flex justify-between gap-3"><span>{worker.assignedTo?.fullName || 'Unassigned'}</span><span>{worker.productionRate}%</span></div>) : <p>Shaqaale laguma darin.</p>}</>}
        </div>
      </details>)}

      {total > 25 && <div className="flex items-center justify-between pt-2 text-xs"><button disabled={page <= 1} onClick={() => setPage(value => value - 1)} className="flex items-center gap-1 rounded-xl border border-slate-700 p-3 disabled:opacity-30"><ChevronLeft size={14} />Previous</button><span className="text-slate-400">{page} / {pages}</span><button disabled={page >= pages} onClick={() => setPage(value => value + 1)} className="flex items-center gap-1 rounded-xl border border-slate-700 p-3 disabled:opacity-30">Next<ChevronRight size={14} /></button></div>}
    </>}

    {/* EDIT MODAL */}
    {editingRow && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md space-y-4 rounded-3xl border border-cyan-400/30 bg-slate-900 p-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-white flex items-center gap-2"><Pencil size={16} className="text-cyan-300" /> Edit {kind === 'sales' ? 'Sale' : 'Production Order'}</h3>
          <button onClick={() => setEditingRow(null)} className="rounded-full bg-white/10 p-1 text-slate-400"><X size={16} /></button>
        </div>
        <p className="text-xs text-slate-400">{editingRow.invoiceNumber || editingRow.orderNumber} · {editingRow.customer?.name || editingRow.productName}</p>

        <div className="space-y-3">
          <label className="block text-xs font-bold text-slate-300">Taariikh / Date
            <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 p-3 text-sm text-white" />
          </label>

          {kind === 'sales' ? <>
            <label className="block text-xs font-bold text-slate-300">Paid Amount (ETB)
              <input type="number" min="0" value={editPaidAmount} onChange={e => setEditPaidAmount(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 p-3 text-sm text-white" />
            </label>
            <label className="block text-xs font-bold text-slate-300">Payment Method
              <select value={editPaymentMethod} onChange={e => setEditPaymentMethod(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 p-3 text-sm text-white">
                <option value="CASH">Cash</option>
                <option value="BANK_TRANSFER">Bank Transfer / E-Birr</option>
                <option value="CREDIT">Credit / Dayn</option>
                <option value="CARD">Card</option>
              </select>
            </label>
          </> : <>
            <label className="block text-xs font-bold text-slate-300">Tirada (Quantity)
              <input type="number" min="1" value={editQuantity} onChange={e => setEditQuantity(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 p-3 text-sm text-white" />
            </label>
            <label className="block text-xs font-bold text-slate-300">Status
              <select value={editStatus} onChange={e => setEditStatus(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 p-3 text-sm text-white">
                <option value="COMPLETED">Completed</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="PENDING">Pending</option>
              </select>
            </label>
          </>}
        </div>

        <div className="flex gap-2 pt-2">
          <button type="button" onClick={() => setEditingRow(null)} className="w-1/2 rounded-xl border border-white/10 bg-slate-800 p-3 text-xs font-bold text-slate-300">Cancel</button>
          <button type="button" onClick={handleUpdate} disabled={actionLoading} className="flex w-1/2 items-center justify-center gap-1.5 rounded-xl bg-cyan-500 p-3 text-xs font-black text-slate-950 disabled:opacity-50">
            {actionLoading ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Save Changes
          </button>
        </div>
      </div>
    </div>}

    {/* DELETE CONFIRMATION MODAL */}
    {deletingRow && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md space-y-4 rounded-3xl border border-rose-400/30 bg-slate-900 p-5 shadow-2xl text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 text-rose-300">
          <Trash2 size={24} />
        </div>
        <h3 className="text-base font-black text-white">Tirtir {kind === 'sales' ? 'Iibkan' : 'Order-kan'}?</h3>
        <p className="text-xs text-slate-300">
          Ma hubtaa inaad tirtirto {deletingRow.invoiceNumber || deletingRow.orderNumber}? Stock-ga iyo balance-ka akownada si otomaatig ah ayaa dib loogu soo celin doonaa.
        </p>
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={() => setDeletingRow(null)} className="w-1/2 rounded-xl border border-white/10 bg-slate-800 p-3 text-xs font-bold text-slate-300">Kansal</button>
          <button type="button" onClick={handleDelete} disabled={actionLoading} className="flex w-1/2 items-center justify-center gap-1.5 rounded-xl bg-rose-500 p-3 text-xs font-black text-white disabled:opacity-50">
            {actionLoading ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />} Haa, Tirtir
          </button>
        </div>
      </div>
    </div>}

  </section>;
}
