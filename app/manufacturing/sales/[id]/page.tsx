// app/manufacturing/sales/[id]/page.tsx - AN-Industory Invoice Details
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
    ArrowLeft, Printer, Download, Share2, 
    FileText, User, Calendar, CreditCard, 
    CheckCircle2, AlertCircle, Loader2,
    RefreshCcw, X, Wallet, Building2
} from 'lucide-react';
import Toast from '@/components/common/Toast';

export default function SaleDetailPage() {
    const { id } = useParams();
    const [sale, setSale] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [refundModalOpen, setRefundModalOpen] = useState(false);
    const [selectedAccountId, setSelectedAccountId] = useState('');
    const [refundLoading, setRefundLoading] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        const fetchSaleAndAccounts = async () => {
            try {
                const [saleRes, accountsRes] = await Promise.all([
                    fetch(`/api/manufacturing/sales/${id}`),
                    fetch('/api/manufacturing/accounting/accounts')
                ]);
                if (saleRes.ok) {
                    const data = await saleRes.json();
                    setSale(data.sale);
                }
                if (accountsRes.ok) {
                    const data = await accountsRes.json();
                    const fetchedAccounts = data.accounts || [];
                    setAccounts(fetchedAccounts);
                    if (fetchedAccounts.length > 0) {
                        setSelectedAccountId(fetchedAccounts[0].id);
                    }
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchSaleAndAccounts();
    }, [id]);

    const handleRefund = async () => {
        if (!selectedAccountId) {
            setToast({ message: 'Fadlan dooro account-ka lacagta laga celinayo!', type: 'error' });
            return;
        }
        setRefundLoading(true);
        try {
            const res = await fetch('/api/manufacturing/sales/refund', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ saleId: sale.id, accountId: selectedAccountId })
            });
            const data = await res.json();
            if (res.ok) {
                setToast({ message: data.message || 'Refund processed successfully!', type: 'success' });
                setRefundModalOpen(false);
                // Refetch updated details
                const updatedRes = await fetch(`/api/manufacturing/sales/${id}`);
                if (updatedRes.ok) {
                    const updatedData = await updatedRes.json();
                    setSale(updatedData.sale);
                }
            } else {
                setToast({ message: data.error || 'Celinta (refund) waa ku guuldareysatay!', type: 'error' });
            }
        } catch (e) {
            setToast({ message: 'Cilad farsamo ayaa dhacday!', type: 'error' });
        } finally {
            setRefundLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="animate-spin text-primary" size={48} />
                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Fetching Invoice Details...</p>
            </div>
        );
    }

    if (!sale) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <AlertCircle className="text-rose-500" size={48} />
                <h2 className="text-xl font-black text-slate-900">Araaqidda lama helin!</h2>
                <Link href="/manufacturing/sales" className="btn-primary">Back to Sales</Link>
            </div>
        );
    }

    const debt = sale.total - (sale.paidAmount || 0);

    return (
        <div className="space-y-8 animate-fade-in max-w-[1400px] mx-auto pb-20">
            {/* Header / Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/manufacturing/sales" className="p-2.5 bg-white dark:bg-slate-900 rounded-xl hover:bg-slate-50 text-slate-400 border border-slate-200 dark:border-slate-800 transition-all">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Invoice {sale.invoiceNumber}</h1>
                        <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Detailed Transaction Log</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => window.print()} className="btn-secondary flex items-center gap-2">
                        <Printer size={18} /> Print
                    </button>
                    <button className="btn-primary flex items-center gap-2">
                        <Download size={18} /> PDF
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Invoice Column */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="card p-8 bg-white dark:bg-slate-900 border-none shadow-xl print:shadow-none print:border print:p-0">
                        {/* Internal Logo/Header for Print */}
                        <div className="flex justify-between items-start mb-12 border-b border-slate-50 pb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-brand-gradient rounded-2xl flex items-center justify-center text-white font-black shadow-lg">AN</div>
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">AN-Industory</h2>
                                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">Enterprise Manufacturing</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Invoice</p>
                                <p className="text-2xl font-black text-emerald-500">#{sale.invoiceNumber}</p>
                                <p className="text-xs font-bold text-slate-400 mt-1">{new Date(sale.createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>

                        {/* Addresses */}
                        <div className="grid grid-cols-2 gap-12 mb-12">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Bill To:</p>
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500"><User size={18} /></div>
                                    <div>
                                        <p className="text-lg font-black text-slate-900 dark:text-white">{sale.customer?.name || 'Walk-in Customer'}</p>
                                        <p className="text-sm font-bold text-slate-500">{sale.customer?.phone || 'No Phone Provided'}</p>
                                        <p className="text-sm font-bold text-slate-500">{sale.customer?.address || 'Mogadishu, Somalia'}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Payment Info:</p>
                                <div className="inline-block px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                                    <p className="text-xs font-black text-slate-900 dark:text-white mb-1 uppercase tracking-tighter">{sale.account?.name || 'Main Cash Account'}</p>
                                    <p className="text-xs font-bold text-slate-400">Method: {sale.paymentMethod || 'Cash'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="mb-12">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-50">
                                        <th className="pb-4 pl-2">Product Description</th>
                                        <th className="pb-4 text-center">Qty</th>
                                        <th className="pb-4 text-center">Price</th>
                                        <th className="pb-4 text-right pr-2">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {sale.items?.map((item: any) => (
                                        <tr key={item.id} className="text-sm">
                                            <td className="py-6 pl-2">
                                                <p className="font-black text-slate-900 dark:text-white">{item.productName}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bottle Unit</p>
                                            </td>
                                            <td className="py-6 text-center font-black text-slate-900 dark:text-white">{item.quantity}</td>
                                            <td className="py-6 text-center font-bold text-slate-400">{Number(item.unitPrice).toFixed(2)} <span className="text-[9px]">ETB</span></td>
                                            <td className="py-6 text-right pr-2 font-black text-slate-900 dark:text-white">{Number(item.total).toLocaleString()} <span className="text-[9px] font-normal text-slate-400">ETB</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                             </table>
                        </div>

                        {/* Totals */}
                        <div className="flex justify-end pt-8 border-t border-slate-50">
                            <div className="w-full max-w-[240px] space-y-3">
                                <div className="flex justify-between items-center text-sm font-bold text-slate-400">
                                    <span>Subtotal</span>
                                    <span className="text-slate-900 dark:text-white">{Number(sale.subtotal).toLocaleString()} ETB</span>
                                </div>
                                <div className="flex justify-between items-center text-sm font-bold text-slate-400">
                                    <span>Tax (0%)</span>
                                    <span className="text-slate-900 dark:text-white">0.00 ETB</span>
                                </div>
                                <div className="flex justify-between items-center pt-4 border-t border-emerald-500/20">
                                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Grand Total</span>
                                    <span className="text-3xl font-black text-emerald-500">{Number(sale.total).toLocaleString()} <span className="text-sm font-normal text-slate-400">ETB</span></span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Status & Sidebar */}
                <div className="space-y-6">
                    <div className="card p-6">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Payment Progress</h4>
                        
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-xl ${sale.paidAmount >= sale.total ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                        <CreditCard size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Paid Amount</p>
                                        <p className="text-lg font-black text-slate-900 dark:text-white">{Number(sale.paidAmount).toLocaleString()} ETB</p>
                                    </div>
                                </div>
                                <CheckCircle2 className={sale.paidAmount >= sale.total ? 'text-emerald-500' : 'text-slate-200'} size={24} />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-xl ${debt > 0 ? 'bg-rose-500/10 text-rose-500' : 'bg-slate-100 text-slate-300'}`}>
                                        <AlertCircle size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Outstanding Debt</p>
                                        <p className="text-lg font-black text-slate-900 dark:text-white">{debt.toLocaleString()} ETB</p>
                                    </div>
                                </div>
                                {debt > 0 && <span className="px-2 py-1 bg-rose-100 text-rose-600 rounded text-[9px] font-black uppercase">Unpaid</span>}
                            </div>
                            
                            <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-emerald-500 transition-all duration-1000" 
                                    style={{ width: `${(sale.paidAmount / sale.total) * 100}%` }} 
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 mt-8">
                            {debt > 0 && sale.status !== 'Refunded' && (
                                <button className="btn-secondary w-full text-xs">Record Partial Payment</button>
                            )}
                            {sale.status !== 'Refunded' ? (
                                <button 
                                    onClick={() => setRefundModalOpen(true)} 
                                    className="px-6 py-3.5 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 rounded-xl border border-rose-200/50 w-full text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95"
                                >
                                    <RefreshCcw size={14} /> Refund Sale
                                </button>
                            ) : (
                                <div className="p-4 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-2xl border border-rose-100 dark:border-rose-900/30 text-center text-[10px] font-black uppercase tracking-widest">
                                    This Sale Has Been Refunded
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="card p-6 border-l-4 border-emerald-500">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Audit Info</h4>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-xs">
                                <span className="font-bold text-slate-500">Created By</span>
                                <span className="font-black text-slate-900 dark:text-white">{sale.user?.fullName || 'Admin'}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="font-bold text-slate-500">Entry Date</span>
                                <span className="font-black text-slate-900 dark:text-white">{new Date(sale.createdAt).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Refund Modal */}
            {refundModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 p-8 w-full max-w-md shadow-2xl animate-scale-up text-slate-900 dark:text-white">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black tracking-tight flex items-center gap-2">
                                <RefreshCcw size={22} className="text-rose-500" />
                                Refund Sale #{sale.invoiceNumber}
                            </h3>
                            <button onClick={() => setRefundModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="space-y-6">
                            <div className="p-4 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-2xl border border-rose-100 dark:border-rose-900/30 text-xs font-medium leading-relaxed">
                                <span className="font-bold">DIGNIIN:</span> Celintani (Refund) waxay alaabta ku celinaysaa bakhaarka, waxayna jaraysaa lacag dhan <span className="font-black">{Number(sale.paidAmount).toLocaleString()} ETB</span> akoonki aad doorato, sidoo kale waxay baabi'inaysaa xisaab-xidhka transaction-ka iibkaan.
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Dooro Account-ka laga celinayo</label>
                                <select 
                                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-700 dark:text-white focus:ring-4 focus:ring-rose-500/10 outline-none transition-all"
                                    value={selectedAccountId}
                                    onChange={(e) => setSelectedAccountId(e.target.value)}
                                >
                                    {accounts.map((acc: any) => (
                                        <option key={acc.id} value={acc.id}>
                                            {acc.name} (Hadhaaga: {Number(acc.balance).toLocaleString()} ETB)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button 
                                    onClick={() => setRefundModalOpen(false)} 
                                    className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                                    disabled={refundLoading}
                                >
                                    Hajiin
                                </button>
                                <button 
                                    onClick={handleRefund} 
                                    className="flex-1 py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-rose-600/20 transition-all flex items-center justify-center gap-2"
                                    disabled={refundLoading}
                                >
                                    {refundLoading ? (
                                        <Loader2 size={16} className="animate-spin" />
                                    ) : (
                                        <>Confirm Refund</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}
