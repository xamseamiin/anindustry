// app/manufacturing/inventory/page.tsx - AN-Industory Factory Inventory (Glassmorphism Live)
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Search, Plus, Filter, Package, AlertTriangle, TrendingDown,
    ArrowUpRight, ArrowDownLeft, History, Loader2, DollarSign,
    ArrowLeft, LayoutGrid, List, Boxes, Activity, Ruler, Calculator
} from 'lucide-react';

interface InventoryItem {
    id: string;
    name: string;
    sku?: string;
    category: string;
    inStock: number;
    unit: string;
    minStock: number;
    purchasePrice: number;
    sellingPrice?: number;
    location?: string;
    capacity?: number;
    yieldPerMeter?: number;
}

export default function FactoryInventoryPage() {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All Categories');

    const fetchInventory = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (searchTerm) params.append('search', searchTerm);
            if (selectedCategory && selectedCategory !== 'All Categories') params.append('category', selectedCategory);

            const res = await fetch(`/api/manufacturing/inventory?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setItems(data.items);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchInventory();
        }, 300);
        return () => clearTimeout(timeout);
    }, [searchTerm, selectedCategory]);

    const totalValue = items.reduce((acc, item) => acc + (item.inStock * item.purchasePrice), 0);
    const lowStockItems = items.filter(item => item.inStock <= item.minStock).length;

    const getStatus = (item: InventoryItem) => {
        if (item.inStock === 0) return 'Critical';
        if (item.inStock <= item.minStock) return 'Low';
        return 'Good';
    };

    return (
        <div className="relative min-h-screen">
            <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-blue-500/10 rounded-full blur-[130px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-emerald-500/10 rounded-full blur-[130px] animate-pulse" style={{ animationDelay: '2.5s' }} />
            </div>

            <div className="flex flex-col gap-6 px-8 animate-fade-in max-w-[1700px] mx-auto py-8 relative z-10">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                    <div className="flex items-center gap-5">
                        <div className="p-4 bg-white/60 backdrop-blur-xl rounded-2xl shadow-xl border border-white/40 text-blue-600">
                            <Boxes size={28} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Link href="/manufacturing" className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">Factory Hub</Link>
                                <span className="text-slate-300">/</span>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Master Stock</span>
                            </div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Factory Inventory</h1>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Link href="/manufacturing/inventory/add" className="px-6 py-3.5 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all flex items-center gap-2 active:scale-95">
                            <Plus size={18} /> New Component
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                    {[
                        { label: 'Total SKUs', value: items.length, icon: <Package size={20} />, color: 'blue' },
                        { label: 'Inventory Value', value: `${totalValue.toLocaleString()} ETB`, icon: <DollarSign size={20} />, color: 'emerald' },
                        { label: 'Low Stock Alert', value: lowStockItems, icon: <AlertTriangle size={20} />, color: 'rose' },
                        { label: 'Active Components', value: items.filter(i => i.inStock > 0).length, icon: <Activity size={20} />, color: 'amber' }
                    ].map((stat, idx) => (
                        <div key={idx} className="bg-white/40 backdrop-blur-2xl p-6 rounded-2xl border border-white/40 shadow-xl flex items-center gap-5 group hover:border-blue-500/30 transition-all duration-300">
                            <div className={`p-4 rounded-2xl bg-${stat.color}-500/10 text-${stat.color}-600 group-hover:scale-110 transition-transform duration-300`}>{stat.icon}</div>
                            <div>
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                                <p className="text-2xl font-black text-slate-900 tracking-tight">{loading ? '...' : stat.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="bg-white/30 backdrop-blur-3xl rounded-3xl border border-white/50 shadow-2xl overflow-hidden flex flex-col min-h-[600px]">
                    <div className="p-6 border-b border-white/20 flex flex-wrap items-center justify-between gap-5 bg-white/20">
                        <div className="relative flex-1 max-w-xl">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input
                                type="text"
                                placeholder="Search inventory..."
                                className="w-full pl-12 pr-6 py-3.5 bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 transition-all shadow-inner"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="px-5 py-3 bg-white/60 backdrop-blur-md border border-white/40 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 outline-none"
                        >
                            <option>All Categories</option>
                            <option>Raw Material</option>
                            <option>Packaging</option>
                            <option>Finished Goods</option>
                        </select>
                    </div>

                    <div className="overflow-x-auto flex-1">
                        {loading ? (
                            <div className="h-[400px] flex flex-col items-center justify-center gap-4">
                                <Loader2 className="animate-spin text-blue-500" size={32} />
                            </div>
                        ) : (
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 bg-white/10">
                                        <th className="p-6 pl-10">Component</th>
                                        <th className="p-6 text-center">In Stock</th>
                                        <th className="p-6 text-center">Bag Specs</th>
                                        <th className="p-6 text-center">Unit Cost</th>
                                        <th className="p-6 text-center">Total Value</th>
                                        <th className="p-6 text-center">Status</th>
                                        <th className="p-6 text-right pr-10">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                    {items.map((item) => {
                                        const status = getStatus(item);
                                        return (
                                            <tr key={item.id} className="group hover:bg-white/40 transition-all duration-300">
                                                <td className="p-6 pl-10">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors">{item.name}</span>
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{item.sku || 'N/A'}</span>
                                                    </div>
                                                </td>
                                                <td className="p-6 text-center">
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-sm font-black text-slate-900">{item.inStock.toLocaleString()}</span>
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{item.unit}</span>
                                                    </div>
                                                </td>
                                                <td className="p-6 text-center">
                                                    {item.capacity ? (
                                                        <div className="flex flex-col items-center gap-1">
                                                            <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 text-blue-600 rounded-lg border border-blue-500/20">
                                                                <Calculator size={10} />
                                                                <span className="text-[10px] font-black uppercase">1:{item.capacity}</span>
                                                            </div>
                                                            {(item.yieldPerMeter ?? 0) > 0 && (
                                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{item.yieldPerMeter} pcs/m</span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">N/A</span>
                                                    )}
                                                </td>
                                                <td className="p-6 text-center">
                                                    <span className="text-xs font-bold text-slate-500">{item.purchasePrice.toLocaleString()} ETB</span>
                                                </td>
                                                <td className="p-6 text-center">
                                                    <span className="text-sm font-black text-slate-900">{(item.inStock * item.purchasePrice).toLocaleString()} ETB</span>
                                                </td>
                                                <td className="p-6 text-center">
                                                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase border shadow-sm ${
                                                        status === 'Critical' ? 'bg-rose-500/10 text-rose-600 border-rose-500/20' :
                                                        status === 'Low' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : 
                                                        'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                                    }`}>
                                                        {status}
                                                    </span>
                                                </td>
                                                <td className="p-6 text-right pr-10">
                                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                        <Link href={`/manufacturing/inventory/${item.id}`} className="p-2.5 bg-sky-50 hover:bg-sky-100 rounded-xl text-sky-600 border border-sky-200/40 transition-all" title="Faahfaahin">
                                                            <ArrowUpRight size={16} />
                                                        </Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
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
