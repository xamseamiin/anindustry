'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Building, Mail, Phone, MapPin, Briefcase, Calendar,
  Eye, Edit, Trash2, Loader2, Info as InfoIcon, CheckCircle2, 
  Plus, ShoppingCart, Package, Printer, Wallet, Activity,
  ArrowUpRight, ArrowDownRight, TrendingUp, Clock, User as UserIcon
} from 'lucide-react';
import Toast from '@/components/common/Toast';

export default function VendorDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [vendor, setVendor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchVendorDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/manufacturing/vendors/${id}`);
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setVendor(data.vendor);
    } catch (error) {
      setToast({ message: 'Error loading vendor details', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchVendorDetails();
  }, [id]);

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4">
      <Loader2 size={40} className="animate-spin text-blue-500" />
      <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">Syncing Partner Data...</p>
    </div>
  );

  if (!vendor) return null;

  return (
    <div className="flex flex-col gap-8 p-4 lg:p-8 max-w-[1600px] mx-auto min-h-screen pb-20">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex items-center gap-6">
          <Link href="/manufacturing/vendors" className="p-3 bg-white rounded-2xl shadow-sm border border-slate-200 text-slate-500 hover:text-blue-600 transition-all">
            <ArrowLeft size={24} />
          </Link>
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-3xl font-black shadow-xl">
              {vendor.name.slice(0, 1)}
            </div>
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">{vendor.name}</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="px-3 py-1 rounded-lg bg-blue-500/10 text-blue-600 text-[10px] font-black uppercase tracking-widest border border-blue-500/10">
                  {vendor.type || 'Supplier'}
                </span>
                <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                  <Clock size={12} /> Joined {new Date(vendor.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <Link href={`/manufacturing/vendors/edit/${vendor.id}`} className="flex-1 lg:flex-none px-6 py-3 bg-white border border-slate-200 text-slate-900 rounded-xl font-black text-xs uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
            <Edit size={16} /> Edit Profile
          </Link>
          <button className="flex-1 lg:flex-none px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
            <ShoppingCart size={16} /> New Purchase
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Purchases', value: `ETB ${Number(vendor.summary?.totalPurchases || 0).toLocaleString()}`, icon: <ShoppingCart size={20} />, color: 'blue' },
          { label: 'Total Paid', value: `ETB ${Number(vendor.summary?.totalPaid || 0).toLocaleString()}`, icon: <CheckCircle2 size={20} />, color: 'emerald' },
          { label: 'Outstanding Balance', value: `ETB ${Number(vendor.summary?.totalUnpaid || 0).toLocaleString()}`, icon: <Wallet size={20} />, color: 'rose' },
          { label: 'Net Standing', value: `Balanced`, icon: <Activity size={20} />, color: 'amber' },
        ].map((stat, i) => (
          <div key={i} className="bg-white/60 backdrop-blur-xl p-6 rounded-[2rem] border border-white shadow-xl group hover:scale-[1.02] transition-all duration-300">
            <div className={`w-12 h-12 rounded-xl bg-${stat.color}-500/10 text-${stat.color}-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              {stat.icon}
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <p className="text-xl font-black text-slate-900 tracking-tight">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Main Content Terminal */}
      <div className="bg-white/40 backdrop-blur-3xl rounded-[3rem] border border-white/50 shadow-2xl overflow-hidden flex flex-col min-h-[600px]">
        {/* Tabs */}
        <div className="px-8 border-b border-white/40 bg-white/20">
          <div className="flex gap-10">
            {['Overview', 'Transactions', 'Material Log'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-6 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative ${activeTab === tab ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {tab}
                {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full shadow-lg shadow-blue-600/50" />}
              </button>
            ))}
          </div>
        </div>

        <div className="p-8">
          {activeTab === 'Overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-fade-in">
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                    Business Profile
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      { label: 'Contact Person', value: vendor.contactPerson || 'N/A', icon: <UserIcon size={16} /> },
                      { label: 'Primary Phone', value: vendor.phone || 'N/A', icon: <Phone size={16} /> },
                      { label: 'Email Address', value: vendor.email || 'N/A', icon: <Mail size={16} /> },
                      { label: 'Location / City', value: vendor.address || 'N/A', icon: <MapPin size={16} /> },
                    ].map((item, i) => (
                      <div key={i} className="p-5 bg-white/60 rounded-2xl border border-white shadow-sm group hover:bg-blue-50/50 transition-all">
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                          <span className="text-blue-500">{item.icon}</span> {item.label}
                        </div>
                        <p className="text-sm font-black text-slate-900">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform duration-700">
                    <InfoIcon size={120} />
                  </div>
                  <h3 className="text-xl font-black mb-4 relative z-10">Internal Logistics Note</h3>
                  <p className="text-slate-400 text-sm font-bold leading-relaxed relative z-10">
                    {vendor.notes || 'No internal briefing documented for this partner.'}
                  </p>
                </div>
              </div>

              <div className="bg-white/60 rounded-[3rem] border border-white p-8 shadow-xl">
                <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-emerald-600 rounded-full" />
                  Portfolio Summary
                </h3>
                <div className="space-y-6">
                  <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">Products / Services Provided</p>
                    <p className="text-sm font-black text-slate-900 leading-relaxed">
                      {vendor.productsServices || 'Global Supplier'}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Last Purchase</p>
                      <p className="text-sm font-black text-slate-900">May 12, 2026</p>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Credit Score</p>
                      <p className="text-sm font-black text-emerald-600">Premium A+</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Transactions' && (
            <div className="animate-fade-in overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[10px] uppercase text-slate-400 font-black tracking-[0.2em] border-b border-white/40">
                    <th className="p-6">Trans ID</th>
                    <th className="p-6">Description</th>
                    <th className="p-6 text-center">Type</th>
                    <th className="p-6 text-right">Amount (ETB)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/20">
                  {vendor.transactions?.map((t: any) => (
                    <tr key={t.id} className="group hover:bg-white/40 transition-all">
                      <td className="p-6 text-xs font-black text-blue-600 font-mono tracking-tighter">#{t.id.slice(0, 8).toUpperCase()}</td>
                      <td className="p-6 text-sm font-black text-slate-900">{t.description}</td>
                      <td className="p-6 text-center">
                        <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${t.type === 'EXPENSE' ? 'bg-rose-500/10 text-rose-600' : 'bg-emerald-500/10 text-emerald-600'}`}>
                          {t.type}
                        </span>
                      </td>
                      <td className="p-6 text-right font-black text-slate-900">
                        {Number(t.amount).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
