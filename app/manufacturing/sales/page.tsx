// app/manufacturing/sales/page.tsx - AN-Industory Sales Hub (Glassmorphism Live)
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Plus, Search, Filter, CreditCard, Wallet,
    TrendingUp, TrendingDown, Truck, FileText, Loader2, 
    RefreshCcw, ArrowRight, ChevronRight, Activity, Boxes,
    ClipboardList
} from 'lucide-react';

export default function FactorySalesPage() {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [salesOrders, setSalesOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchSales = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/manufacturing/sales');
            if (res.ok) {
                const data = await res.json();
                setSalesOrders(data.orders || []);
            }
        } catch (e) {
            console.error("Failed to load sales", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSales();
    }, []);

    const activeOrders = salesOrders.filter(order => order.status !== 'Refunded');
    const totalRevenue = activeOrders.reduce((sum, order) => sum + order.total, 0);
    const totalDebt = activeOrders.reduce((sum, order) => sum + (order.total - (order.paidAmount || 0)), 0);
    const filteredOrders = salesOrders.filter(o =>
        o.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="relative min-h-screen">
            {/* Ultra-Premium Dynamic Background Blobs */}
            <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
                <div className="absolute top-[-10%] right-[-5%] w-[45%] h-[45%] bg-emerald-500/10 rounded-full blur-[130px] animate-pulse" />
                <div className="absolute bottom-[-10%] left-[-5%] w-[45%] h-[45%] bg-blue-500/10 rounded-full blur-[130px] animate-pulse" style={{ animationDelay: '3s' }} />
            </div>

            <div className="flex flex-col gap-6 px-8 animate-fade-in max-w-[1700px] mx-auto py-8 relative z-10">
                {/* Header */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                    <div className="flex items-center gap-5">
                        <div className="p-4 bg-white/60 backdrop-blur-xl rounded-2xl shadow-xl border border-white/40 text-emerald-600">
                            <CreditCard size={28} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Link href="/manufacturing" className="text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:underline">Factory Hub</Link>
                                <ChevronRight size={10} className="text-slate-400" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sales Terminal</span>
                            </div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Sales Hub (Iibka)</h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/manufacturing/accounting/bulk" className="px-6 py-3.5 bg-slate-900 text-white hover:bg-slate-800 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-900/10 transition-all flex items-center gap-2 active:scale-95">
                            <ClipboardList size={18} /> Bulk Sales Import
                        </Link>
                        <Link href="/manufacturing/sales/add" className="px-6 py-3.5 bg-emerald-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-600/30 hover:bg-emerald-700 transition-all flex items-center gap-2 active:scale-95">
                            <Plus size={18} /> New Sales Order
                        </Link>
                    </div>
                </div>

                {/* KPI Section with Glassmorphism */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {[
                        { label: 'Total Revenue', value: totalRevenue.toLocaleString(), icon: <Wallet size={22} />, color: 'emerald' },
                        { label: 'Outstanding Debt', value: totalDebt.toLocaleString(), icon: <TrendingDown size={22} />, color: 'rose' },
                        { label: 'Total Orders', value: salesOrders.length, icon: <FileText size={22} />, color: 'blue' }
                    ].map((stat, idx) => (
                        <div key={idx} className="bg-white/40 backdrop-blur-2xl p-7 rounded-2xl border border-white/40 shadow-xl flex items-center gap-6 group hover:border-emerald-500/30 transition-all duration-300">
                            <div className={`p-5 rounded-2xl bg-${stat.color}-500/10 text-${stat.color}-600 group-hover:scale-110 transition-transform duration-300`}>{stat.icon}</div>
                            <div>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                                <p className="text-3xl font-black text-slate-900 tracking-tight">
                                    {stat.value} {typeof stat.value === 'string' && <span className="text-[10px] text-slate-400 font-bold ml-1">ETB</span>}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Main Content (Glassy Table) */}
                <div className="bg-white/30 backdrop-blur-3xl rounded-3xl border border-white/50 shadow-2xl overflow-hidden flex flex-col min-h-[600px] transition-all">
                    <div className="p-6 border-b border-white/20 flex flex-wrap items-center justify-between gap-5 bg-white/20">
                        <div className="relative flex-1 max-w-xl">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input 
                                type="text" 
                                placeholder="Search by Invoice or Customer..." 
                                className="w-full pl-12 pr-6 py-3.5 bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500/40 transition-all shadow-inner" 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button onClick={fetchSales} className="p-3 bg-white/60 backdrop-blur-md border border-white/40 rounded-xl text-slate-600 hover:text-emerald-600 transition-all shadow-sm">
                            <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>

                    <div className="overflow-x-auto flex-1">
                        {loading && salesOrders.length === 0 ? (
                            <div className="h-[400px] flex flex-col items-center justify-center gap-4">
                                <Loader2 className="animate-spin text-emerald-600" size={32} />
                                <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">Syncing Sales Terminal...</p>
                            </div>
                        ) : filteredOrders.length === 0 ? (
                            <div className="h-[400px] flex flex-col items-center justify-center gap-6 opacity-60">
                                <FileText size={64} className="text-slate-300" />
                                <p className="text-xs font-black uppercase tracking-widest text-slate-900">No sales records found</p>
                            </div>
                        ) : (
                            <table className="w-full text-left border-separate border-spacing-0">
                                <thead className="bg-white/10 sticky top-0 z-20 backdrop-blur-md">
                                    <tr className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 border-b border-white/20">
                                        <th className="p-6 pl-10">Invoice ID</th>
                                        <th className="p-6">Customer</th>
                                        <th className="p-6 text-center">Status</th>
                                        <th className="p-6 text-center">Items Sold</th>
                                        <th className="p-6 text-right">Total Amount</th>
                                        <th className="p-6 text-right pr-10">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                    {filteredOrders.map((order) => {
                                        const debt = order.total - (order.paidAmount || 0);
                                        return (
                                            <tr 
                                                key={order.id} 
                                                onClick={() => router.push(`/manufacturing/sales/${order.id}`)}
                                                className="group hover:bg-white/40 transition-all duration-300 cursor-pointer"
                                            >
                                                <td className="p-6 pl-10">
                                                    <span className="text-xs font-black text-emerald-600 font-mono tracking-tighter">#{order.invoiceNumber || order.id.slice(-6).toUpperCase()}</span>
                                                </td>
                                                <td className="p-6">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-black text-slate-900 group-hover:text-emerald-700 transition-colors">{order.customer}</span>
                                                        {debt > 0 && order.status !== 'Refunded' && (
                                                            <span className="text-[9px] font-black bg-rose-500/10 text-rose-600 px-2 py-0.5 rounded uppercase tracking-tighter w-fit mt-1 border border-rose-500/10">Balance Due: {debt.toLocaleString()} <span className="text-[8px]">ETB</span></span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-6 text-center">
                                                    <div className="flex justify-center">
                                                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-tighter border backdrop-blur-md shadow-sm ${
                                                            order.status === 'Refunded'
                                                                ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                                                                : order.status === 'Paid'
                                                                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                                                    : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                                        }`}>
                                                            {order.status}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="p-6 text-center font-bold text-slate-600 text-sm">
                                                    {order.items.toLocaleString()} <span className="text-[10px] text-slate-400 font-black">PCS</span>
                                                </td>
                                                <td className="p-6 text-right">
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-sm font-black text-slate-900">{order.total.toLocaleString()} <span className="text-[9px] text-slate-400">ETB</span></span>
                                                        {order.paidAmount > 0 && (
                                                            <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-tighter">Received: {order.paidAmount.toLocaleString()} <span className="text-[8px]">ETB</span></span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-6 text-right pr-10">
                                                    <span className="text-xs font-bold text-slate-400">
                                                        {new Date(order.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
