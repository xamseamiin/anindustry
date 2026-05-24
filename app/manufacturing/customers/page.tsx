'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Plus, Search, Users, MapPin, Phone, Mail, MoreVertical, Loader2, RefreshCcw, 
    Briefcase, Building, ArrowLeft, LayoutGrid, List, AlertCircle, ArrowUpRight
} from 'lucide-react';
import Toast from '@/components/common/Toast';

export default function FactoryCustomersPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [customers, setCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/manufacturing/customers?search=${searchTerm}`);
            if (res.ok) {
                const data = await res.json();
                setCustomers(data.customers || []);
            }
        } catch (e) {
            console.error("Failed to load customers", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timeout = setTimeout(fetchCustomers, 300);
        return () => clearTimeout(timeout);
    }, [searchTerm]);

    return (
        <div className="flex flex-col gap-6 p-4 lg:p-6 min-h-screen pb-20 bg-slate-50/50">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/manufacturing" className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-200 text-slate-500 hover:text-blue-600 transition-all">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <Users className="text-blue-600" size={32} />
                            Customer Hub
                        </h1>
                        <p className="text-sm text-slate-500 font-medium">Manage manufacturing clients and B2B partners.</p>
                    </div>
                </div>
                <Link 
                    href="/manufacturing/customers/add"
                    className="w-full md:w-auto px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm shadow-lg flex items-center justify-center gap-2 hover:bg-slate-800 transition-all"
                >
                    <Plus size={18} />
                    Add New Customer
                </Link>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-white/60 backdrop-blur-xl p-6 rounded-3xl border border-white shadow-xl flex items-center gap-5">
                    <div className="p-4 bg-blue-500/10 text-blue-600 rounded-2xl">
                        <Users size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Clients</p>
                        <p className="text-2xl font-black text-slate-900 leading-none mt-1">{loading ? '...' : customers.length}</p>
                    </div>
                </div>
                <div className="bg-white/60 backdrop-blur-xl p-6 rounded-3xl border border-white shadow-xl flex items-center gap-5">
                    <div className="p-4 bg-emerald-500/10 text-emerald-600 rounded-2xl">
                        <Briefcase size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Orders</p>
                        <p className="text-2xl font-black text-slate-900 leading-none mt-1">
                            {loading ? '...' : customers.reduce((acc, c) => acc + (c._count?.productionOrders || 0), 0)}
                        </p>
                    </div>
                </div>
                <div className="bg-white/60 backdrop-blur-xl p-6 rounded-3xl border border-white shadow-xl flex items-center gap-5">
                    <div className="p-4 bg-amber-500/10 text-amber-600 rounded-2xl">
                        <Building size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Corporate Partners</p>
                        <p className="text-2xl font-black text-slate-900 leading-none mt-1">
                            {loading ? '...' : customers.filter(c => c.companyName).length}
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="bg-white/40 backdrop-blur-2xl rounded-[2.5rem] border border-white/40 shadow-2xl overflow-hidden flex flex-col min-h-[500px]">
                {/* Toolbar */}
                <div className="p-6 border-b border-white/40 flex flex-col md:flex-row gap-4 justify-between items-center bg-white/20">
                    <div className="relative w-full md:max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search clients by name, company..."
                            className="w-full pl-12 pr-4 py-3 bg-white/60 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all placeholder:text-slate-400"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={fetchCustomers} className="p-2.5 bg-white/60 text-slate-400 hover:text-blue-600 rounded-xl transition-all">
                            <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
                        </button>
                        <div className="w-px h-6 bg-slate-200 mx-2" />
                        <button 
                            onClick={() => setViewMode('list')}
                            className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white/60 text-slate-400 hover:text-slate-600'}`}
                        >
                            <List size={18} />
                        </button>
                        <button 
                            onClick={() => setViewMode('grid')}
                            className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white/60 text-slate-400 hover:text-slate-600'}`}
                        >
                            <LayoutGrid size={18} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-6">
                    {loading && customers.length === 0 ? (
                        <div className="p-20 flex flex-col items-center justify-center gap-4">
                            <Loader2 size={40} className="animate-spin text-blue-500" />
                            <p className="text-sm font-black text-slate-400 uppercase tracking-widest animate-pulse">Syncing Customer Database...</p>
                        </div>
                    ) : customers.length === 0 ? (
                        <div className="p-20 flex flex-col items-center justify-center gap-4 text-slate-400">
                            <AlertCircle size={48} className="opacity-20" />
                            <p className="font-bold">No customers found.</p>
                            <Link href="/manufacturing/customers/add" className="text-blue-600 font-bold hover:underline">Register your first client</Link>
                        </div>
                    ) : viewMode === 'list' ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="text-[10px] uppercase text-slate-400 font-black tracking-[0.2em] border-b border-slate-100 bg-slate-50/30">
                                        <th className="p-6 pl-10">Client / Company</th>
                                        <th className="p-6">Contact Info</th>
                                        <th className="p-6 text-center">Engagement</th>
                                        <th className="p-6 text-right pr-10">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {customers.map((c) => (
                                        <tr key={c.id} className="group hover:bg-blue-50/50 transition-all duration-300">
                                            <td className="p-6 pl-10">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-lg group-hover:scale-110 transition-transform">
                                                        {c.name.slice(0, 1)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-slate-900 leading-none">{c.name}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 mt-2 flex items-center gap-1 uppercase tracking-widest italic">
                                                            {c.companyName || 'Private Individual'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                                        <Phone size={12} className="text-blue-500" />
                                                        {c.phone || 'No Phone'}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                                                        <MapPin size={12} className="text-slate-300" />
                                                        {c.address || 'Address Not Set'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-6 text-center">
                                                <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                                    {c._count?.productionOrders || 0} Production Orders
                                                </span>
                                            </td>
                                            <td className="p-6 text-right pr-10">
                                                <Link href={`/manufacturing/customers/${c.id}`} className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm border border-slate-200 text-slate-600 font-bold text-[10px] uppercase tracking-widest hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all group-hover:translate-x-1">
                                                    View Details
                                                    <ArrowUpRight size={14} />
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {customers.map((c) => (
                                <div key={c.id} className="bg-white/60 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white shadow-xl hover:shadow-2xl transition-all group relative overflow-hidden">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-2xl shadow-xl group-hover:rotate-6 transition-all">
                                            {c.name.slice(0, 1)}
                                        </div>
                                        <Link href={`/manufacturing/customers/${c.id}`} className="p-2.5 bg-slate-50 rounded-xl text-slate-400 hover:text-blue-600 transition-all">
                                            <ArrowUpRight size={20} />
                                        </Link>
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 leading-tight mb-1">{c.name}</h3>
                                    <p className="text-xs font-bold text-slate-400 mb-6">{c.companyName || 'Individual Partner'}</p>
                                    <div className="space-y-4 pt-4 border-t border-slate-50">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-slate-100 rounded-lg text-slate-400"><Phone size={14} /></div>
                                            <span className="text-xs font-black text-slate-700">{c.phone || 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-slate-100 rounded-lg text-slate-400"><Briefcase size={14} /></div>
                                            <span className="text-xs font-bold text-slate-500">{c._count?.productionOrders || 0} Orders in pipeline</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}
