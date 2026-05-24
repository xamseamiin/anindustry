// app/manufacturing/inventory/raw/page.tsx - AN-Industory Raw Materials
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Search, Plus, Filter, Database, AlertTriangle, TrendingDown,
    ArrowUpRight, ArrowDownLeft, History, Loader2, Wallet, ArrowLeft,
    Edit2, Trash2
} from 'lucide-react';

const StatCard = ({ title, value, subtext, icon: Icon, color }: any) => (
  <div className="card p-6 relative overflow-hidden group">
    <div className={`absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform duration-500 rotate-12 ${color.text}`}>
      <Icon size={120} />
    </div>
    <div className="relative z-10">
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-3 rounded-2xl ${color.bg} ${color.text}`}>
          <Icon size={24} />
        </div>
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.15em]">{title}</h3>
      </div>
      <p className="text-3xl font-black text-slate-900 tracking-tight">{value}</p>
      <p className="text-xs font-bold text-slate-400 mt-1">{subtext}</p>
    </div>
  </div>
);

export default function RawInventoryPage() {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    useEffect(() => {
        fetch('/api/manufacturing/inventory')
            .then(res => res.json())
            .then(data => {
                const rawAndPkg = (data.items || []).filter((i: any) => i.category === 'Raw Material' || i.category === 'Packaging');
                setItems(rawAndPkg);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const totalValue = items.reduce((acc, item) => acc + (Math.max(0, item.inStock) * item.purchasePrice), 0);
    const lowStockCount = items.filter(item => item.inStock > 0 && item.inStock <= (item.minStock || 0)).length;

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <Link href="/manufacturing" className="text-xs font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1 mb-2 hover:underline">
                        <ArrowLeft size={14} /> Back to Hub
                    </Link>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Kaydka Qayriin</h1>
                    <p className="text-slate-500 font-bold text-sm">Raw materials like Resin, Caps, and Packaging.</p>
                </div>
                <div className="flex gap-3">
                    <Link href="/manufacturing/inventory/add?category=Raw%20Material" className="btn-primary flex items-center gap-2">
                        <Plus size={18} /> Add New Material
                    </Link>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Total Materials"
                    value={items.length}
                    subtext="Tracked Items"
                    icon={Database}
                    color={{ bg: 'bg-emerald-500/10', text: 'text-emerald-500' }}
                />
                <StatCard
                    title="Inventory Value"
                    value={<>{totalValue.toLocaleString()} <span className="text-[10px] text-slate-400 font-bold">ETB</span></>}
                    subtext="Cost Basis"
                    icon={Wallet}
                    color={{ bg: 'bg-blue-500/10', text: 'text-blue-500' }}
                />
                <StatCard
                    title="Stock Alerts"
                    value={lowStockCount}
                    subtext="Below Minimum"
                    icon={AlertTriangle}
                    color={{ bg: 'bg-rose-500/10', text: 'text-rose-500' }}
                />
            </div>

            {/* List */}
            <div className="card overflow-hidden">
                <div className="p-6 border-b border-slate-50 flex flex-wrap items-center justify-between gap-4">
                    <div className="relative flex-1 min-w-[300px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search materials..." 
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <select 
                            value={statusFilter} 
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 outline-none cursor-pointer text-slate-600"
                        >
                            <option value="All">All Statuses</option>
                            <option value="Optimal">Optimal</option>
                            <option value="Low Stock">Low Stock</option>
                            <option value="Error">Negative/Error</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-20 text-center text-slate-400">
                            <Loader2 className="animate-spin inline mr-2" /> Loading...
                        </div>
                    ) : items.length === 0 ? (
                        <div className="py-20 text-center text-slate-400">
                            <Database size={48} className="opacity-20 mb-4 mx-auto" />
                            <p className="text-xs font-black uppercase tracking-widest">No materials found</p>
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-50">
                                    <th className="p-6">Material Name</th>
                                    <th className="p-6">In Stock</th>
                                    <th className="p-6">Min Stock</th>
                                    <th className="p-6">Unit Cost</th>
                                    <th className="p-6">Total Value</th>
                                    <th className="p-6">Supplier</th>
                                    <th className="p-6">Status</th>
                                    <th className="p-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm divide-y divide-slate-50">
                                {items.filter(i => {
                                    const matchesSearch = i.name.toLowerCase().includes(searchTerm.toLowerCase());
                                    if (!matchesSearch) return false;
                                    
                                    const isError = i.inStock < 0;
                                    const isLow = !isError && i.inStock <= (i.minStock || 0);
                                    const currentStatus = isError ? 'Error' : isLow ? 'Low Stock' : 'Optimal';
                                    
                                    if (statusFilter === 'All') return true;
                                    return currentStatus === statusFilter;
                                }).map((item) => {
                                    const isError = item.inStock < 0;
                                    const isLow = !isError && item.inStock <= (item.minStock || 0);

                                    return (
                                        <tr key={item.id} className="hover:bg-slate-50/50 group transition-all">
                                            <td className="p-6 font-black text-slate-900">{item.name}</td>
                                            <td className={`p-6 font-bold ${isError ? 'text-red-500' : 'text-slate-600'}`}>
                                                {item.inStock} {item.unit}
                                            </td>
                                            <td className="p-6 text-slate-500 font-medium">{item.minStock || 0} {item.unit}</td>
                                            <td className="p-6 text-slate-400">{item.purchasePrice.toFixed(2)} <span className="text-[10px] text-slate-400">ETB</span></td>
                                            <td className="p-6 font-black text-slate-900">
                                                {(Math.max(0, item.inStock) * item.purchasePrice).toLocaleString()} <span className="text-[10px] text-slate-400">ETB</span>
                                            </td>
                                            <td className="p-6 text-slate-500 text-sm font-medium">{item.supplier || 'N/A'}</td>
                                            <td className="p-6">
                                                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter ${
                                                    isError ? 'bg-red-500 text-white' :
                                                    isLow ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'
                                                }`}>
                                                    {isError ? 'Error' : isLow ? 'Low Stock' : 'Optimal'}
                                                </span>
                                            </td>
                                            <td className="p-6 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link href={`/manufacturing/inventory/receive?id=${item.id}`} title="Receive Stock" className="p-2 text-emerald-500 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors">
                                                        <Plus size={16} />
                                                    </Link>
                                                    <Link href={`/manufacturing/inventory/edit?id=${item.id}`} title="Edit" className="p-2 text-blue-500 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                                                        <Edit2 size={16} />
                                                    </Link>
                                                    <button title="History" className="p-2 text-slate-400 bg-slate-50 rounded-lg hover:bg-slate-100 hover:text-slate-600 transition-colors">
                                                        <History size={16} />
                                                    </button>
                                                    <button title="Delete" className="p-2 text-rose-500 bg-rose-50 rounded-lg hover:bg-rose-100 transition-colors">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
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
    );
}
