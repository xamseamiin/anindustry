'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus, Search, ShoppingCart, Calendar, FileText, Loader2, Wallet,
  ArrowLeft, TrendingUp, Package, BadgeDollarSign, RefreshCcw,
  CreditCard, X, Eye, AlertTriangle, CheckCircle, Info, Edit, ChevronDown, ChevronUp, Trash2
} from 'lucide-react';
import Toast from '@/components/common/Toast';

export default function MaterialPurchasesPage() {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

  // Payment Modal
  const [payModal, setPayModal] = useState<any>(null); // the grouped transaction to pay
  const [payAmount, setPayAmount] = useState('');
  const [payAccountId, setPayAccountId] = useState('');
  const [paying, setPaying] = useState(false);

  // Delete Modal
  const [deleteModal, setDeleteModal] = useState<any>(null);
  const [refundAccountId, setRefundAccountId] = useState('');
  const [deleting, setDeleting] = useState(false);

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/manufacturing/material-purchases?search=${searchTerm}`);
      if (res.ok) {
        const data = await res.json();
        setPurchases(data.purchases || []);
      }
    } catch (e) {
      console.error("Failed to load purchases", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/manufacturing/accounting/accounts');
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts || []);
        if (data.accounts?.length > 0) setPayAccountId(data.accounts[0].id);
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(fetchPurchases, 300);
    return () => clearTimeout(timeout);
  }, [searchTerm]);

  const totalSpent = purchases.reduce((acc, p) => acc + (p.totalPrice || 0), 0);
  const totalPaid = purchases.reduce((acc, p) => acc + (p.paidAmount || 0), 0);
  const totalDebt = totalSpent - totalPaid;

  // Group purchases logically into transactions
  const groupedPurchases = React.useMemo(() => {
    const groups: { [key: string]: any } = {};
    purchases.forEach(p => {
        const dateStr = new Date(p.purchaseDate).toISOString().split('T')[0];
        const key = p.invoiceNumber ? p.invoiceNumber : `D${dateStr}-V${p.vendorId}`;
        
        if (!groups[key]) {
            groups[key] = {
                id: key, 
                purchaseDate: p.purchaseDate,
                vendor: p.vendor,
                invoiceNumber: p.invoiceNumber,
                items: [],
                totalPrice: 0,
                paidAmount: 0
            };
        }
        groups[key].items.push(p);
        groups[key].totalPrice += (p.totalPrice || 0);
        groups[key].paidAmount += (p.paidAmount || 0);
    });

    return Object.values(groups).sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());
  }, [purchases]);

  const toggleExpand = (id: string) => {
      setExpandedGroups(prev => 
          prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
      );
  };

  const handlePay = async () => {
    if (!payModal || !payAmount || !payAccountId) return;
    setPaying(true);
    try {
      const res = await fetch(`/api/manufacturing/material-purchases/bulk-pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            purchaseIds: payModal.items.map((i: any) => i.id), 
            amount: parseFloat(payAmount), 
            accountId: payAccountId 
        })
      });
      
      if (res.ok) {
        setToast({ message: 'Lacagta waa la bixiyay!', type: 'success' });
        setPayModal(null);
        setPayAmount('');
        fetchPurchases();
      } else {
        const err = await res.json();
        setToast({ message: err.message || 'Cilad ayaa dhacday', type: 'error' });
      }
    } catch (e) {
      setToast({ message: 'Cilad ayaa dhacday', type: 'error' });
    } finally {
      setPaying(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    if ((deleteModal.paidAmount || 0) > 0 && !refundAccountId) {
        setToast({ message: 'Fadlan dooro koontada lacagta lagu celinayo', type: 'error' });
        return;
    }
    
    setDeleting(true);
    try {
      const res = await fetch(`/api/manufacturing/material-purchases/bulk-delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            purchaseIds: deleteModal.items.map((i: any) => i.id), 
            refundAccountId: refundAccountId 
        })
      });
      
      if (res.ok) {
        setToast({ message: 'Dalabkii waa la tirtiray, kaydkii iyo lacagtiina waa la celiyay!', type: 'success' });
        setDeleteModal(null);
        fetchPurchases();
      } else {
        const err = await res.json();
        setToast({ message: err.message || 'Cilad ayaa dhacday', type: 'error' });
      }
    } catch (e) {
      setToast({ message: 'Cilad ayaa dhacday', type: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 p-4 lg:p-8 min-h-screen pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <Link href="/manufacturing" className="p-3 bg-white rounded-xl shadow-sm border border-slate-200 text-slate-500 hover:text-sky-600 transition-all hover:scale-105 active:scale-95">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <ShoppingCart className="text-sky-600" size={36} />
              Raw Material Procurement
            </h1>
            <p className="text-slate-500 font-medium">Iibsashada iyo raadraacidda qalabka warshadaha.</p>
          </div>
        </div>
        <div className="flex w-full md:w-auto gap-3 flex-col sm:flex-row">
          <Link 
              href="/manufacturing/material-purchases/edit" 
              className="w-full md:w-auto px-6 py-4 bg-white text-amber-600 border border-amber-200 rounded-xl font-black text-sm shadow-sm flex items-center justify-center gap-2 hover:shadow-md hover:bg-amber-50 hover:-translate-y-0.5 transition-all active:scale-95"
          >
            <Edit size={18} />
            Edit Landed Costs
          </Link>
          <Link 
              href="/manufacturing/material-purchases/add" 
              className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-emerald-600 to-sky-600 text-white rounded-xl font-black text-sm shadow-lg shadow-sky-600/20 flex items-center justify-center gap-3 hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95"
          >
            <Plus size={20} />
            Record New Purchase
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white/70 backdrop-blur-xl p-6 rounded-2xl border border-emerald-100 shadow-sm flex items-center gap-5 group hover:shadow-md transition-all">
          <div className="p-3.5 bg-emerald-500/10 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform">
            <BadgeDollarSign size={28} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Investment</p>
            <p className="text-2xl font-black text-slate-900 leading-none mt-1.5">
              {loading ? '...' : totalSpent.toLocaleString()} <span className="text-xs text-slate-400 font-bold">ETB</span>
            </p>
          </div>
        </div>
        
        <div className="bg-white/70 backdrop-blur-xl p-6 rounded-2xl border border-sky-100 shadow-sm flex items-center gap-5 group hover:shadow-md transition-all">
          <div className="p-3.5 bg-sky-500/10 text-sky-600 rounded-xl group-hover:scale-110 transition-transform">
            <CheckCircle size={28} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">La Bixiyay (Paid)</p>
            <p className="text-2xl font-black text-emerald-600 leading-none mt-1.5">
              {loading ? '...' : totalPaid.toLocaleString()} <span className="text-xs text-slate-400 font-bold">ETB</span>
            </p>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-xl p-6 rounded-2xl border border-rose-100 shadow-sm flex items-center gap-5 group hover:shadow-md transition-all">
          <div className="p-3.5 bg-rose-500/10 text-rose-600 rounded-xl group-hover:scale-110 transition-transform">
            <AlertTriangle size={28} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dayn (Debt)</p>
            <p className="text-2xl font-black text-rose-600 leading-none mt-1.5">
              {loading ? '...' : totalDebt.toLocaleString()} <span className="text-xs text-slate-400 font-bold">ETB</span>
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl shadow-lg flex items-center gap-5 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-24 h-24 bg-sky-500/10 rounded-full blur-2xl" />
          <div className="p-3.5 bg-white/10 text-sky-400 rounded-xl">
            <Package size={28} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Transactions</p>
            <p className="text-2xl font-black text-white leading-none mt-1.5">{loading ? '...' : groupedPurchases.length}</p>
          </div>
        </div>
      </div>

      {/* Main Table Area */}
      <div className="bg-white/50 backdrop-blur-2xl rounded-2xl border border-slate-200/50 shadow-lg overflow-hidden flex flex-col min-h-[500px]">
        {/* Toolbar */}
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center bg-white/60">
          <div className="relative w-full md:max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Ka raadi magaca ama purchase-ka..."
              className="w-full pl-12 pr-6 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500/40 outline-none transition-all placeholder:text-slate-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button onClick={fetchPurchases} className="p-3.5 bg-slate-50 border border-slate-200 text-slate-400 hover:text-sky-600 rounded-xl transition-all hover:shadow-sm">
            <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-x-auto">
          {loading && groupedPurchases.length === 0 ? (
            <div className="py-24 flex flex-col items-center justify-center gap-6">
              <Loader2 size={48} className="animate-spin text-sky-500" />
              <p className="text-sm font-black text-slate-400 uppercase tracking-widest animate-pulse">Scanning Procurement Logs...</p>
            </div>
          ) : groupedPurchases.length === 0 ? (
            <div className="py-24 flex flex-col items-center justify-center gap-6 text-slate-400">
              <div className="p-8 bg-slate-100 rounded-2xl opacity-20"><ShoppingCart size={64} /></div>
              <p className="font-bold text-lg">No procurement records found.</p>
              <Link href="/manufacturing/material-purchases/add" className="text-sky-600 font-black hover:underline uppercase tracking-widest text-xs">Record first material batch</Link>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[10px] uppercase text-slate-400 font-black tracking-[0.15em] border-b border-slate-100 bg-slate-50/50">
                  <th className="p-5 pl-8 w-12"></th>
                  <th className="p-5">Taariikhda</th>
                  <th className="p-5">Transaction / Materials</th>
                  <th className="p-5">Alaab-keenaha</th>
                  <th className="p-5 text-center">Xaalad</th>
                  <th className="p-5 text-right">Lacagaha</th>
                  <th className="p-5 text-center pr-8">Tallaabo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {groupedPurchases.map((g) => {
                  const debt = (g.totalPrice || 0) - (g.paidAmount || 0);
                  const isPaid = debt <= 0;
                  const isPartial = g.paidAmount > 0 && debt > 0;
                  const paymentStatus = isPaid ? 'PAID' : isPartial ? 'PARTIAL' : 'UNPAID';
                  const isExpanded = expandedGroups.includes(g.id);

                  return (
                    <React.Fragment key={g.id}>
                        {/* Parent Group Row */}
                        <tr className={`group hover:bg-sky-50/40 transition-all duration-200 ${isExpanded ? 'bg-sky-50/20' : ''}`}>
                            <td className="p-5 pl-8 cursor-pointer" onClick={() => toggleExpand(g.id)}>
                                <div className="p-1.5 bg-slate-100 text-slate-400 rounded-md hover:bg-sky-100 hover:text-sky-600 transition-colors">
                                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </div>
                            </td>
                            <td className="p-5 cursor-pointer" onClick={() => toggleExpand(g.id)}>
                                <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-100 rounded-lg text-slate-400">
                                    <Calendar size={14} />
                                </div>
                                <span className="text-xs font-black text-slate-800">
                                    {new Date(g.purchaseDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                                </span>
                                </div>
                            </td>
                            <td className="p-5 cursor-pointer" onClick={() => toggleExpand(g.id)}>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-600 shadow-sm border border-white">
                                        <Package size={18} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-slate-900">
                                            {g.invoiceNumber ? `Invoice: ${g.invoiceNumber}` : 'Batch Transaction'}
                                        </p>
                                        <p className="text-[10px] font-bold text-slate-500">
                                            {g.items.length} Alaabood
                                        </p>
                                    </div>
                                </div>
                            </td>
                            <td className="p-5">
                                <span className="text-xs font-bold text-slate-700">{g.vendor?.name || 'Local Market'}</span>
                            </td>
                            <td className="p-5 text-center">
                                <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                                    paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-700' :
                                    paymentStatus === 'PARTIAL' ? 'bg-amber-100 text-amber-700' :
                                    'bg-rose-100 text-rose-700'
                                }`}>
                                    {paymentStatus === 'PAID' ? 'La Bixiyay' : paymentStatus === 'PARTIAL' ? 'Qayb' : 'La Ma Bixin'}
                                </span>
                            </td>
                            <td className="p-5 text-right">
                                <div className="flex flex-col items-end gap-0.5">
                                    <p className="text-sm font-black text-slate-900">{g.totalPrice?.toLocaleString()} <span className="text-[10px] text-slate-400">ETB</span></p>
                                    {(g.paidAmount || 0) > 0 && <p className="text-[10px] font-black text-emerald-600">✓ Paid: {g.paidAmount?.toLocaleString()}</p>}
                                    {debt > 0 && <p className="text-[10px] font-black text-rose-500">↻ Debt: {debt.toLocaleString()}</p>}
                                </div>
                            </td>
                            <td className="p-5 text-center pr-8">
                                <div className="flex items-center justify-center gap-2">
                                <button 
                                    onClick={() => toggleExpand(g.id)}
                                    className="p-2 bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-lg transition-colors"
                                    title="View Items"
                                >
                                    <Eye size={16} />
                                </button>
                                <Link 
                                    href={`/manufacturing/material-purchases/edit?search=${g.invoiceNumber || g.items[0]?.id}`}
                                    className="p-2 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors"
                                    title="Edit Costs for this Batch"
                                >
                                    <Edit size={16} />
                                </Link>
                                {debt > 0 && (
                                    <button
                                    onClick={() => {
                                        setPayModal(g);
                                        setPayAmount(String(debt));
                                    }}
                                    className="px-3 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors flex items-center gap-1.5"
                                    >
                                    <Wallet size={14} /> Bixi
                                    </button>
                                )}
                                <button
                                    onClick={() => setDeleteModal(g)}
                                    className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors"
                                    title="Tirtir (Delete)"
                                >
                                    <Trash2 size={16} />
                                </button>
                                </div>
                            </td>
                        </tr>

                        {/* Expanded Items Rows */}
                        {isExpanded && g.items.map((p: any, idx: number) => (
                            <tr key={p.id} className="bg-slate-50/50 border-t border-slate-100/50">
                                <td></td>
                                <td></td>
                                <td className="p-3 pl-12" colSpan={2}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-emerald-500 to-sky-500 flex items-center justify-center text-white text-[9px] font-black shadow-sm">
                                            {p.materialName.slice(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-slate-800">{p.materialName}</p>
                                            <p className="text-[9px] font-bold text-slate-500">{p.quantity} {p.unit} @ {p.unitPrice?.toFixed(1)} ETB</p>
                                        </div>
                                    </div>
                                </td>
                                <td></td>
                                <td className="p-3 text-right">
                                    <p className="text-xs font-black text-slate-600">{p.totalPrice?.toLocaleString()} ETB</p>
                                    {((p.transportCost || 0) + (p.taxAmount || 0) + (p.otherCosts || 0)) > 0 && (
                                        <p className="text-[8px] font-bold text-amber-600">+Land: {((p.transportCost || 0) + (p.taxAmount || 0) + (p.otherCosts || 0)).toLocaleString()}</p>
                                    )}
                                </td>
                                <td className="p-3 text-center pr-8">
                                    <Link href={`/manufacturing/material-purchases/${p.id}`} className="text-[9px] font-black text-sky-600 hover:underline uppercase tracking-wider">
                                        Details →
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 bg-gradient-to-r from-slate-800 to-slate-900 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] text-center">
            AN-Industory • Automated Procurement Audit Trail
        </div>
      </div>

      {/* Payment Modal */}
      {payModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-8 shadow-2xl relative border border-slate-200">
            <button onClick={() => setPayModal(null)} className="absolute right-4 top-4 p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors">
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
              <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl">
                <CreditCard size={24} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Bixi Lacagta (Pay)</h3>
                <p className="text-slate-500 font-bold text-xs mt-1">
                    {payModal.invoiceNumber ? `Invoice: ${payModal.invoiceNumber}` : `${payModal.items.length} Alaabood - ${payModal.vendor?.name}`}
                </p>
              </div>
            </div>

            {/* Payment Info */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="p-3 bg-slate-50 rounded-xl text-center">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Total</p>
                <p className="text-sm font-black text-slate-900 mt-1">{payModal.totalPrice?.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl text-center">
                <p className="text-[9px] font-black text-emerald-500 uppercase tracking-wider">Paid</p>
                <p className="text-sm font-black text-emerald-700 mt-1">{(payModal.paidAmount || 0).toLocaleString()}</p>
              </div>
              <div className="p-3 bg-rose-50 rounded-xl text-center">
                <p className="text-[9px] font-black text-rose-500 uppercase tracking-wider">Debt</p>
                <p className="text-sm font-black text-rose-700 mt-1">{((payModal.totalPrice || 0) - (payModal.paidAmount || 0)).toLocaleString()}</p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-2">Qadarka Lacagta (Amount)</label>
                <input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-slate-200 bg-slate-50 rounded-xl text-sm font-black text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white transition-all"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-2">Koontada (Account)</label>
                <select
                  value={payAccountId}
                  onChange={(e) => setPayAccountId(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-slate-200 bg-slate-50 rounded-xl text-sm font-black text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white transition-all"
                >
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.balance?.toLocaleString()} ETB)</option>)}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPayModal(null)}
                className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-600 transition-colors"
              >
                Ka noqo
              </button>
              <button
                onClick={handlePay}
                disabled={paying || !payAmount || parseFloat(payAmount) <= 0}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-sky-600 hover:from-emerald-500 hover:to-sky-500 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-2 disabled:opacity-50 shadow-lg transition-all active:scale-95"
              >
                {paying ? <Loader2 className="animate-spin" size={16} /> : <Wallet size={16} />}
                {paying ? 'Kaydinaya...' : 'Bixi Lacagta'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-8 shadow-2xl relative border border-slate-200">
            <button onClick={() => setDeleteModal(null)} className="absolute right-4 top-4 p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors">
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
              <div className="p-3 bg-rose-500/10 text-rose-600 rounded-xl">
                <Trash2 size={24} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Tirtir Dalabkan (Rollback)</h3>
                <p className="text-slate-500 font-bold text-xs mt-1">
                    {deleteModal.invoiceNumber ? `Invoice: ${deleteModal.invoiceNumber}` : `${deleteModal.items.length} Alaabood - ${deleteModal.vendor?.name}`}
                </p>
              </div>
            </div>

            <div className="mb-6 p-4 bg-rose-50 rounded-xl border border-rose-100 text-rose-800 text-xs font-bold space-y-2">
                <p>⚠️ <strong>Digniin:</strong> Tallaabadan dib looma celin karo. Waxay samayn doontaa:</p>
                <ul className="list-disc pl-5 space-y-1">
                    <li>Waxay dib uga jari doontaa kaydka (Inventory) alaabihii lasoo iibiyay.</li>
                    <li>Waxay baabi'in doontaa deynta lagugu lahaa iibsigaan.</li>
                    {(deleteModal.paidAmount || 0) > 0 && (
                        <li>Waxay dib ugu soo celin doontaa koontadaada lacagtii aad bixisay oo ah <strong>{(deleteModal.paidAmount || 0).toLocaleString()} ETB</strong>.</li>
                    )}
                </ul>
            </div>

            {(deleteModal.paidAmount || 0) > 0 && (
                <div className="mb-6">
                    <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-2">Ku Celi Lacagta Koontada (Refund Account)</label>
                    <select
                        value={refundAccountId}
                        onChange={(e) => setRefundAccountId(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-slate-200 bg-slate-50 rounded-xl text-sm font-black text-slate-900 focus:outline-none focus:border-rose-500 focus:bg-white transition-all"
                    >
                        <option value="">-- Dooro Koonto --</option>
                        {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.balance?.toLocaleString()} ETB)</option>)}
                    </select>
                </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteModal(null)}
                className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-600 transition-colors"
              >
                Ka noqo
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting || ((deleteModal.paidAmount || 0) > 0 && !refundAccountId)}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-2 disabled:opacity-50 shadow-lg transition-all active:scale-95"
              >
                {deleting ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                {deleting ? 'Tirtiraya...' : 'Haa, Tirtir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
