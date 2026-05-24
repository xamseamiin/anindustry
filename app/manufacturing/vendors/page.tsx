'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
    Plus, Search, Filter, Calendar, List, LayoutGrid, 
    Eye, Edit, Trash2, Loader2, AlertCircle, RefreshCcw, 
    Users, ShoppingCart, Truck, Phone, Mail, MapPin, 
    ArrowLeft, MoreVertical, Package, BadgeDollarSign
} from 'lucide-react';
import Toast from '@/components/common/Toast';

export default function VendorsPage() {
    const [vendors, setVendors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const fetchVendors = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/manufacturing/vendors');
            if (res.ok) {
                const data = await res.json();
                setVendors(data.vendors || []);
            }
        } catch (error) {
            console.error("Failed to load vendors", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVendors();
    }, []);

    const handleDeleteVendor = async (id: string) => {
        if (!confirm('Ma hubtaa inaad tirtirto iibiyahan?')) return;
        try {
            const res = await fetch(`/api/manufacturing/vendors/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setToast({ message: 'Iibiyaha waa la tirtiray!', type: 'success' });
                fetchVendors();
            }
        } catch (error) {
            setToast({ message: 'Error deleting vendor', type: 'error' });
        }
    };

    const filteredVendors = vendors.filter(v => 
        v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                            <Truck className="text-blue-600" size={32} />
                            Suppliers & Vendors
                        </h1>
                        <p className="text-sm text-slate-500 font-medium">Manage your procurement partners and supply chain.</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button onClick={fetchVendors} className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 shadow-sm transition-all">
                        <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <Link 
                        href="/manufacturing/vendors/add"
                        className="flex-1 md:flex-none px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm shadow-lg flex items-center justify-center gap-2 hover:bg-slate-800 transition-all"
                    >
                        <Plus size={18} />
                        Add New Vendor
                    </Link>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-white/60 backdrop-blur-xl p-6 rounded-3xl border border-white shadow-xl flex items-center gap-5">
                    <div className="p-4 bg-blue-500/10 text-blue-600 rounded-2xl">
                        <Users size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Partners</p>
                        <p className="text-2xl font-black text-slate-900 leading-none mt-1">{vendors.length}</p>
                    </div>
                </div>
                <div className="bg-white/60 backdrop-blur-xl p-6 rounded-3xl border border-white shadow-xl flex items-center gap-5">
                    <div className="p-4 bg-emerald-500/10 text-emerald-600 rounded-2xl">
                        <ShoppingCart size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Purchases</p>
                        <p className="text-2xl font-black text-slate-900 leading-none mt-1">Live Feed</p>
                    </div>
                </div>
                <div className="bg-white/60 backdrop-blur-xl p-6 rounded-3xl border border-white shadow-xl flex items-center gap-5">
                    <div className="p-4 bg-amber-500/10 text-amber-600 rounded-2xl">
                        <BadgeDollarSign size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Outstanding Balances</p>
                        <p className="text-2xl font-black text-slate-900 leading-none mt-1">Calculated</p>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="bg-white/40 backdrop-blur-2xl rounded-[2.5rem] border border-white/40 shadow-2xl overflow-hidden flex flex-col min-h-[500px]">
                {/* Toolbar */}
                <div className="p-6 border-b border-white/40 flex flex-col md:flex-row gap-4 justify-between items-center bg-white/20">
                    <div className="relative w-full md:max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search vendors by name or contact..."
                            className="w-full pl-12 pr-4 py-3 bg-white/60 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all placeholder:text-slate-400"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2">
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

                {/* Main Content */}
                <div className="flex-1 p-6">
                    {loading ? (
                        <div className="p-20 flex flex-col items-center justify-center gap-4">
                            <Loader2 size={40} className="animate-spin text-blue-500" />
                            <p className="text-sm font-bold text-slate-400 animate-pulse uppercase tracking-widest">Loading Supply Chain...</p>
                        </div>
                    ) : filteredVendors.length === 0 ? (
                        <div className="p-20 flex flex-col items-center justify-center gap-4 text-slate-400">
                            <AlertCircle size={48} className="opacity-20" />
                            <p className="font-bold">No vendors found.</p>
                            <Link href="/manufacturing/vendors/add" className="text-blue-600 font-bold hover:underline">Add your first partner</Link>
                        </div>
                    ) : viewMode === 'list' ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="text-[10px] uppercase text-slate-400 font-black tracking-[0.2em] border-b border-slate-100 bg-slate-50/30">
                                        <th className="p-6 pl-10">Vendor / Company</th>
                                        <th className="p-6 text-center">Nooca / Type</th>
                                        <th className="p-6">Contact Info</th>
                                        <th className="p-6 text-right pr-10">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredVendors.map((v) => (
                                        <tr key={v.id} className="group hover:bg-blue-50/50 transition-all duration-300">
                                            <td className="p-6 pl-10">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-lg group-hover:scale-110 transition-transform">
                                                        {v.name.slice(0, 1)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-slate-900 leading-none">{v.name}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 mt-2 flex items-center gap-1 uppercase tracking-widest">
                                                            ID: {v.id.slice(0, 8)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-6 text-center">
                                                <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                                    {v.type || 'Material'}
                                                </span>
                                            </td>
                                            <td className="p-6">
                                                <div className="space-y-1.5">
                                                    {v.phone && (
                                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                                            <Phone size={12} className="text-blue-500" />
                                                            {v.phone}
                                                        </div>
                                                    )}
                                                    {v.email && (
                                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 italic">
                                                            <Mail size={12} className="text-slate-300" />
                                                            {v.email}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-6 text-right pr-10">
                                                <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                                    <Link href={`/manufacturing/vendors/${v.id}`} className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-200 text-slate-500 hover:text-blue-600 transition-all">
                                                        <Eye size={18} />
                                                    </Link>
                                                    <Link href={`/manufacturing/vendors/edit/${v.id}`} className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-200 text-slate-500 hover:text-amber-600 transition-all">
                                                        <Edit size={18} />
                                                    </Link>
                                                    <button onClick={() => handleDeleteVendor(v.id)} className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-200 text-slate-500 hover:text-rose-600 transition-all">
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredVendors.map((v) => (
                                <div key={v.id} className="bg-white/60 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white shadow-xl hover:shadow-2xl transition-all group">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-2xl shadow-xl group-hover:rotate-6 transition-all">
                                            {v.name.slice(0, 1)}
                                        </div>
                                        <div className="flex gap-2">
                                            <Link href={`/manufacturing/vendors/${v.id}`} className="p-2.5 bg-slate-50 rounded-xl text-slate-400 hover:text-blue-600 transition-all">
                                                <Eye size={18} />
                                            </Link>
                                            <button className="p-2.5 bg-slate-50 rounded-xl text-slate-400">
                                                <MoreVertical size={18} />
                                            </button>
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 leading-tight mb-2">{v.name}</h3>
                                    <div className="flex items-center gap-2 mb-6">
                                        <span className="px-3 py-1 bg-blue-500/10 text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-blue-500/10">
                                            {v.type || 'Supplier'}
                                        </span>
                                    </div>
                                    <div className="space-y-4 pt-4 border-t border-slate-50">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-slate-100 rounded-lg text-slate-400"><Phone size={14} /></div>
                                            <span className="text-xs font-black text-slate-700">{v.phone || 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-slate-100 rounded-lg text-slate-400"><MapPin size={14} /></div>
                                            <span className="text-xs font-bold text-slate-500 truncate">{v.address || 'Location Not Set'}</span>
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