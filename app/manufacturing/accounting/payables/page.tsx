// app/manufacturing/accounting/payables/page.tsx - Premium Accounts Payable Page
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
    Search, 
    ArrowDownRight, 
    TrendingDown, 
    DollarSign,
    Loader2, 
    Calendar,
    Building2,
    Wallet,
    Info,
    X,
    Check,
    Coins,
    Truck
} from 'lucide-react';

export default function PayablesHubPage() {
    const [payables, setPayables] = useState<any[]>([]);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Modal state for Pay Supplier
    const [showModal, setShowModal] = useState(false);
    const [selectedPurchase, setSelectedPurchase] = useState<any>(null);
    const [amountPaid, setAmountPaid] = useState('');
    const [accountId, setAccountId] = useState('');
    const [note, setNote] = useState('');
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');
    const [formSuccess, setFormSuccess] = useState('');

    const fetchPayablesData = async () => {
        try {
            const [payRes, accRes] = await Promise.all([
                fetch('/api/manufacturing/accounting/payables'),
                fetch('/api/manufacturing/accounting/accounts')
            ]);
            if (payRes.ok) {
                const data = await payRes.json();
                setPayables(data.payables || []);
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
        fetchPayablesData();
    }, []);

    const openPayModal = (purchase: any) => {
        setSelectedPurchase(purchase);
        setAmountPaid(purchase.debtAmount.toString());
        setNote(`Payment for ${purchase.materialName || purchase.purchaseNumber}`);
        setShowModal(true);
    };

    const handlePaySupplier = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');
        setFormSuccess('');

        const parsedAmount = parseFloat(amountPaid);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            setFormError('Please enter a valid payment amount.');
            return;
        }
        if (parsedAmount > selectedPurchase.debtAmount + 0.01) {
            setFormError(`Payment amount cannot exceed outstanding balance of ${selectedPurchase.debtAmount.toLocaleString()} ETB.`);
            return;
        }

        // Verify if selected bank account has enough balance
        const selectedAcc = accounts.find(a => a.id === accountId);
        if (!selectedAcc || selectedAcc.balance < parsedAmount) {
            setFormError(`Selected bank/cash account has insufficient funds (Balance: ${selectedAcc?.balance?.toLocaleString() || 0} ETB).`);
            return;
        }

        setSaving(true);
        try {
            const res = await fetch('/api/manufacturing/accounting/payables', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    purchaseId: selectedPurchase.id,
                    amountPaid: parsedAmount,
                    accountId,
                    note,
                    source: selectedPurchase.source || 'PurchaseOrder'
                })
            });

            const data = await res.json();
            if (res.ok) {
                setFormSuccess('Supplier payment recorded and ledger updated successfully!');
                setAmountPaid('');
                setTimeout(() => {
                    setShowModal(false);
                    setFormSuccess('');
                    fetchPayablesData();
                }, 1200);
            } else {
                setFormError(data.message || 'Failed to record supplier payment.');
            }
        } catch (err) {
            console.error(err);
            setFormError('Unable to connect to server.');
        } finally {
            setSaving(false);
        }
    };

    // Filter payables dynamically
    const filteredPayables = payables.filter(pay => {
        return pay.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
               pay.purchaseNumber.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const totalOutstanding = payables.reduce((sum, p) => sum + p.debtAmount, 0);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="animate-spin text-primary" size={48} />
                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Opening Payables Hub...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Deymaha Lagugu Leeyahay (Payables)</h1>
                    <p className="text-slate-500 font-bold text-sm">Maamul oo la soco deynta alaab-keenayaashu ay kugu leeyihiin.</p>
                </div>
            </div>

            {/* Total Payables KPI */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card p-6 bg-slate-900 text-white flex flex-col justify-between min-h-[140px] relative overflow-hidden group">
                    <div className="absolute -right-6 -top-6 opacity-10 rotate-12 group-hover:scale-110 transition-transform duration-500">
                        <Coins size={140} />
                    </div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Deynta Guud ee Lagugu Leeyahay (Payables)</p>
                        <h2 className="text-4xl font-black tracking-tight text-rose-400">{totalOutstanding.toLocaleString()} ETB</h2>
                    </div>
                    <p className="text-xs font-bold text-slate-400 mt-4">Kani waa wadar ahaan lacagta deynta ah ee lagugu leeyahay.</p>
                </div>

                <div className="card p-6 flex flex-col justify-between min-h-[140px]">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-rose-500/10 text-rose-500 rounded-2xl">
                            <Truck size={24} />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Alaab-keenayaasha</span>
                    </div>
                    <div>
                        <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{payables.length}</p>
                        <p className="text-xs font-bold text-slate-400 mt-1">Suppliers weli deyntu u dhimantahay</p>
                    </div>
                </div>

                <div className="card p-6 flex flex-col justify-between min-h-[140px]">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl">
                            <TrendingDown size={24} />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kaltanka Dhaqdhaqaaqa</span>
                    </div>
                    <div>
                        <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Active</p>
                        <p className="text-xs font-bold text-slate-400 mt-1">Nidaamka deynbixinta waa mid furan</p>
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
                        placeholder="Ka raadi magaca ama purchase-ka..."
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900 text-xs font-bold focus:outline-none focus:border-primary transition-colors"
                    />
                </div>
            </div>

            {/* Payables Table */}
            <div className="card">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50">
                                <th className="p-4 pl-6 text-[10px] font-black uppercase tracking-wider text-slate-400">Alaab-keenaha (Vendor)</th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-wider text-slate-400">Purchase Number</th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-wider text-slate-400">Taariikhda</th>
                                <th className="p-4 text-right text-[10px] font-black uppercase tracking-wider text-slate-400">Wadarta / Total</th>
                                <th className="p-4 text-right text-[10px] font-black uppercase tracking-wider text-slate-400">La bixiyey / Paid</th>
                                <th className="p-4 text-right text-[10px] font-black uppercase tracking-wider text-slate-400">Deynta kugu taal / Debt</th>
                                <th className="p-4 pr-6 text-center text-[10px] font-black uppercase tracking-wider text-slate-400">Kaltan / Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredPayables.length > 0 ? (
                                filteredPayables.map((pay: any, idx: number) => {
                                    return (
                                        <tr key={idx} className="hover:bg-slate-50/30 transition-colors group">
                                            <td className="p-4 pl-6">
                                                <p className="text-xs font-black text-slate-900 dark:text-white tracking-tight">{pay.vendorName}</p>
                                                <p className="text-[10px] text-slate-400 mt-0.5 font-bold">{pay.materialName}</p>
                                                {pay.vendorPhone && <p className="text-[10px] text-slate-400 mt-0.5">{pay.vendorPhone}</p>}
                                            </td>
                                            <td className="p-4 text-xs font-black">
                                                <Link 
                                                    href={pay.source === 'MaterialPurchase' ? `/manufacturing/material-purchases/${pay.id}` : `/manufacturing/material-purchases/${pay.id}`}
                                                    className="inline-flex items-center gap-1 text-sky-600 hover:text-sky-700 hover:underline transition-colors group/link font-black"
                                                >
                                                    #{pay.purchaseNumber}
                                                    <ArrowDownRight size={12} className="opacity-0 group-hover/link:opacity-100 transition-opacity" />
                                                </Link>
                                                <span className={`ml-2 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${pay.source === 'MaterialPurchase' ? 'bg-sky-100 text-sky-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                                    {pay.source === 'MaterialPurchase' ? 'RAW' : 'PO'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-xs font-bold text-slate-500">
                                                {new Date(pay.date).toLocaleDateString()}
                                            </td>
                                            <td className="p-4 text-right font-black text-xs text-slate-900 dark:text-white">
                                                {Number(pay.totalPrice).toLocaleString()} ETB
                                            </td>
                                            <td className="p-4 text-right font-bold text-xs text-slate-500">
                                                {Number(pay.paidAmount).toLocaleString()} ETB
                                            </td>
                                            <td className="p-4 text-right font-black text-xs text-rose-600">
                                                {Number(pay.debtAmount).toLocaleString()} ETB
                                            </td>
                                            <td className="p-4 pr-6 text-center">
                                                <button
                                                    onClick={() => openPayModal(pay)}
                                                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors flex items-center gap-1.5 mx-auto active:scale-95"
                                                >
                                                    <DollarSign size={12} /> Pay Vendor
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={7} className="py-20 text-center text-slate-400">
                                        <Info size={40} className="opacity-20 mx-auto mb-4" />
                                        <p className="text-xs font-black uppercase tracking-widest">Ma jiraan deymo lagu leeyahay shirkadda</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal: Pay Supplier */}
            {showModal && selectedPurchase && (
                <div className="fixed inset-0 bg-slate-400/30 backdrop-blur-xl z-50 flex items-center justify-center p-4">
                    <div className="w-full max-w-lg p-8 shadow-2xl relative bg-white/80 backdrop-blur-2xl rounded-2xl border border-white/60 ring-1 ring-slate-200/30">
                        <button 
                            onClick={() => setShowModal(false)}
                            className="absolute right-4 top-4 p-2 hover:bg-slate-100/80 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-sky-500/10 text-sky-600 rounded-xl border border-sky-200/40">
                                <DollarSign size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black tracking-tight text-slate-900">Bixi Lacagta Alaab-keenaha</h3>
                                <p className="text-slate-500 font-bold text-xs">{selectedPurchase.materialName} — {selectedPurchase.vendorName}</p>
                            </div>
                        </div>

                        <form onSubmit={handlePaySupplier} className="space-y-4">
                            {formError && (
                                <div className="p-4 rounded-xl bg-rose-50/80 border border-rose-200/50 text-rose-600 text-xs font-bold flex items-center gap-2">
                                    <Info size={16} />
                                    <span>{formError}</span>
                                </div>
                            )}
                            {formSuccess && (
                                <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200/50 text-emerald-600 text-xs font-bold flex items-center gap-2">
                                    <Check size={16} />
                                    <span>{formSuccess}</span>
                                </div>
                            )}

                            {/* Details Row */}
                            <div className="p-4 bg-sky-50/60 rounded-xl border border-sky-200/30 flex justify-between items-center text-xs font-black uppercase tracking-wider text-slate-500">
                                <span>Deynta Kugu Taal:</span>
                                <span className="text-sky-600 text-sm font-black">{Number(selectedPurchase.debtAmount).toLocaleString()} ETB</span>
                            </div>

                            {/* Amount Input */}
                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">Qadarka Lacagta (Amount)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-600 font-black text-[10px]">ETB</span>
                                    <input
                                        type="number"
                                        step="any"
                                        value={amountPaid}
                                        onChange={(e) => setAmountPaid(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full pl-12 pr-4 py-3 border border-slate-200/60 bg-white/50 rounded-xl text-sm font-black text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Bank/Cash Account Selector */}
                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">Koontada (Cash/Bank)</label>
                                <select
                                    value={accountId}
                                    onChange={(e) => setAccountId(e.target.value)}
                                    className="w-full px-4 py-3 border border-slate-200/60 bg-white/50 rounded-xl text-sm font-black text-slate-900 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all"
                                >
                                    {accounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>{acc.name} ({acc.balance.toLocaleString()} ETB)</option>
                                    ))}
                                </select>
                            </div>

                            {/* Note */}
                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">Qoraal / Reference</label>
                                <textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    rows={2}
                                    placeholder="Qoraal ama tixraac..."
                                    className="w-full px-4 py-3 border border-slate-200/60 bg-white/50 rounded-xl text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all"
                                />
                            </div>

                            {/* Save Actions */}
                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200/40">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-5 py-2.5 rounded-xl bg-slate-100/80 hover:bg-slate-200/80 text-[10px] font-black uppercase tracking-wider text-slate-600 transition-colors border border-slate-200/40"
                                >
                                    Ka Noqo
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-sky-500 hover:from-emerald-400 hover:to-sky-400 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 disabled:opacity-50 transition-all shadow-lg shadow-sky-500/20 active:scale-95"
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="animate-spin" size={14} /> Kaydinaya...
                                        </>
                                    ) : (
                                        <>
                                            <Check size={14} /> Bixi Lacagta
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
