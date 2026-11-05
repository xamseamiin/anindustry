'use client';

import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Search, Loader2, CheckCircle2, AlertCircle, 
  Wallet, Phone, Calendar, Coins, RefreshCw, X, Check, 
  TrendingDown, UserCheck, ShieldAlert
} from 'lucide-react';

interface ReceivableItem {
  id: string;
  invoiceNumber: string;
  customerId: string | null;
  customerName: string;
  customerPhone: string;
  total: number;
  paidAmount: number;
  debtAmount: number;
  paymentStatus: string;
  paymentMethod: string;
  date: string;
  itemsCount: number;
  itemNames: string[];
}

interface AccountItem {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
}

export default function TelegramAccountingPage() {
  const [receivables, setReceivables] = useState<ReceivableItem[]>([]);
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [totalDebt, setTotalDebt] = useState(0);
  const [debtCount, setDebtCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'RECEIVABLES' | 'ACCOUNTS'>('RECEIVABLES');

  // Collect Debt Modal State
  const [selectedReceivable, setSelectedReceivable] = useState<ReceivableItem | null>(null);
  const [amountToPay, setAmountToPay] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [note, setNote] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const getInitData = () => {
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.initData) {
      return (window as any).Telegram.WebApp.initData;
    }
    return '';
  };

  const fetchReceivables = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/telegram/accounting/receivables', {
        headers: {
          'x-telegram-init-data': getInitData()
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Xogta deynta lama soo qaadin');

      setReceivables(data.receivables || []);
      setAccounts(data.accounts || []);
      setTotalDebt(data.summary?.totalDebt || 0);
      setDebtCount(data.summary?.count || 0);
      if (data.accounts?.length && !selectedAccountId) {
        setSelectedAccountId(data.accounts[0].id);
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Khalad ayaa dhacay.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceivables();
  }, []);

  const openPayModal = (item: ReceivableItem) => {
    setSelectedReceivable(item);
    setAmountToPay(String(item.debtAmount)); // Default to full remaining balance
    setNote(`Deymoshubka Invoice #${item.invoiceNumber}`);
    setPaymentDate(new Date().toISOString().slice(0, 10));
    if (accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].id);
    }
  };

  const closePayModal = () => {
    setSelectedReceivable(null);
    setAmountToPay('');
    setNote('');
    setPaymentDate(new Date().toISOString().slice(0, 10));
  };

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReceivable) return;

    const parsedAmount = Number(amountToPay);
    if (!parsedAmount || parsedAmount <= 0) {
      setFeedback({ type: 'error', message: 'Fadlan geli qadar sax ah oo lacag ah.' });
      return;
    }
    if (parsedAmount > selectedReceivable.debtAmount + 0.05) {
      setFeedback({
        type: 'error',
        message: `Lacagta la bixinayo (${parsedAmount.toLocaleString()} ETB) kama badnaan karto deynta hadhay (${selectedReceivable.debtAmount.toLocaleString()} ETB).`
      });
      return;
    }
    if (!selectedAccountId) {
      setFeedback({ type: 'error', message: 'Fadlan dooro account-ka lacagta lagu shubay.' });
      return;
    }

    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/telegram/accounting/receivables', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-telegram-init-data': getInitData()
        },
        body: JSON.stringify({
          saleId: selectedReceivable.id,
          amountCollected: parsedAmount,
          accountId: selectedAccountId,
          note,
          paymentDate
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lacag-bixinta waa la diiday');

      setFeedback({ type: 'success', message: data.message || 'Lacagta si guul leh ayaa loo shubay!' });
      closePayModal();
      await fetchReceivables(); // Refresh data
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Khalad ayaa dhacay xilligii kaydinta.' });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredReceivables = receivables.filter(r => 
    r.customerName.toLowerCase().includes(search.toLowerCase()) ||
    r.customerPhone.toLowerCase().includes(search.toLowerCase()) ||
    r.invoiceNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 pb-24 text-slate-100">
      {/* Top Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-white/10 bg-slate-950/90 px-4 py-3 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <button 
            type="button" 
            onClick={() => window.location.href = '/telegram-mini-app'} 
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-slate-900 text-slate-300 transition-all active:scale-95 hover:text-white"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-sm font-black uppercase tracking-wider text-white">Xisaabaadka & Daymaha</h1>
            <p className="text-[10px] text-slate-400">Receivables & Account Balances</p>
          </div>
        </div>
        <button 
          type="button" 
          onClick={fetchReceivables}
          disabled={loading}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-slate-900 text-slate-300 active:scale-95 disabled:opacity-50"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin text-cyan-400' : ''} />
        </button>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-lg space-y-4 p-4">
        {/* Feedback Alert */}
        {feedback && (
          <div className={`flex items-start gap-3 rounded-2xl border p-3.5 text-xs font-bold ${
            feedback.type === 'success' 
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' 
              : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
          }`}>
            {feedback.type === 'success' ? <CheckCircle2 size={18} className="shrink-0" /> : <AlertCircle size={18} className="shrink-0" />}
            <span className="flex-1 leading-relaxed">{feedback.message}</span>
            <button type="button" onClick={() => setFeedback(null)} className="opacity-70 hover:opacity-100">
              <X size={15} />
            </button>
          </div>
        )}

        {/* Hero Debt Metric Card */}
        <div className="relative overflow-hidden rounded-3xl border border-rose-500/20 bg-gradient-to-br from-rose-950/50 via-slate-900 to-slate-950 p-5 shadow-2xl">
          <div className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full bg-rose-500/10 blur-2xl" />
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-rose-300">
              <TrendingDown size={12} /> Wadarta Daynta Macaamiisha
            </span>
            <span className="text-[10px] font-bold text-slate-400">{debtCount} Qaansheegadood</span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <h2 className="text-3xl font-black tracking-tight text-white">{totalDebt.toLocaleString()}</h2>
            <span className="text-xs font-black text-rose-400">ETB</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Lacagaha bannaanka taal ee u baahan in laga soo ururiyo macaamiisha.</p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 gap-1 rounded-2xl border border-white/10 bg-slate-900/80 p-1">
          <button
            type="button"
            onClick={() => setActiveTab('RECEIVABLES')}
            className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-black transition-all ${
              activeTab === 'RECEIVABLES' 
                ? 'bg-gradient-to-r from-rose-600 to-rose-500 text-white shadow-lg' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserCheck size={15} />
            <span>Daymaha ({debtCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ACCOUNTS')}
            className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-black transition-all ${
              activeTab === 'ACCOUNTS' 
                ? 'bg-gradient-to-r from-cyan-600 to-cyan-500 text-white shadow-lg' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Wallet size={15} />
            <span>Koontooyinka ({accounts.length})</span>
          </button>
        </div>

        {/* Tab 1: RECEIVABLES LIST */}
        {activeTab === 'RECEIVABLES' && (
          <div className="space-y-3">
            {/* Search Input */}
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input 
                type="text"
                placeholder="Raadi magaca macmiilka ama Invoice #..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-900/90 py-2.5 pl-10 pr-4 text-xs font-bold text-white placeholder-slate-500 focus:border-rose-400 focus:outline-none"
              />
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                <Loader2 size={28} className="animate-spin text-rose-400" />
                <p className="mt-2 text-xs font-bold">Soo dejinaya daymaha...</p>
              </div>
            ) : filteredReceivables.length === 0 ? (
              <div className="rounded-2xl border border-white/5 bg-slate-900/40 p-8 text-center text-slate-400">
                <CheckCircle2 size={32} className="mx-auto text-emerald-400 opacity-60" />
                <p className="mt-2 text-xs font-bold text-white">Wax deyn ah lama helin!</p>
                <p className="mt-1 text-[10px] text-slate-500">{search ? 'Raadinta kuma jiro magacan.' : 'Dhammaan iibyada lacagtooda waa la wada bixiyey.'}</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredReceivables.map((item) => (
                  <div 
                    key={item.id}
                    className="group relative rounded-2xl border border-white/10 bg-slate-900/70 p-4 transition-all hover:border-white/20 hover:bg-slate-900"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate text-sm font-black text-white">{item.customerName}</h3>
                          <span className="rounded-md border border-rose-500/30 bg-rose-500/10 px-1.5 py-0.5 text-[9px] font-black uppercase text-rose-300">
                            {item.paymentStatus}
                          </span>
                        </div>
                        {item.customerPhone ? (
                          <a 
                            href={`tel:${item.customerPhone}`}
                            className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-cyan-400 hover:underline"
                          >
                            <Phone size={11} /> {item.customerPhone}
                          </a>
                        ) : (
                          <p className="mt-1 text-[10px] text-slate-500">Tel lama hayo</p>
                        )}
                      </div>

                      {/* Outstanding Debt Badge */}
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Deynta Hadhay</p>
                        <p className="text-base font-black text-rose-400">{item.debtAmount.toLocaleString()} <span className="text-[10px]">ETB</span></p>
                      </div>
                    </div>

                    {/* Breakdown Details */}
                    <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2.5 text-[10px] text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} className="text-slate-500" />
                        <span>#{item.invoiceNumber}</span>
                        <span>·</span>
                        <span>{new Date(item.date).toLocaleDateString('en-GB')}</span>
                      </div>
                      <div>
                        <span>Wadarta: <b className="text-slate-200">{item.total.toLocaleString()}</b></span>
                        <span className="mx-1">|</span>
                        <span>Bixiyey: <b className="text-emerald-300">{item.paidAmount.toLocaleString()}</b></span>
                      </div>
                    </div>

                    {/* Pay Button */}
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => openPayModal(item)}
                        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-emerald-400/30 bg-emerald-500/15 py-2 text-xs font-black uppercase tracking-wider text-emerald-300 transition-all active:scale-95 hover:bg-emerald-500/25"
                      >
                        <Coins size={14} />
                        <span>Bixi Deynta (Pay)</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: ACCOUNTS LIST */}
        {activeTab === 'ACCOUNTS' && (
          <div className="space-y-2.5">
            {accounts.map(acc => (
              <div key={acc.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-500/10 text-cyan-300">
                    <Wallet size={18} />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-white">{acc.name}</h3>
                    <p className="text-[10px] text-slate-400">{acc.type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-emerald-300">{acc.balance.toLocaleString()} {acc.currency}</p>
                  <p className="text-[9px] font-bold text-slate-500">Live Balance</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Collect Debt Payment Modal */}
      {selectedReceivable && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm sm:items-center p-0 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl border border-white/20 bg-slate-900 p-5 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-rose-400">Bixinta Deynta</span>
                <h3 className="text-base font-black text-white">{selectedReceivable.customerName}</h3>
                <p className="text-[10px] text-slate-400">Invoice #{selectedReceivable.invoiceNumber}</p>
              </div>
              <button 
                type="button" 
                onClick={closePayModal}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handlePaySubmit} className="mt-4 space-y-4">
              {/* Debt Due Display */}
              <div className="flex items-center justify-between rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3">
                <span className="text-xs font-bold text-rose-300">Deynta Hadhay:</span>
                <span className="text-base font-black text-white">{selectedReceivable.debtAmount.toLocaleString()} ETB</span>
              </div>

              {/* Quick Fill Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAmountToPay(String(selectedReceivable.debtAmount))}
                  className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 py-2 text-[11px] font-black text-emerald-300 hover:bg-emerald-500/20"
                >
                  Bixi Dhammaan (Full)
                </button>
                <button
                  type="button"
                  onClick={() => setAmountToPay(String(Math.round(selectedReceivable.debtAmount / 2)))}
                  className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 py-2 text-[11px] font-black text-cyan-300 hover:bg-cyan-500/20"
                >
                  Bixi Nus (50%)
                </button>
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400">
                  Qadarka la bixinayo (ETB)
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  max={selectedReceivable.debtAmount}
                  required
                  value={amountToPay}
                  onChange={e => setAmountToPay(e.target.value)}
                  placeholder="Geli cadadka lacagta..."
                  className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 p-3 text-sm font-black text-white placeholder-slate-600 focus:border-emerald-400 focus:outline-none"
                />
              </div>

              {/* Account Dropdown */}
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400">
                  Account-ka lacagta lagu shubayo
                </label>
                <select
                  required
                  value={selectedAccountId}
                  onChange={e => setSelectedAccountId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 p-3 text-xs font-bold text-white focus:border-cyan-400 focus:outline-none"
                >
                  <option value="">Dooro Account</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} · {acc.balance.toLocaleString()} {acc.currency}
                    </option>
                  ))}
                </select>
              </div>

              {/* Note Input */}
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400">Taariikhda lacag-bixinta</label>
                <input type="date" required value={paymentDate} onChange={e => setPaymentDate(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 p-2.5 text-xs text-white focus:border-cyan-400 focus:outline-none" />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400">
                  Faahfaahin / Xusuusin (Ikhtiyaari)
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Xusuusin..."
                  className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 p-2.5 text-xs text-white placeholder-slate-600 focus:border-white/30 focus:outline-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={closePayModal}
                  className="rounded-xl border border-white/10 bg-slate-800 py-3 text-xs font-bold text-slate-300 hover:bg-slate-700"
                >
                  Ka noqo
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 py-3 text-xs font-black text-slate-950 transition-all disabled:opacity-50"
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  <span>Xaqiiji Lacagta</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
