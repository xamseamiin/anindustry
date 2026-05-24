'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Package, Calendar, FileText, Truck, Wallet, CreditCard,
  Loader2, AlertCircle, CheckCircle, X, Plus, DollarSign, Clock, Info
} from 'lucide-react';
import Toast from '@/components/common/Toast';

// --- Interfaces ---
interface Purchase {
  id: string;
  materialName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  paidAmount: number;
  paymentStatus: string;
  vendorId: string;
  purchaseDate: string;
  invoiceNumber?: string;
  notes?: string;
  productionOrderId?: string;
  createdAt: string;
  updatedAt: string;
  vendor?: {
    id: string;
    name: string;
    contactPerson?: string;
    phone?: string;
    email?: string;
  };
  productionOrder?: {
    id: string;
    orderNumber: string;
    productName: string;
    status: string;
  };
}

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
}

export default function MaterialPurchaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [paying, setPaying] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const fetchPurchase = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/manufacturing/material-purchases/${params.id}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setPurchase(data.purchase);
    } catch {
      setToast({ message: 'Khalad: Ma helin macluumaadka iibsiga', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetch('/api/manufacturing/accounting/accounts');
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts || []);
      }
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    if (params.id) {
      fetchPurchase();
      fetchAccounts();
    }
  }, [params.id, fetchPurchase, fetchAccounts]);

  const handlePayment = async () => {
    const amount = parseFloat(payAmount);
    if (isNaN(amount) || amount <= 0) {
      setToast({ message: 'Fadlan geli lacag sax ah', type: 'error' });
      return;
    }
    if (!selectedAccountId) {
      setToast({ message: 'Fadlan dooro koonto', type: 'error' });
      return;
    }

    try {
      setPaying(true);
      const res = await fetch(`/api/manufacturing/material-purchases/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, accountId: selectedAccountId })
      });
      const data = await res.json();

      if (res.ok) {
        setToast({ message: data.message || 'Lacag bixinta waa la diiwaangeliyay!', type: 'success' });
        setShowPayModal(false);
        setPayAmount('');
        setSelectedAccountId('');
        fetchPurchase();
        fetchAccounts();
      } else {
        setToast({ message: data.message || 'Khalad lacag bixinta', type: 'error' });
      }
    } catch {
      setToast({ message: 'Khalad: Ma xiriiri karin server-ka', type: 'error' });
    } finally {
      setPaying(false);
    }
  };

  // --- Calculations ---
  const totalCost = purchase?.totalPrice || 0;
  const paidAmount = purchase?.paidAmount || 0;
  const remainingDebt = totalCost - paidAmount;
  const paidPercentage = totalCost > 0 ? Math.round((paidAmount / totalCost) * 100) : 0;
  const isPaid = purchase?.paymentStatus === 'PAID';

  // --- Loading State ---
  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4">
      <Loader2 size={40} className="animate-spin text-emerald-500" />
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">
        Waxaa la soo dejinayaa macluumaadka...
      </p>
    </div>
  );

  // --- Not Found ---
  if (!purchase) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4">
      <div className="w-20 h-20 rounded-2xl bg-rose-500/10 flex items-center justify-center">
        <AlertCircle size={40} className="text-rose-500" />
      </div>
      <h2 className="text-2xl font-black text-slate-900 tracking-tight">Iibsiga lama helin</h2>
      <p className="text-sm text-slate-500">The purchase you're looking for doesn't exist or has been deleted.</p>
      <Link
        href="/manufacturing/material-purchases"
        className="mt-4 px-6 py-3 bg-emerald-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center gap-2"
      >
        <ArrowLeft size={16} /> Ku noqo Iibsiyada
      </Link>
    </div>
  );

  return (
    <div className="flex flex-col gap-8 p-4 lg:p-8 max-w-[1600px] mx-auto min-h-screen pb-20">

      {/* ─── Header ─── */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex items-center gap-6">
          <Link
            href="/manufacturing/material-purchases"
            className="p-3 bg-white rounded-2xl shadow-sm border border-slate-200 text-slate-500 hover:text-emerald-600 transition-all"
          >
            <ArrowLeft size={24} />
          </Link>
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-sky-600 flex items-center justify-center text-white text-3xl font-black shadow-xl">
              <Package size={28} />
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
                {purchase.materialName}
              </h1>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                  isPaid
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                    : purchase.paymentStatus === 'PARTIAL'
                    ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                    : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                }`}>
                  {isPaid ? 'La Bixiyay' : purchase.paymentStatus === 'PARTIAL' ? 'Qayb la bixiyay' : 'Aan la bixin'}
                </span>
                <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                  <Clock size={12} /> {new Date(purchase.purchaseDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {!isPaid && (
          <button
            onClick={() => setShowPayModal(true)}
            className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-sky-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-600/20 hover:shadow-2xl hover:shadow-emerald-600/30 transition-all flex items-center gap-3 hover:scale-[1.02]"
          >
            <Wallet size={18} /> Bixi Lacagta
          </button>
        )}
      </div>

      {/* ─── Stats Row ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Cost */}
        <div className="bg-white/60 backdrop-blur-xl p-6 rounded-2xl border border-white shadow-xl group hover:scale-[1.02] transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <DollarSign size={22} />
            </div>
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-lg">
              Wadarta
            </span>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Qiimaha Guud</p>
          <p className="text-2xl font-black text-slate-900 tracking-tight">{totalCost.toLocaleString()} ETB</p>
        </div>

        {/* Paid Amount */}
        <div className="bg-white/60 backdrop-blur-xl p-6 rounded-2xl border border-white shadow-xl group hover:scale-[1.02] transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircle size={22} />
            </div>
            <span className="text-[10px] font-black text-sky-600 uppercase tracking-widest bg-sky-50 px-3 py-1 rounded-lg">
              {paidPercentage}%
            </span>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">La Bixiyay</p>
          <p className="text-2xl font-black text-slate-900 tracking-tight">{paidAmount.toLocaleString()} ETB</p>
        </div>

        {/* Remaining Debt */}
        <div className={`p-6 rounded-2xl border shadow-xl group hover:scale-[1.02] transition-all duration-300 ${
          remainingDebt > 0
            ? 'bg-gradient-to-br from-rose-50 to-orange-50 border-rose-200'
            : 'bg-gradient-to-br from-emerald-50 to-sky-50 border-emerald-200'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${
              remainingDebt > 0 ? 'bg-rose-500/10 text-rose-600' : 'bg-emerald-500/10 text-emerald-600'
            }`}>
              <CreditCard size={22} />
            </div>
            {remainingDebt <= 0 && (
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-100 px-3 py-1 rounded-lg">
                Dhammaystiran
              </span>
            )}
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Deynta Haray</p>
          <p className={`text-2xl font-black tracking-tight ${remainingDebt > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {remainingDebt.toLocaleString()} ETB
          </p>
        </div>
      </div>

      {/* ─── Main Content Grid ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column (2/3) */}
        <div className="lg:col-span-2 space-y-8">

          {/* Material Details Card */}
          <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white shadow-xl overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center gap-3">
              <div className="w-1.5 h-6 bg-emerald-600 rounded-full" />
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Faahfaahin Alaabta</h2>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { label: 'Magaca Alaabta', value: purchase.materialName, icon: <Package size={16} /> },
                  { label: 'Qadarka', value: `${purchase.quantity} ${purchase.unit}`, icon: <Plus size={16} /> },
                  { label: 'Qiimaha Hal', value: `${purchase.unitPrice.toLocaleString()} ETB`, icon: <DollarSign size={16} /> },
                  { label: 'Wadarta Qiimaha', value: `${purchase.totalPrice.toLocaleString()} ETB`, icon: <DollarSign size={16} /> },
                ].map((item, i) => (
                  <div key={i} className="p-5 bg-white/60 rounded-xl border border-white shadow-sm group hover:bg-emerald-50/50 transition-all">
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      <span className="text-emerald-500">{item.icon}</span> {item.label}
                    </div>
                    <p className="text-sm font-black text-slate-900">{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Notes */}
              {purchase.notes && (
                <div className="mt-6 p-6 bg-slate-900 rounded-2xl text-white relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-125 transition-transform duration-700">
                    <Info size={80} />
                  </div>
                  <h3 className="text-sm font-black mb-2 relative z-10 flex items-center gap-2">
                    <FileText size={16} /> Qoraalka / Notes
                  </h3>
                  <p className="text-slate-400 text-sm font-bold leading-relaxed relative z-10">
                    {purchase.notes}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Vendor Info Card */}
          <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white shadow-xl overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center gap-3">
              <div className="w-1.5 h-6 bg-sky-600 rounded-full" />
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Macluumaadka Baayi'aha</h2>
            </div>
            <div className="p-8">
              {purchase.vendor ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { label: 'Magaca Baayi\'aha', value: purchase.vendor.name, icon: <Truck size={16} /> },
                    { label: 'Qofka La Xiriirka', value: purchase.vendor.contactPerson || 'N/A', icon: <Info size={16} /> },
                    { label: 'Telefoonka', value: purchase.vendor.phone || 'N/A', icon: <CreditCard size={16} /> },
                    { label: 'Iimaylka', value: purchase.vendor.email || 'N/A', icon: <FileText size={16} /> },
                  ].map((item, i) => (
                    <div key={i} className="p-5 bg-white/60 rounded-xl border border-white shadow-sm group hover:bg-sky-50/50 transition-all">
                      <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                        <span className="text-sky-500">{item.icon}</span> {item.label}
                      </div>
                      <p className="text-sm font-black text-slate-900">{item.value}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Truck size={32} className="text-slate-300 mx-auto mb-3" />
                  <p className="text-sm text-slate-400 font-bold">Macluumaadka baayi'aha lama helin</p>
                </div>
              )}
            </div>
          </div>

          {/* Production Order (if linked) */}
          {purchase.productionOrder && (
            <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white shadow-xl overflow-hidden">
              <div className="px-8 py-6 border-b border-slate-100 flex items-center gap-3">
                <div className="w-1.5 h-6 bg-amber-500 rounded-full" />
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Dalabka Wax Soo Saarka</h2>
              </div>
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-5 bg-white/60 rounded-xl border border-white shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Lambarka Dalabka</p>
                    <p className="text-sm font-black text-slate-900">{purchase.productionOrder.orderNumber}</p>
                  </div>
                  <div className="p-5 bg-white/60 rounded-xl border border-white shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Magaca Alaabta</p>
                    <p className="text-sm font-black text-slate-900">{purchase.productionOrder.productName}</p>
                  </div>
                  <div className="p-5 bg-white/60 rounded-xl border border-white shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Xaalada</p>
                    <span className={`inline-flex px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                      purchase.productionOrder.status === 'completed'
                        ? 'bg-emerald-500/10 text-emerald-600'
                        : purchase.productionOrder.status === 'in_progress'
                        ? 'bg-sky-500/10 text-sky-600'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {purchase.productionOrder.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column (1/3) */}
        <div className="space-y-8">

          {/* Payment Status Card */}
          <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white shadow-xl overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-emerald-600 to-sky-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-white/70 uppercase tracking-widest">Xaalada Lacag Bixinta</p>
                  <p className="text-2xl font-black text-white tracking-tight mt-1">
                    {isPaid ? 'Dhammaystiran ✓' : `${paidPercentage}% La Bixiyay`}
                  </p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
                  {isPaid ? <CheckCircle size={28} className="text-white" /> : <Wallet size={28} className="text-white" />}
                </div>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Progress Bar */}
              <div>
                <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  <span>Horumarka</span>
                  <span>{paidPercentage}%</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      isPaid ? 'bg-gradient-to-r from-emerald-500 to-sky-500' : 'bg-gradient-to-r from-emerald-500 to-sky-500'
                    }`}
                    style={{ width: `${paidPercentage}%` }}
                  />
                </div>
              </div>

              {/* Payment Breakdown */}
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-xl">
                  <span className="text-xs font-bold text-slate-500">Wadarta</span>
                  <span className="text-sm font-black text-emerald-700">{totalCost.toLocaleString()} ETB</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-sky-50 rounded-xl">
                  <span className="text-xs font-bold text-slate-500">La Bixiyay</span>
                  <span className="text-sm font-black text-sky-700">{paidAmount.toLocaleString()} ETB</span>
                </div>
                <div className={`flex justify-between items-center p-3 rounded-xl ${
                  remainingDebt > 0 ? 'bg-rose-50' : 'bg-emerald-50'
                }`}>
                  <span className="text-xs font-bold text-slate-500">Haray</span>
                  <span className={`text-sm font-black ${remainingDebt > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                    {remainingDebt.toLocaleString()} ETB
                  </span>
                </div>
              </div>

              {/* Pay Button */}
              {!isPaid && (
                <button
                  onClick={() => setShowPayModal(true)}
                  className="w-full py-4 bg-gradient-to-r from-emerald-600 to-sky-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-600/20 hover:shadow-xl hover:shadow-emerald-600/30 transition-all flex items-center justify-center gap-3 hover:scale-[1.02]"
                >
                  <Wallet size={18} /> Bixi Lacagta
                </button>
              )}
            </div>
          </div>

          {/* Invoice & Dates Card */}
          <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white shadow-xl p-6 space-y-5">
            <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-3">
              <div className="w-1.5 h-6 bg-emerald-600 rounded-full" />
              Macluumaad Dheeraad ah
            </h3>

            <div className="space-y-4">
              {purchase.invoiceNumber && (
                <div className="p-4 bg-white/60 rounded-xl border border-white shadow-sm">
                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    <FileText size={14} className="text-emerald-500" /> Lambarka Invoice
                  </div>
                  <p className="text-sm font-black text-slate-900 font-mono">{purchase.invoiceNumber}</p>
                </div>
              )}

              <div className="p-4 bg-white/60 rounded-xl border border-white shadow-sm">
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  <Calendar size={14} className="text-sky-500" /> Taariikhda Iibsiga
                </div>
                <p className="text-sm font-black text-slate-900">
                  {new Date(purchase.purchaseDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>

              <div className="p-4 bg-white/60 rounded-xl border border-white shadow-sm">
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  <Clock size={14} className="text-slate-400" /> La Abuuray
                </div>
                <p className="text-sm font-black text-slate-900">
                  {new Date(purchase.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>

              <div className="p-4 bg-white/60 rounded-xl border border-white shadow-sm">
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  <Clock size={14} className="text-slate-400" /> La Cusbooneysiiyay
                </div>
                <p className="text-sm font-black text-slate-900">
                  {new Date(purchase.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Payment Modal ─── */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setShowPayModal(false)}
          />

          {/* Modal Card */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-emerald-600 to-sky-600 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-white/70 uppercase tracking-widest">Lacag Bixinta</p>
                <h3 className="text-xl font-black text-white tracking-tight mt-1">Bixi Lacagta</h3>
              </div>
              <button
                onClick={() => setShowPayModal(false)}
                className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Remaining Info */}
              <div className="p-4 bg-rose-50 rounded-xl border border-rose-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Deynta Haray</p>
                    <p className="text-2xl font-black text-rose-700 tracking-tight mt-1">
                      {remainingDebt.toLocaleString()} ETB
                    </p>
                  </div>
                  <AlertCircle size={24} className="text-rose-400" />
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
                  Lacagta La Bixinayo (ETB)
                </label>
                <div className="relative">
                  <DollarSign size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="number"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    placeholder={`Max: ${remainingDebt.toLocaleString()}`}
                    max={remainingDebt}
                    min={1}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-lg font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>
                {/* Quick amount buttons */}
                <div className="flex gap-2 mt-3">
                  {[25, 50, 75, 100].map((pct) => {
                    const amt = Math.round(remainingDebt * pct / 100);
                    return (
                      <button
                        key={pct}
                        onClick={() => setPayAmount(String(amt))}
                        className="flex-1 py-2 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-transparent hover:border-emerald-200"
                      >
                        {pct}%
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Account Select */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
                  Koontada Laga Bixinayo
                </label>
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all appearance-none"
                >
                  <option value="">— Dooro Koonto —</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.type}) — {Number(acc.balance).toLocaleString()} ETB
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowPayModal(false)}
                  className="flex-1 py-4 bg-slate-100 text-slate-700 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  Ka noqo
                </button>
                <button
                  onClick={handlePayment}
                  disabled={paying || !payAmount || !selectedAccountId}
                  className="flex-1 py-4 bg-gradient-to-r from-emerald-600 to-sky-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-600/20 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {paying ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Waa la dirayaa...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} /> Xaqiiji Lacagta
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Toast ─── */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
