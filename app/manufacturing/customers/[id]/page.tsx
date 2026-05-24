'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import {
    ArrowLeft, Edit, Trash2, Phone, Mail, MapPin,
    Briefcase, Calendar, Clock, Loader2, User, Building,
    Activity, ArrowUpRight, Wallet, ShieldCheck, Box
} from 'lucide-react';
import Toast from '@/components/common/Toast';

export default function ViewCustomerPage() {
    const params = useParams();
    const router = useRouter();
    const customerId = params.id as string;

    const [customer, setCustomer] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        const fetchCustomer = async () => {
            try {
                const response = await fetch(`/api/manufacturing/customers/${customerId}`);
                if (response.ok) {
                    const data = await response.json();
                    setCustomer(data.customer);
                }
            } catch (error) {
                setToast({ message: 'Error fetching customer', type: 'error' });
            } finally {
                setLoading(false);
            }
        };
        if (customerId) fetchCustomer();
    }, [customerId]);

    const handleDelete = async () => {
        if (!confirm('Ma hubtaa inaad tirtirto macaamilkan?')) return;
        try {
            const res = await fetch(`/api/manufacturing/customers/${customerId}`, { method: 'DELETE' });
            if (res.ok) {
                setToast({ message: 'Macaamilka waa la tirtiray!', type: 'success' });
                setTimeout(() => router.push('/manufacturing/customers'), 1500);
            }
        } catch (e) {
            setToast({ message: 'Cilad ayaa dhacday.', type: 'error' });
        }
    };

    if (loading) return (
        <div className="h-screen flex flex-col items-center justify-center gap-4">
            <Loader2 size={40} className="animate-spin text-blue-500" />
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">Syncing Client Portfolio...</p>
        </div>
    );

    if (!customer) return null;

    return (
        <div className="flex flex-col gap-8 p-4 lg:p-8 max-w-[1600px] mx-auto min-h-screen pb-20 bg-slate-50/20">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div className="flex items-center gap-6">
                    <Link href="/manufacturing/customers" className="p-3 bg-white rounded-2xl shadow-sm border border-slate-200 text-slate-500 hover:text-blue-600 transition-all">
                        <ArrowLeft size={24} />
                    </Link>
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-3xl font-black shadow-xl">
                            {customer.name.slice(0, 1)}
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight">{customer.name}</h1>
                            <div className="flex items-center gap-3 mt-1">
                                <span className="px-3 py-1 rounded-lg bg-blue-500/10 text-blue-600 text-[10px] font-black uppercase tracking-widest border border-blue-500/10">
                                    {customer.type || 'Standard Client'}
                                </span>
                                <span className="text-xs font-bold text-slate-400 flex items-center gap-1 italic">
                                    {customer.companyName || 'Private Individual'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3 w-full lg:w-auto">
                    <Link href={`/manufacturing/customers/${customerId}/edit`} className="flex-1 lg:flex-none px-6 py-3 bg-white border border-slate-200 text-slate-900 rounded-xl font-black text-xs uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                        <Edit size={16} /> Edit Profile
                    </Link>
                    <button onClick={handleDelete} className="flex-1 lg:flex-none px-6 py-3 bg-rose-50 text-rose-600 rounded-xl font-black text-xs uppercase tracking-widest border border-rose-100 hover:bg-rose-100 transition-all flex items-center justify-center gap-2">
                        <Trash2 size={16} /> Delete Account
                    </button>
                </div>
            </div>

            {/* Account Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white/60 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white shadow-xl flex items-center gap-6 group hover:scale-[1.02] transition-all">
                    <div className="p-4 bg-blue-500/10 text-blue-600 rounded-2xl group-hover:rotate-12 transition-transform">
                        <Box size={28} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Orders</p>
                        <p className="text-3xl font-black text-slate-900 leading-none mt-1">{customer.productionOrders?.length || 0}</p>
                    </div>
                </div>
                <div className="bg-white/60 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white shadow-xl flex items-center gap-6 group hover:scale-[1.02] transition-all">
                    <div className={`p-4 rounded-2xl group-hover:rotate-12 transition-transform ${customer.totalDebt > 0 ? 'bg-rose-500/10 text-rose-600' : 'bg-emerald-500/10 text-emerald-600'}`}>
                        <Wallet size={28} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Deynta Maqan (Debt)</p>
                        <p className={`text-2xl font-black leading-none mt-1 ${customer.totalDebt > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {customer.totalDebt ? Number(customer.totalDebt).toLocaleString() : 0} ETB
                        </p>
                    </div>
                </div>
                <div className="bg-white/60 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white shadow-xl flex items-center gap-6 group hover:scale-[1.02] transition-all">
                    <div className="p-4 bg-emerald-500/10 text-emerald-600 rounded-2xl group-hover:rotate-12 transition-transform">
                        <ShieldCheck size={28} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Client Status</p>
                        <p className="text-xl font-black text-emerald-600 leading-none mt-2 uppercase tracking-tighter">Verified Partner</p>
                    </div>
                </div>
                <div className="bg-white/60 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white shadow-xl flex items-center gap-6 group hover:scale-[1.02] transition-all">
                    <div className="p-4 bg-amber-500/10 text-amber-600 rounded-2xl group-hover:rotate-12 transition-transform">
                        <Clock size={28} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Member Since</p>
                        <p className="text-xl font-black text-slate-900 leading-none mt-2">
                            {new Date(customer.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Information Sidebar */}
                <div className="space-y-6">
                    <div className="bg-white/60 backdrop-blur-3xl rounded-[3rem] border border-white shadow-2xl p-8 space-y-8">
                        <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                            Engagement Details
                        </h3>
                        
                        <div className="space-y-6">
                            {[
                                { label: 'Primary Phone', value: customer.phone || 'Not Shared', icon: <Phone size={16} /> },
                                { label: 'Email Address', value: customer.email || 'No Email', icon: <Mail size={16} /> },
                                { label: 'Business Address', value: customer.address || 'Field Location', icon: <MapPin size={16} /> },
                                { label: 'Liaison Person', value: customer.contactPerson || 'Direct Client', icon: <User size={16} /> },
                            ].map((item, i) => (
                                <div key={i} className="flex items-start gap-4">
                                    <div className="p-2 bg-slate-100 rounded-xl text-slate-400">{item.icon}</div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</p>
                                        <p className="text-sm font-black text-slate-800">{item.value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-slate-900 p-8 rounded-[3rem] shadow-2xl text-white">
                        <h3 className="text-xl font-black mb-4 flex items-center gap-3">
                            <Activity className="text-blue-500" /> Account Notes
                        </h3>
                        <p className="text-slate-400 text-sm font-bold leading-relaxed italic">
                            {customer.notes || 'No special requirements or notes documented for this account.'}
                        </p>
                    </div>
                </div>

                {/* Production History */}
                <div className="lg:col-span-2">
                    <div className="bg-white/40 backdrop-blur-3xl rounded-[3rem] border border-white shadow-2xl overflow-hidden min-h-[500px]">
                        <div className="p-8 border-b border-white/40 bg-white/20 flex justify-between items-center">
                            <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                                <Briefcase className="text-blue-600" /> Order History
                            </h3>
                            <Link href="/manufacturing/production-orders" className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] hover:underline">
                                Full History
                            </Link>
                        </div>
                        
                        <div className="p-8">
                            {(!customer.productionOrders || customer.productionOrders.length === 0) ? (
                                <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-4">
                                    <Box size={64} className="opacity-10" />
                                    <p className="font-bold">No production records found.</p>
                                    <Link href="/manufacturing/production-orders/add" className="text-blue-600 font-bold hover:underline">Initiate New Production</Link>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {customer.productionOrders.map((order: any) => (
                                        <div key={order.id} className="group p-6 bg-white/60 rounded-[2rem] border border-white shadow-sm hover:shadow-xl hover:scale-[1.01] transition-all flex items-center justify-between">
                                            <div className="flex items-center gap-6">
                                                <div className={`p-4 rounded-2xl ${order.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-blue-500/10 text-blue-600'} transition-transform group-hover:rotate-6`}>
                                                    <Box size={24} />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-3">
                                                        <p className="text-lg font-black text-slate-900 leading-none tracking-tight">{order.orderNumber}</p>
                                                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${order.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                                            {order.status}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs font-bold text-slate-500 mt-2">{order.productName} • {order.quantity} units</p>
                                                </div>
                                            </div>
                                            <div className="text-right flex items-center gap-6">
                                                <div>
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Due Date</p>
                                                    <p className="text-sm font-black text-slate-800">{order.dueDate ? new Date(order.dueDate).toLocaleDateString() : 'N/A'}</p>
                                                </div>
                                                <Link href={`/manufacturing/production-orders/${order.id}`} className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:text-blue-600 transition-all">
                                                    <ArrowUpRight size={20} />
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}
