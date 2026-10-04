// app/manufacturing/production-orders/page.tsx - AN-Industory Production Terminal (Glassmorphism Live + Edit & Delete)
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Plus, Search, Factory, Filter, Calendar, FileText, Loader2,
    CheckCircle2, Clock, AlertTriangle, ArrowRight, ArrowLeft,
    TrendingUp, Boxes, Zap, RefreshCcw, MoreVertical, ArrowUpRight,
    Pencil, Trash2, X
} from 'lucide-react';
import Toast from '@/components/common/Toast';

export default function ProductionOrdersPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Edit Modal State
    const [editingOrder, setEditingOrder] = useState<any | null>(null);
    const [editProductName, setEditProductName] = useState('');
    const [editQuantity, setEditQuantity] = useState<number>(1000);
    const [editStatus, setEditStatus] = useState('COMPLETED');
    const [editPriority, setEditPriority] = useState('MEDIUM');
    const [editStartDate, setEditStartDate] = useState('');
    const [editDueDate, setEditDueDate] = useState('');
    const [editNotes, setEditNotes] = useState('');
    const [savingEdit, setSavingEdit] = useState(false);

    // Delete Modal State
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

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
        pending: orders.filter(o => o.status === 'PENDING' || o.status === 'IN_PROGRESS' || o.status === 'PLANNED').length
    };

    const handleDeleteOrder = async (id: string) => {
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/manufacturing/production-orders/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (res.ok) {
                showNotification(data.message || 'Production run deleted successfully.', 'success');
                setDeletingId(null);
                fetchOrders();
            } else {
                showNotification(data.message || 'Ma awoodin in production run-ka la tirtiro.', 'error');
            }
        } catch (e) {
            console.error('Delete order error:', e);
            showNotification('Cilad ayaa dhacday marka production run-ka la tirtirayay.', 'error');
        } finally {
            setIsDeleting(false);
        }
    };

    const openEditModal = (order: any) => {
        setEditingOrder(order);
        setEditProductName(order.productName || '');
        setEditQuantity(order.quantity || 1000);
        setEditStatus(order.status || 'COMPLETED');
        setEditPriority(order.priority || 'MEDIUM');
        setEditStartDate(order.startDate ? new Date(order.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
        setEditDueDate(order.dueDate ? new Date(order.dueDate).toISOString().split('T')[0] : '');
        setEditNotes(order.notes || '');
    };

    const handleSaveEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingOrder) return;
        setSavingEdit(true);

        try {
            const res = await fetch(`/api/manufacturing/production-orders/${editingOrder.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productName: editProductName,
                    quantity: editQuantity,
                    status: editStatus,
                    priority: editPriority,
                    startDate: editStartDate,
                    dueDate: editDueDate || null,
                    notes: editNotes
                })
            });
            const data = await res.json();
            if (res.ok) {
                showNotification(data.message || 'Production order updated successfully.', 'success');
                setEditingOrder(null);
                fetchOrders();
            } else {
                showNotification(data.message || 'Cusboonaysiintu ma kaydsamin.', 'error');
            }
        } catch (e) {
            console.error('Update production order error:', e);
            showNotification('Cilad ayaa dhacday marka order-ka la cusboonaysiinayay.', 'error');
        } finally {
            setSavingEdit(false);
        }
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
                                    <th className="p-6 text-right pr-10">Actions</th>
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
                                            <div className="flex items-center justify-end gap-2">
                                                <Link href={`/manufacturing/production-orders/${order.id}`} className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200 text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-slate-900 hover:text-white transition-all">
                                                    Analysis
                                                    <ArrowUpRight size={13} />
                                                </Link>
                                                <button
                                                    type="button"
                                                    onClick={() => openEditModal(order)}
                                                    className="p-2.5 bg-blue-500/10 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-all shadow-sm active:scale-95"
                                                    title="Wax ka beddel production-ka"
                                                >
                                                    <Pencil size={15} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setDeletingId(order.id)}
                                                    className="p-2.5 bg-rose-500/10 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl transition-all shadow-sm active:scale-95"
                                                    title="Tirtir production-ka"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
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

            {/* EDIT PRODUCTION ORDER MODAL */}
            {editingOrder && (
                <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-slate-900 border border-blue-500/30 text-white rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-5">
                        <div className="flex justify-between items-center border-b border-white/10 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400">
                                    <Pencil size={20} />
                                </div>
                                <div>
                                    <h3 className="text-base font-black uppercase tracking-wider text-white">Wax ka beddel Production #{editingOrder.orderNumber}</h3>
                                    <p className="text-[10px] text-slate-400 font-bold">Beddel alaabta, tirada, status-ka ama taariikhda</p>
                                </div>
                            </div>
                            <button onClick={() => setEditingOrder(null)} className="p-2 rounded-xl bg-white/10 text-slate-400 hover:text-white">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveEdit} className="space-y-4 text-xs font-bold">
                            <div>
                                <label className="block text-[10px] uppercase font-black text-slate-400 mb-1">Magaca Alaabta (Product Name) *</label>
                                <input
                                    type="text"
                                    required
                                    value={editProductName}
                                    onChange={(e) => setEditProductName(e.target.value)}
                                    className="w-full p-3 bg-slate-950 text-white border border-white/15 rounded-xl outline-none focus:border-blue-400"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] uppercase font-black text-slate-400 mb-1">Tirada (Batch Volume) *</label>
                                    <input
                                        type="number"
                                        min="1"
                                        required
                                        value={editQuantity}
                                        onChange={(e) => setEditQuantity(parseInt(e.target.value) || 0)}
                                        className="w-full p-3 bg-slate-950 text-white border border-white/15 rounded-xl outline-none focus:border-blue-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase font-black text-slate-400 mb-1">Status-ka Run-ka</label>
                                    <select
                                        value={editStatus}
                                        onChange={(e) => setEditStatus(e.target.value)}
                                        className="w-full p-3 bg-slate-950 text-white border border-white/15 rounded-xl outline-none focus:border-blue-400"
                                    >
                                        <option value="COMPLETED" className="bg-slate-950">COMPLETED (Dhammaystiran)</option>
                                        <option value="IN_PROGRESS" className="bg-slate-950">IN_PROGRESS (Socda)</option>
                                        <option value="PLANNED" className="bg-slate-950">PLANNED (Qorshaysan)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] uppercase font-black text-slate-400 mb-1">Taariikhda Billaabashada (Start Date) *</label>
                                    <input
                                        type="date"
                                        required
                                        value={editStartDate}
                                        onChange={(e) => setEditStartDate(e.target.value)}
                                        className="w-full p-3 bg-slate-950 text-white border border-white/15 rounded-xl outline-none focus:border-blue-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase font-black text-slate-400 mb-1">Priority (Ahmiyadda)</label>
                                    <select
                                        value={editPriority}
                                        onChange={(e) => setEditPriority(e.target.value)}
                                        className="w-full p-3 bg-slate-950 text-white border border-white/15 rounded-xl outline-none focus:border-blue-400"
                                    >
                                        <option value="LOW" className="bg-slate-950">LOW</option>
                                        <option value="MEDIUM" className="bg-slate-950">MEDIUM</option>
                                        <option value="HIGH" className="bg-slate-950">HIGH</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] uppercase font-black text-slate-400 mb-1">Faahfaahin / Notes</label>
                                <textarea
                                    value={editNotes}
                                    onChange={(e) => setEditNotes(e.target.value)}
                                    rows={2}
                                    placeholder="Faahfaahin dheeraad ah..."
                                    className="w-full p-3 bg-slate-950 text-white border border-white/15 rounded-xl outline-none focus:border-blue-400"
                                />
                            </div>

                            <div className="flex gap-3 pt-3 border-t border-white/10">
                                <button
                                    type="button"
                                    onClick={() => setEditingOrder(null)}
                                    className="flex-1 py-3.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-xs active:scale-95 transition-all"
                                >
                                    Kansal
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingEdit}
                                    className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-blue-600/30"
                                >
                                    {savingEdit ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                                    <span>Kaydi Isbeddelada</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* DELETE PRODUCTION CONFIRMATION MODAL */}
            {deletingId && (
                <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-slate-900 border border-rose-500/30 text-white rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 text-center">
                        <div className="p-4 rounded-full bg-rose-500/20 text-rose-400 w-fit mx-auto border border-rose-500/30">
                            <AlertTriangle size={32} />
                        </div>
                        <h3 className="text-base font-black uppercase tracking-wider text-white">Ma ziido run baa in aad tirtirto Production Run-kan?</h3>
                        <p className="text-xs text-slate-300 font-medium leading-relaxed">
                            Markaad tirtirto amarkan warshadda, meesha uu ku jiro log-gu waa la safaynayaa.
                        </p>
                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setDeletingId(null)}
                                className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-xs active:scale-95 transition-all"
                            >
                                Jooji
                            </button>
                            <button
                                type="button"
                                disabled={isDeleting}
                                onClick={() => handleDeleteOrder(deletingId)}
                                className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-rose-600/30"
                            >
                                {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                <span>Oo Tirtir</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}
