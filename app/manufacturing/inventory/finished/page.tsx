// app/manufacturing/inventory/finished/page.tsx - AN-Industory Finished Goods (Glassmorphism Live)
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Search, Plus, Filter, Package, CheckCircle2, 
    ArrowUpRight, ArrowDownLeft, History, Loader2, Wallet, ArrowLeft,
    TrendingUp, Box, Activity, LayoutGrid
} from 'lucide-react';

export default function FinishedInventoryPage() {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetch('/api/manufacturing/inventory?category=Finished Goods')
            .then(res => res.json())
            .then(data => {
                setItems(data.items || []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const totalBottles = items.reduce((acc, item) => acc + (item.inStock || 0), 0);
    const totalPotentialRevenue = items.reduce((acc, item) => acc + (item.inStock * (item.sellingPrice || 0)), 0);

    return (
        <div className="relative min-h-screen">
            {/* Ultra-Premium Dynamic Background Blobs */}
            <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
                <div className="absolute top-[-5%] left-[-5%] w-[45%] h-[45%] bg-emerald-500/10 rounded-full blur-[130px] animate-pulse" />
                <div className="absolute bottom-[-5%] right-[-5%] w-[45%] h-[45%] bg-blue-500/10 rounded-full blur-[130px] animate-pulse" style={{ animationDelay: '3s' }} />
            </div>

            <div className="flex flex-col gap-6 px-8 animate-fade-in max-w-[1700px] mx-auto py-8 relative z-10">
                {/* Header */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                    <div className="flex items-center gap-5">
                        <Link href="/manufacturing" className="p-3 bg-white/60 backdrop-blur-xl rounded-2xl border border-white/40 shadow-xl hover:border-emerald-500 text-slate-400 transition-all">
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Link href="/manufacturing" className="text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:underline">Factory Hub</Link>
                                <span className="text-slate-300">/</span>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Finished Goods</span>
                            </div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Kaydka Bisil (Finished)</h1>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button className="px-6 py-3.5 bg-emerald-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-600/30 hover:bg-emerald-700 transition-all flex items-center gap-2 active:scale-95">
                            <TrendingUp size={18} /> Update Pricing
                        </button>
                    </div>
                </div>

                {/* Stats Summary with Glassmorphism */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {[
                        { label: 'Total Stock', value: totalBottles.toLocaleString(), sub: 'Available Bottles', icon: <Box size={22} />, color: 'blue' },
                        { label: 'Potential Revenue', value: <>{totalPotentialRevenue.toLocaleString()} <span className="text-[10px] text-slate-400 font-bold ml-1">ETB</span></>, sub: 'Market Value', icon: <Wallet size={22} />, color: 'emerald' },
                        { label: 'Product Lines', value: items.length, sub: 'Different Sizes', icon: <LayoutGrid size={22} />, color: 'amber' }
                    ].map((stat, idx) => (
                        <div key={idx} className="bg-white/40 backdrop-blur-2xl p-7 rounded-2xl border border-white/40 shadow-xl flex items-center gap-6 group hover:border-emerald-500/30 transition-all duration-300">
                            <div className={`p-5 rounded-2xl bg-${stat.color}-500/10 text-${stat.color}-600 group-hover:scale-110 transition-transform duration-300 shadow-inner`}>{stat.icon}</div>
                            <div>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                                <p className="text-3xl font-black text-slate-900 tracking-tight">{loading ? '...' : stat.value}</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{stat.sub}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* List Table (Glassy) */}
                <div className="bg-white/30 backdrop-blur-3xl rounded-3xl border border-white/50 shadow-2xl overflow-hidden flex flex-col min-h-[600px] transition-all">
                    <div className="p-6 border-b border-white/20 bg-white/20">
                        <div className="relative max-w-md">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input 
                                type="text" 
                                placeholder="Search finished products..." 
                                className="w-full pl-12 pr-6 py-3.5 bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500/40 transition-all shadow-inner" 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto flex-1">
                        {loading ? (
                            <div className="h-[400px] flex flex-col items-center justify-center gap-4">
                                <Loader2 className="animate-spin text-emerald-500" size={32} />
                                <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">Scanning Inventory...</p>
                            </div>
                        ) : items.length === 0 ? (
                            <div className="h-[400px] flex flex-col items-center justify-center gap-6 opacity-60">
                                <Package size={64} className="text-slate-300" />
                                <p className="text-xs font-black uppercase tracking-widest text-slate-900">No finished products in stock.</p>
                            </div>
                        ) : (
                            <table className="w-full text-left border-separate border-spacing-0">
                                <thead className="bg-white/10 sticky top-0 z-20 backdrop-blur-md">
                                    <tr className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 border-b border-white/20">
                                        <th className="p-6 pl-10">Product Name</th>
                                        <th className="p-6 text-center">In Stock</th>
                                        <th className="p-6 text-center">Selling Price</th>
                                        <th className="p-6 text-center">Potential Rev</th>
                                        <th className="p-6 text-center">Status</th>
                                        <th className="p-6 text-right pr-10">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                    {items.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase())).map((item) => (
                                        <tr key={item.id} className="group hover:bg-white/40 transition-all duration-300">
                                            <td className="p-6 pl-10">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-sm font-black text-slate-900 group-hover:text-emerald-700 transition-colors">{item.name}</span>
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{item.sku || 'Finished Product'}</span>
                                                </div>
                                            </td>
                                            <td className="p-6 text-center">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-sm font-black text-emerald-600">{item.inStock.toLocaleString()}</span>
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{item.unit}</span>
                                                </div>
                                            </td>
                                            <td className="p-6 text-center text-sm font-bold text-slate-400">{(item.sellingPrice || 0).toFixed(2)} <span className="text-[9px]">ETB</span></td>
                                            <td className="p-6 text-center text-sm font-black text-slate-900">{(item.inStock * (item.sellingPrice || 0)).toLocaleString()} <span className="text-[9px] text-slate-400">ETB</span></td>
                                            <td className="p-6 text-center">
                                                <div className="flex justify-center">
                                                    <span className="px-4 py-1.5 rounded-full text-[9px] font-black uppercase border backdrop-blur-md shadow-sm bg-blue-500/10 text-blue-600 border-blue-500/20">
                                                        Ready for Sale
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-6 text-right pr-10">
                                                <button className="p-2.5 bg-white/60 hover:bg-white rounded-xl text-slate-400 hover:text-emerald-600 shadow-sm border border-white/50 transition-all opacity-0 group-hover:opacity-100">
                                                    <History size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
