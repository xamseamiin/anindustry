// app/manufacturing/sales/page.tsx - AN-Industory Sales Hub (Glassmorphism Live + Edit & Delete)
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Plus, Search, Filter, CreditCard, Wallet,
    TrendingUp, TrendingDown, Truck, FileText, Loader2, 
    RefreshCcw, ArrowRight, ChevronRight, Activity, Boxes,
    ClipboardList, Pencil, Trash2, X, Calendar, CheckCircle2, AlertTriangle, UserPlus
} from 'lucide-react';

export default function FactorySalesPage() {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [salesOrders, setSalesOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Edit Modal States
    const [editingOrder, setEditingOrder] = useState<any | null>(null);
    const [editSaleDate, setEditSaleDate] = useState('');
    const [editCustomerId, setEditCustomerId] = useState('');
    const [editAccountId, setEditAccountId] = useState('');
    const [editPaymentMethod, setEditPaymentMethod] = useState('CASH');
    const [editPaidAmount, setEditPaidAmount] = useState<number>(0);
    const [editDiscount, setEditDiscount] = useState<number>(0);
    const [editItems, setEditItems] = useState<any[]>([]);
    const [savingEdit, setSavingEdit] = useState(false);

    // Options for Edit Form
    const [products, setProducts] = useState<any[]>([]);
    const [customers, setCustomers] = useState<any[]>([]);
    const [accounts, setAccounts] = useState<any[]>([]);

    // Delete Modal / Confirmation
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Toast Alert
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

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

    const fetchDropdownOptions = async () => {
        try {
            const [pRes, cRes, aRes] = await Promise.all([
                fetch('/api/manufacturing/inventory?category=Finished Goods'),
                fetch('/api/manufacturing/customers'),
                fetch('/api/manufacturing/accounting/accounts')
            ]);
            if (pRes.ok) setProducts((await pRes.json()).items || []);
            if (cRes.ok) setCustomers((await cRes.json()).customers || []);
            if (aRes.ok) setAccounts((await aRes.json()).accounts || []);
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        fetchSales();
        fetchDropdownOptions();
    }, []);

    const activeOrders = salesOrders.filter(order => order.status !== 'Refunded');
    const totalRevenue = activeOrders.reduce((sum, order) => sum + order.total, 0);
    const totalDebt = activeOrders.reduce((sum, order) => sum + (order.total - (order.paidAmount || 0)), 0);
    const filteredOrders = salesOrders.filter(o =>
        o.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.invoiceNumber || o.id).toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDeleteSale = async (id: string) => {
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/manufacturing/sales/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (res.ok && data.success) {
                showNotification('Iibka si guul leh ayaa loo tirtiray, stock-gii iyo balance-kiina waa la soo celiyay.', 'success');
                setDeletingId(null);
                fetchSales();
            } else {
                showNotification(data.error || 'Ma awoodin in iibka la tirtiro.', 'error');
            }
        } catch (e) {
            console.error('Delete sale error:', e);
            showNotification('Cilad ayaa dhacday marka iibka la tirtirayay.', 'error');
        } finally {
            setIsDeleting(false);
        }
    };

    const openEditModal = (order: any) => {
        setEditingOrder(order);
        setEditSaleDate(order.date || new Date().toISOString().split('T')[0]);
        setEditCustomerId(order.customerId || '');
        setEditAccountId(order.accountId || (accounts[0]?.id || ''));
        setEditPaymentMethod(order.paymentMethod || 'CASH');
        setEditPaidAmount(Number(order.paidAmount || 0));
        setEditDiscount(Number(order.discount || 0));

        if (Array.isArray(order.rawItems) && order.rawItems.length > 0) {
            setEditItems(order.rawItems.map((item: any, idx: number) => ({
                id: item.id || idx + 1,
                productId: item.productId,
                productName: item.productName,
                quantity: item.quantity,
                unitPrice: item.unitPrice
            })));
        } else {
            setEditItems([{ id: 1, productId: '', productName: '', quantity: 1, unitPrice: 0 }]);
        }
    };

    const addEditItem = () => setEditItems([...editItems, { id: Date.now(), productId: '', productName: '', quantity: 1, unitPrice: 0 }]);
    const removeEditItem = (id: any) => editItems.length > 1 && setEditItems(editItems.filter(i => i.id !== id));

    const updateEditItem = (id: any, field: string, value: any) => {
        setEditItems(editItems.map(item => {
            if (item.id === id) {
                if (field === 'productId') {
                    const match = products.find(p => p.id === value);
                    if (match) return { ...item, productId: value, productName: match.name, unitPrice: Number(match.sellingPrice) };
                }
                return { ...item, [field]: value };
            }
            return item;
        }));
    };

    const editSubtotal = editItems.reduce((sum, item) => sum + (Number(item.quantity || 0) * Number(item.unitPrice || 0)), 0);
    const editGrandTotal = Math.max(0, editSubtotal - Number(editDiscount || 0));

    const handleSaveEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingOrder) return;
        setSavingEdit(true);

        try {
            const res = await fetch(`/api/manufacturing/sales/${editingOrder.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: editSaleDate,
                    customerId: editCustomerId,
                    accountId: editAccountId,
                    paymentMethod: editPaymentMethod,
                    paidAmount: editPaidAmount,
                    discount: editDiscount,
                    items: editItems
                })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                showNotification('Iibka si guul leh ayaa loo cusboonaysiiyay!', 'success');
                setEditingOrder(null);
                fetchSales();
            } else {
                showNotification(data.error || 'Cusboonaysiintu ma kaydsamin.', 'error');
            }
        } catch (e) {
            console.error('Update sale error:', e);
            showNotification('Cilad ayaa dhacday marka iibka la cusboonaysiinayay.', 'error');
        } finally {
            setSavingEdit(false);
        }
    };

    return (
        <div className="relative min-h-screen">
            {/* Dynamic Background */}
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
                        <Link href="/manufacturing/sales/voucher" className="px-6 py-3.5 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-600/30 hover:bg-blue-700 transition-all flex items-center gap-2 active:scale-95">
                            <FileText size={18} /> Voucher (Rasiidh)
                        </Link>
                        <Link href="/manufacturing/sales/add" className="px-6 py-3.5 bg-emerald-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-600/30 hover:bg-emerald-700 transition-all flex items-center gap-2 active:scale-95">
                            <Plus size={18} /> New Sales Order
                        </Link>
                    </div>
                </div>

                {/* KPI Section */}
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

                {/* Main Content (Table) */}
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
                                        <th className="p-6 text-right">Date</th>
                                        <th className="p-6 text-center pr-10">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                    {filteredOrders.map((order) => {
                                        const debt = order.total - (order.paidAmount || 0);
                                        return (
                                            <tr 
                                                key={order.id} 
                                                className="group hover:bg-white/40 transition-all duration-300"
                                            >
                                                <td className="p-6 pl-10" onClick={() => router.push(`/manufacturing/sales/${order.id}`)}>
                                                    <span className="text-xs font-black text-emerald-600 font-mono tracking-tighter">#{order.invoiceNumber || order.id.slice(-6).toUpperCase()}</span>
                                                </td>
                                                <td className="p-6" onClick={() => router.push(`/manufacturing/sales/${order.id}`)}>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-black text-slate-900 group-hover:text-emerald-700 transition-colors">{order.customer}</span>
                                                        {debt > 0 && order.status !== 'Refunded' && (
                                                            <span className="text-[9px] font-black bg-rose-500/10 text-rose-600 px-2 py-0.5 rounded uppercase tracking-tighter w-fit mt-1 border border-rose-500/10">Balance Due: {debt.toLocaleString()} <span className="text-[8px]">ETB</span></span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-6 text-center" onClick={() => router.push(`/manufacturing/sales/${order.id}`)}>
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
                                                <td className="p-6 text-center" onClick={() => router.push(`/manufacturing/sales/${order.id}`)}>
                                                    <div className="flex flex-col items-center justify-center gap-1">
                                                        <span className="font-bold text-slate-600 text-sm">
                                                            {order.items.toLocaleString()} <span className="text-[10px] text-slate-400 font-black">PCS</span>
                                                        </span>
                                                        {order.breakdown && (
                                                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-tight bg-blue-500/10 px-2.5 py-0.5 rounded-lg border border-blue-500/15">
                                                                {order.breakdown}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-6 text-right" onClick={() => router.push(`/manufacturing/sales/${order.id}`)}>
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-sm font-black text-slate-900">{order.total.toLocaleString()} <span className="text-[9px] text-slate-400">ETB</span></span>
                                                        {order.paidAmount > 0 && (
                                                            <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-tighter">Received: {order.paidAmount.toLocaleString()} <span className="text-[8px]">ETB</span></span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-6 text-right" onClick={() => router.push(`/manufacturing/sales/${order.id}`)}>
                                                    <span className="text-xs font-bold text-slate-400">
                                                        {new Date(order.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </span>
                                                </td>
                                                <td className="p-6 text-center pr-10">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={(e) => { e.stopPropagation(); openEditModal(order); }}
                                                            className="p-2.5 bg-blue-500/10 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-all shadow-sm active:scale-95"
                                                            title="Wax ka beddel iibka"
                                                        >
                                                            <Pencil size={15} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => { e.stopPropagation(); setDeletingId(order.id); }}
                                                            className="p-2.5 bg-rose-500/10 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl transition-all shadow-sm active:scale-95"
                                                            title="Tirtir iibka"
                                                        >
                                                            <Trash2 size={15} />
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

            {/* EDIT SALE MODAL */}
            {editingOrder && (
                <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-slate-900 border border-emerald-500/30 text-white rounded-3xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl space-y-6">
                        <div className="flex justify-between items-center border-b border-white/10 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
                                    <Pencil size={20} />
                                </div>
                                <div>
                                    <h3 className="text-base font-black uppercase tracking-wider text-white">Wax ka beddel Iibka #{editingOrder.invoiceNumber || editingOrder.id.slice(-6).toUpperCase()}</h3>
                                    <p className="text-[10px] text-slate-400 font-bold">Beddel taariikhda, macmiilka, alaabta ama lacagta bixinteeda</p>
                                </div>
                            </div>
                            <button onClick={() => setEditingOrder(null)} className="p-2 rounded-xl bg-white/10 text-slate-400 hover:text-white">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveEdit} className="space-y-4 text-xs font-bold">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] uppercase font-black text-slate-400 mb-1">Taariikhda Iibka (Sale Date) *</label>
                                    <input
                                        type="date"
                                        required
                                        value={editSaleDate}
                                        onChange={(e) => setEditSaleDate(e.target.value)}
                                        className="w-full p-3 bg-slate-950 text-white border border-white/15 rounded-xl outline-none focus:border-emerald-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase font-black text-slate-400 mb-1">Macmiilka (Customer) *</label>
                                    <select
                                        required
                                        value={editCustomerId}
                                        onChange={(e) => setEditCustomerId(e.target.value)}
                                        className="w-full p-3 bg-slate-950 text-white border border-white/15 rounded-xl outline-none focus:border-emerald-400"
                                    >
                                        <option value="">Dooro Macmiil...</option>
                                        {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Items List */}
                            <div className="space-y-2 border border-white/10 p-4 rounded-2xl bg-black/20">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[10px] uppercase font-black text-emerald-400">Alaabta La Iibiyay (Sale Items)</span>
                                    <button type="button" onClick={addEditItem} className="text-[10px] font-black text-emerald-400 flex items-center gap-1 hover:underline">
                                        <Plus size={12} /> Kordhi Item
                                    </button>
                                </div>
                                {editItems.map((item, idx) => (
                                    <div key={item.id || idx} className="grid grid-cols-12 gap-2 items-center bg-white/5 p-2 rounded-xl">
                                        <div className="col-span-5">
                                            <select
                                                required
                                                value={item.productId}
                                                onChange={(e) => updateEditItem(item.id, 'productId', e.target.value)}
                                                className="w-full p-2 bg-slate-950 text-white border border-white/10 rounded-lg text-xs"
                                            >
                                                <option value="">Dooro Product...</option>
                                                {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.inStock} in stock)</option>)}
                                            </select>
                                        </div>
                                        <div className="col-span-3">
                                            <input
                                                type="number"
                                                min="1"
                                                required
                                                placeholder="Tirada"
                                                value={item.quantity}
                                                onChange={(e) => updateEditItem(item.id, 'quantity', e.target.value)}
                                                className="w-full p-2 bg-slate-950 text-white border border-white/10 rounded-lg text-xs"
                                            />
                                        </div>
                                        <div className="col-span-3">
                                            <input
                                                type="number"
                                                min="0"
                                                step="any"
                                                required
                                                placeholder="Qiimaha"
                                                value={item.unitPrice}
                                                onChange={(e) => updateEditItem(item.id, 'unitPrice', e.target.value)}
                                                className="w-full p-2 bg-slate-950 text-white border border-white/10 rounded-lg text-xs"
                                            />
                                        </div>
                                        <div className="col-span-1 text-center">
                                            {editItems.length > 1 && (
                                                <button type="button" onClick={() => removeEditItem(item.id)} className="text-rose-400 p-1">
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-[10px] uppercase font-black text-slate-400 mb-1">Nooca Lacag Bixinta</label>
                                    <select
                                        value={editPaymentMethod}
                                        onChange={(e) => setEditPaymentMethod(e.target.value)}
                                        className="w-full p-3 bg-slate-950 text-white border border-white/15 rounded-xl outline-none focus:border-emerald-400"
                                    >
                                        <option value="CASH">CASH (Lacag Naqd ah)</option>
                                        <option value="BANK_TRANSFER">BANK TRANSFER (E-Birr/Bank)</option>
                                        <option value="CREDIT">CREDIT (Dayn Buuxda)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase font-black text-slate-400 mb-1">Account-ka Lacagta</label>
                                    <select
                                        disabled={editPaymentMethod === 'CREDIT'}
                                        value={editAccountId}
                                        onChange={(e) => setEditAccountId(e.target.value)}
                                        className="w-full p-3 bg-slate-950 text-white border border-white/15 rounded-xl outline-none focus:border-emerald-400 disabled:opacity-40"
                                    >
                                        <option value="">Dooro Account...</option>
                                        {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase font-black text-slate-400 mb-1">Lacagta La Bixiyay (ETB)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="any"
                                        disabled={editPaymentMethod === 'CASH' || editPaymentMethod === 'CREDIT'}
                                        value={editPaidAmount}
                                        onChange={(e) => setEditPaidAmount(Number(e.target.value))}
                                        className="w-full p-3 bg-slate-950 text-white border border-white/15 rounded-xl outline-none focus:border-emerald-400 disabled:opacity-40"
                                    />
                                </div>
                            </div>

                            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex justify-between items-center text-xs">
                                <span className="font-bold text-slate-300">Wadarta Guud ee Cusub:</span>
                                <span className="text-base font-black text-emerald-400">{editGrandTotal.toLocaleString()} ETB</span>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-white/10">
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
                                    className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-emerald-600/30"
                                >
                                    {savingEdit ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                                    <span>Kaydi Isbeddelada</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* DELETE CONFIRMATION MODAL */}
            {deletingId && (
                <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-slate-900 border border-rose-500/30 text-white rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 text-center">
                        <div className="p-4 rounded-full bg-rose-500/20 text-rose-400 w-fit mx-auto border border-rose-500/30">
                            <AlertTriangle size={32} />
                        </div>
                        <h3 className="text-base font-black uppercase tracking-wider text-white">Ma ziido run baa in aad tirtirto Iibkan?</h3>
                        <p className="text-xs text-slate-300 font-medium leading-relaxed">
                            Markaad tirtirto iibkan, dhammaan alaabta stock-ga laga jaray wuu **soo noqonayaa (increment)**, lacagta koontada ka jarantayna waa la **debiti-garaynayaa**.
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
                                onClick={() => handleDeleteSale(deletingId)}
                                className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-rose-600/30"
                            >
                                {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                <span>Oo Tirtir</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {toast && (
                <div className={`fixed bottom-6 right-6 z-50 px-6 py-4 rounded-2xl shadow-2xl text-xs font-black uppercase tracking-wider flex items-center gap-3 border ${
                    toast.type === 'success' ? 'bg-emerald-950 border-emerald-500 text-emerald-200' : 'bg-rose-950 border-rose-500 text-rose-200'
                }`}>
                    {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                    <span>{toast.message}</span>
                </div>
            )}
        </div>
    );
}
