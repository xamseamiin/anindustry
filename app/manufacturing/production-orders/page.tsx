'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Plus, Search, Factory, Filter, Calendar, FileText, Loader2,
    CheckCircle2, Clock, AlertTriangle, ArrowRight, ArrowLeft,
    TrendingUp, Boxes, Zap, RefreshCcw, MoreVertical, ArrowUpRight
} from 'lucide-react';
import Toast from '@/components/common/Toast';

export default function ProductionOrdersPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/manufacturing/production-orders?search=${searchTerm}`);
            if (res.ok) {
                const data = await res.json();
                setOrders(data.orders || []);
            }
        } catch (e) {
            console.error("Failed to load orders", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timeout = setTimeout(fetchOrders, 300);
        return () => clearTimeout(timeout);
    }, [searchTerm]);

    const stats = {
        total: orders.length,
        completed: orders.filter(o => o.status === 'COMPLETED').length,
        pending: orders.filter(o => o.status === 'PENDING' || o.status === 'IN_PROGRESS').length
    };

    return (
        <div className="flex flex-col gap-8 p-4 lg:p-8 min-h-screen pb-20 bg-slate-50/50">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-4">
                    <Link href="/manufacturing" className="p-3 bg-white rounded-2xl shadow-sm border border-slate-200 text-slate-500 hover:text-blue-600 transition-all hover:scale-105">
                        <ArrowLeft size={24} />
                    </Link>
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <Factory className="text-blue-600" size={36} />
                            Production Terminal
                        </h1>
                        <p className="text-slate-500 font-medium">Monitor batch manufacturing and inventory injection.</p>
                    </div>
                </div>
                <Link 
                    href="/manufacturing/production-orders/add" 
                    className="w-full md:w-auto px-8 py-4 bg-slate-900 text-white rounded-[1.5rem] font-black text-sm shadow-2xl flex items-center justify-center gap-3 hover:bg-slate-800 hover:-translate-y-1 transition-all"
                >
                    <Zap size={20} className="text-blue-400" />
                    New Production Run
                </Link>
            </div>

            {/* Stats Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/60 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white shadow-xl flex items-center gap-6 group hover:scale-[1.02] transition-all">
                    <div className="p-4 bg-blue-500/10 text-blue-600 rounded-2xl group-hover:rotate-12 transition-transform">
                        <Boxes size={32} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Batches</p>
                        <p className="text-3xl font-black text-slate-900 leading-none mt-2">{loading ? '...' : stats.total}</p>
                    </div>
                </div>
                
                <div className="bg-white/60 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white shadow-xl flex items-center gap-6 group hover:scale-[1.02] transition-all">
                    <div className="p-4 bg-emerald-500/10 text-emerald-600 rounded-2xl group-hover:rotate-12 transition-transform">
                        <CheckCircle2 size={32} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Completed Runs</p>
                        <p className="text-3xl font-black text-slate-900 leading-none mt-2">{loading ? '...' : stats.completed}</p>
                    </div>
                </div>

                <div className="bg-blue-600 p-8 rounded-[2.5rem] shadow-2xl flex items-center gap-6 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
                    <div className="p-4 bg-white/20 text-white rounded-2xl">
                        <TrendingUp size={32} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest">Efficiency</p>
                        <p className="text-xl font-black text-white leading-none mt-2 uppercase tracking-tighter">High Output</p>
                    </div>
                </div>
            </div>

            {/* Production List Area */}
            <div className="bg-white/40 backdrop-blur-2xl rounded-[3rem] border border-white shadow-2xl overflow-hidden flex flex-col min-h-[500px]">
                {/* Toolbar */}
                <div className="p-8 border-b border-white flex flex-col md:flex-row gap-6 justify-between items-center bg-white/20">
                    <div className="relative w-full md:max-w-xl">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search by order # or product name..."
                            className="w-full pl-14 pr-6 py-4 bg-white/60 border-none rounded-2xl text-sm font-black text-slate-700 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-slate-400 shadow-inner"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button onClick={fetchOrders} className="p-4 bg-white/60 text-slate-400 hover:text-blue-600 rounded-2xl transition-all shadow-sm hover:shadow-md">
                        <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>

                {/* List */}
                <div className="flex-1 overflow-x-auto p-4">
                    {loading && orders.length === 0 ? (
                        <div className="py-24 flex flex-col items-center justify-center gap-6">
                            <Loader2 size={48} className="animate-spin text-blue-500" />
                            <p className="text-sm font-black text-slate-400 uppercase tracking-widest animate-pulse">Scanning Factory Logs...</p>
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="py-24 flex flex-col items-center justify-center gap-6 text-slate-400">
                            <div className="p-8 bg-slate-100 rounded-full opacity-20"><Factory size={64} /></div>
                            <p className="font-bold text-lg">No production records found.</p>
                            <Link href="/manufacturing/production-orders/add" className="text-blue-600 font-black hover:underline uppercase tracking-widest text-xs">Initialize first production run</Link>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-[10px] uppercase text-slate-400 font-black tracking-[0.2em] border-b border-slate-50 bg-slate-50/30">
                                    <th className="p-6 pl-10">Run # / Date</th>
                                    <th className="p-6">Final SKU</th>
                                    <th className="p-6 text-center">Batch Volume</th>
                                    <th className="p-6">Operational Status</th>
                                    <th className="p-6 text-right pr-10">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50/50">
                                {orders.map((order) => (
                                    <tr key={order.id} className="group hover:bg-blue-50/50 transition-all duration-300">
                                        <td className="p-6 pl-10">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors">#{order.orderNumber}</span>
                                                <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest italic">
                                                    {new Date(order.startDate).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-black shadow-lg group-hover:rotate-6 transition-transform">
                                                    {order.productName?.slice(0, 1)}
                                                </div>
                                                <p className="text-sm font-black text-slate-900">{order.productName}</p>
                                            </div>
                                        </td>
                                        <td className="p-6 text-center">
                                            <div className="inline-flex flex-col items-center p-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                                <span className="text-sm font-black text-slate-900">{order.quantity.toLocaleString()}</span>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Units Produced</span>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                                                order.status === 'COMPLETED' 
                                                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/10' 
                                                : 'bg-blue-500/10 text-blue-600 border-blue-500/10'
                                            }`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="p-6 text-right pr-10">
                                            <Link href={`/manufacturing/production-orders/${order.id}`} className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all group-hover:translate-x-1">
                                                Analysis
                                                <ArrowUpRight size={14} />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="p-6 bg-slate-900 text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] text-center border-t border-white/10">
                    Real-time Production Ledger • AN-Industory Manufacturing
                </div>
            </div>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}
