// app/manufacturing/accounting/receivables/page.tsx - Premium Accounts Receivable Page
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
    Search, 
    ArrowUpRight, 
    TrendingUp, 
    DollarSign,
    Loader2, 
    Calendar,
    Building2,
    Wallet,
    Info,
    X,
    Check,
    Coins,
    Users
} from 'lucide-react';

export default function ReceivablesHubPage() {
    const [receivables, setReceivables] = useState<any[]>([]);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Modal state for Collect Payment
    const [showModal, setShowModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
    const [amountCollected, setAmountCollected] = useState('');
    const [accountId, setAccountId] = useState('');
    const [note, setNote] = useState('');
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');
    const [formSuccess, setFormSuccess] = useState('');

    const fetchReceivablesData = async () => {
        try {
            const [recRes, accRes] = await Promise.all([
                fetch('/api/manufacturing/accounting/receivables'),
                fetch('/api/manufacturing/accounting/accounts')
            ]);
            if (recRes.ok) {
                const data = await recRes.json();
                setReceivables(data.receivables || []);
            }
            if (accRes.ok) {
                const data = await accRes.json();
                const accList = data.accounts || [];
                setAccounts(accList);
                if (accList.length > 0) {
                    setAccountId(accList[0].id);
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReceivablesData();
    }, []);

    const openCollectModal = (invoice: any) => {
        setSelectedInvoice(invoice);
        setAmountCollected(invoice.debtAmount.toString());
        setNote(`Collection for Invoice #${invoice.invoiceNumber}`);
        setShowModal(true);
    };

    const handleCollectPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');
        setFormSuccess('');

        const parsedAmount = parseFloat(amountCollected);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            setFormError('Please enter a valid deposit amount.');
            return;
        }
        if (parsedAmount > selectedInvoice.debtAmount + 0.01) {
            setFormError(`Collection amount cannot exceed outstanding balance of ${selectedInvoice.debtAmount.toLocaleString()} ETB.`);
            return;
        }

        setSaving(true);
        try {
            const res = await fetch('/api/manufacturing/accounting/receivables', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    saleId: selectedInvoice.id,
                    amountCollected: parsedAmount,
                    accountId,
                    note
                })
            });

            const data = await res.json();
            if (res.ok) {
                setFormSuccess('Payment collected and accounted successfully!');
                setAmountCollected('');
                setTimeout(() => {
                    setShowModal(false);
                    setFormSuccess('');
                    fetchReceivablesData();
                }, 1200);
            } else {
                setFormError(data.message || 'Failed to process collection.');
            }
        } catch (err) {
            console.error(err);
            setFormError('Unable to connect to server.');
        } finally {
            setSaving(false);
        }
    };

    // Filter receivables dynamically
    const filteredReceivables = receivables.filter(rec => {
        return rec.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
               rec.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const totalOutstanding = receivables.reduce((sum, r) => sum + r.debtAmount, 0);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="animate-spin text-primary" size={48} />
                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Opening Receivables Hub...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Deymaha Macmiilka (Receivables)</h1>
                    <p className="text-slate-500 font-bold text-sm">Maamul oo la soco deynta macaamiishu ay kula leeyihiin.</p>
                </div>
            </div>

            {/* Total Receivables KPI */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card p-6 bg-slate-900 text-white flex flex-col justify-between min-h-[140px] relative overflow-hidden group">
                    <div className="absolute -right-6 -top-6 opacity-10 rotate-12 group-hover:scale-110 transition-transform duration-500">
                        <Coins size={140} />
                    </div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Deynta Guud ee Maqan (Receivables)</p>
                        <h2 className="text-4xl font-black tracking-tight text-emerald-400">{totalOutstanding.toLocaleString()} ETB</h2>
                    </div>
                    <p className="text-xs font-bold text-slate-400 mt-4">Kani waa wadar ahaan lacagta deynta ah ee kaa maqan.</p>
                </div>

                <div className="card p-6 flex flex-col justify-between min-h-[140px]">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-blue-500/10 text-blue-500 rounded-2xl">
                            <Users size={24} />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dilaalka Macmiilka</span>
                    </div>
                    <div>
                        <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{receivables.length}</p>
                        <p className="text-xs font-bold text-slate-400 mt-1">Macaamiisha weli deyntu u dhimantahay</p>
                    </div>
                </div>

                <div className="card p-6 flex flex-col justify-between min-h-[140px]">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl">
                            <TrendingUp size={24} />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ururinta Kaltanka</span>
                    </div>
                    <div>
                        <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Active</p>
                        <p className="text-xs font-bold text-slate-400 mt-1">Nidaamka ururinta waa mid furay</p>
                    </div>
                </div>
            </div>

            {/* Controls Card */}
            <div className="card p-6">
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Ka raadi magaca ama invoice-ka..."
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900 text-xs font-bold focus:outline-none focus:border-primary transition-colors"
                    />
                </div>
            </div>

            {/* Receivables Table */}
            <div className="card">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50">
                                <th className="p-4 pl-6 text-[10px] font-black uppercase tracking-wider text-slate-400">Macmiilka (Customer)</th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-wider text-slate-400">Invoice Number</th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-wider text-slate-400">Taariikhda</th>
                                <th className="p-4 text-right text-[10px] font-black uppercase tracking-wider text-slate-400">Wadarta / Total</th>
                                <th className="p-4 text-right text-[10px] font-black uppercase tracking-wider text-slate-400">La bixiyey / Paid</th>
                                <th className="p-4 text-right text-[10px] font-black uppercase tracking-wider text-slate-400">Deynta Maqan / Debt</th>
                                <th className="p-4 pr-6 text-center text-[10px] font-black uppercase tracking-wider text-slate-400">Kaltan / Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredReceivables.length > 0 ? (
                                filteredReceivables.map((rec: any, idx: number) => {
                                    return (
                                        <tr key={idx} className="hover:bg-slate-50/30 transition-colors group">
                                            <td className="p-4 pl-6">
                                                <p className="text-xs font-black text-slate-900 dark:text-white tracking-tight">{rec.customerName}</p>
                                                {rec.customerPhone && <p className="text-[10px] text-slate-400 mt-0.5">{rec.customerPhone}</p>}
                                            </td>
                                            <td className="p-4 text-xs font-black">
                                                <Link 
                                                    href={`/manufacturing/sales/${rec.id}`}
                                                    className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 hover:underline transition-colors group/link font-black"
                                                >
                                                    #{rec.invoiceNumber}
                                                    <ArrowUpRight size={12} className="opacity-0 group-hover/link:opacity-100 transition-opacity" />
                                                </Link>
                                            </td>
                                            <td className="p-4 text-xs font-bold text-slate-500">
                                                {new Date(rec.date).toLocaleDateString()}
                                            </td>
                                            <td className="p-4 text-right font-black text-xs text-slate-900 dark:text-white">
                                                {Number(rec.total).toLocaleString()} ETB
                                            </td>
                                            <td className="p-4 text-right font-bold text-xs text-slate-500">
                                                {Number(rec.paidAmount).toLocaleString()} ETB
                                            </td>
                                            <td className="p-4 text-right font-black text-xs text-rose-600">
                                                {Number(rec.debtAmount).toLocaleString()} ETB
                                            </td>
                                            <td className="p-4 pr-6 text-center">
                                                <button
                                                    onClick={() => openCollectModal(rec)}
                                                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors flex items-center gap-1.5 mx-auto active:scale-95"
                                                >
                                                    <DollarSign size={12} /> Collect Payment
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={7} className="py-20 text-center text-slate-400">
                                        <Info size={40} className="opacity-20 mx-auto mb-4" />
                                        <p className="text-xs font-black uppercase tracking-widest">Ma jiraan macaamiil deyn lagu leeyahay</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal: Collect Payment */}
            {showModal && selectedInvoice && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="card w-full max-w-lg p-8 shadow-2xl relative animate-scale-in">
                        <button 
                            onClick={() => setShowModal(false)}
                            className="absolute right-4 top-4 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-400 transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl">
                                <DollarSign size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black tracking-tight">Collect Customer Payment</h3>
                                <p className="text-slate-400 font-bold text-xs">Collect outstanding debt for Invoice #{selectedInvoice.invoiceNumber} from {selectedInvoice.customerName}.</p>
                            </div>
                        </div>

                        <form onSubmit={handleCollectPayment} className="space-y-4">
                            {formError && (
                                <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold flex items-center gap-2">
                                    <Info size={16} />
                                    <span>{formError}</span>
                                </div>
                            )}
                            {formSuccess && (
                                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-bold flex items-center gap-2">
                                    <Check size={16} />
                                    <span>{formSuccess}</span>
                                </div>
                            )}

                            {/* Details Row */}
                            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl flex justify-between items-center text-xs font-black uppercase tracking-wider text-slate-500">
                                <span>Total Outstanding Debt:</span>
                                <span className="text-rose-600 text-sm font-black">{Number(selectedInvoice.debtAmount).toLocaleString()} ETB</span>
                            </div>

                            {/* Amount Input */}
                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">Amount to Collect</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600 font-black text-[10px]">ETB</span>
                                    <input
                                        type="number"
                                        step="any"
                                        value={amountCollected}
                                        onChange={(e) => setAmountCollected(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full pl-12 pr-4 py-2.5 border border-slate-200 dark:border-slate-800 bg-transparent rounded-xl text-xs font-bold focus:outline-none focus:border-primary transition-colors"
                                    />
                                </div>
                            </div>

                            {/* Bank/Cash Account Selector */}
                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">Deposit Account (Bank/Cash)</label>
                                <select
                                    value={accountId}
                                    onChange={(e) => setAccountId(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl text-xs font-bold focus:outline-none focus:border-primary transition-colors"
                                >
                                    {accounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>{acc.name} ({acc.balance.toLocaleString()} ETB)</option>
                                    ))}
                                </select>
                            </div>

                            {/* Note */}
                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">Note / Reference</label>
                                <textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    rows={2}
                                    placeholder="Enter reference memo or notes..."
                                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 bg-transparent rounded-xl text-xs font-bold focus:outline-none focus:border-primary transition-colors"
                                />
                            </div>

                            {/* Save Actions */}
                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 disabled:opacity-55 transition-colors"
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="animate-spin" size={14} /> Processing...
                                        </>
                                    ) : (
                                        <>
                                            <Check size={14} /> Collect Payment
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
