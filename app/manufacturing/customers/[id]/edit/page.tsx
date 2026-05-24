'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { 
    ArrowLeft, Save, Loader2, User, Building, Phone, Mail, 
    MapPin, FileText, CheckCircle2, AlertCircle, RefreshCcw, Edit3
} from 'lucide-react';
import Toast from '@/components/common/Toast';

export default function EditCustomerPage() {
    const router = useRouter();
    const params = useParams();
    const customerId = params.id as string;

    const [loading, setLoading] = useState(false);
    const [dataLoading, setDataLoading] = useState(true);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        companyName: '',
        email: '',
        phone: '',
        address: '',
        type: 'Business',
        contactPerson: '',
        notes: ''
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(`/api/manufacturing/customers/${customerId}`);
                if (res.ok) {
                    const data = await res.json();
                    const c = data.customer;
                    setFormData({
                        name: c.name || '',
                        companyName: c.companyName || '',
                        email: c.email || '',
                        phone: c.phone || '',
                        address: c.address || '',
                        type: c.type || 'Business',
                        contactPerson: c.contactPerson || '',
                        notes: c.notes || ''
                    });
                }
            } catch (e) {
                setToast({ message: 'Failed to load customer data', type: 'error' });
            } finally {
                setDataLoading(false);
            }
        };
        if (customerId) fetchData();
    }, [customerId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch(`/api/manufacturing/customers/${customerId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!response.ok) throw new Error('Failed to update customer');

            setToast({ message: 'Macaamilka si guul leh ayaa loo cusboonaysiiyay!', type: 'success' });
            setTimeout(() => router.push(`/manufacturing/customers/${customerId}`), 1500);

        } catch (error) {
            setToast({ message: 'Cilad ayaa dhacday.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/40 transition-all";

    if (dataLoading) return (
        <div className="h-screen flex flex-col items-center justify-center gap-4 text-slate-400 font-black">
            <Loader2 size={40} className="animate-spin text-blue-500" />
            <p className="text-xs uppercase tracking-widest animate-pulse">Retreiving Account Data...</p>
        </div>
    );

    return (
        <div className="flex flex-col gap-8 p-4 lg:p-8 max-w-5xl mx-auto min-h-screen pb-20 bg-slate-50/20">
            {/* Header */}
            <div className="flex items-center gap-6">
                <button onClick={() => router.back()} className="p-3 bg-white rounded-2xl shadow-sm border border-slate-200 text-slate-500 hover:text-blue-600 transition-all">
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Edit3 className="text-blue-600" size={32} />
                        Modify Client
                    </h1>
                    <p className="text-slate-500 font-medium">Updating profile for <span className="text-blue-600 font-black">{formData.name}</span></p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Info Sections */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white/60 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white shadow-2xl space-y-8">
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                            <div className="p-2 bg-blue-500/10 text-blue-600 rounded-xl"><Building size={20} /></div>
                            <h3 className="text-xl font-black text-slate-900">Account Identity</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name / Title</label>
                                <input
                                    type="text"
                                    className={inputClass}
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Company / Organization</label>
                                <input
                                    type="text"
                                    className={inputClass}
                                    value={formData.companyName}
                                    onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Customer Classification</label>
                            <select
                                className={inputClass}
                                value={formData.type}
                                onChange={(e) => setFormData({...formData, type: e.target.value})}
                            >
                                <option value="Business">Business (B2B)</option>
                                <option value="Individual">Individual (B2C)</option>
                                <option value="Distributor">Wholesale Distributor</option>
                                <option value="Government">Government Entity</option>
                            </select>
                        </div>
                    </div>

                    <div className="bg-white/60 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white shadow-2xl space-y-8">
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                            <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-xl"><Phone size={20} /></div>
                            <h3 className="text-xl font-black text-slate-900">Contact Interface</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Primary Phone</label>
                                <input
                                    type="tel"
                                    className={inputClass}
                                    value={formData.phone}
                                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email System</label>
                                <input
                                    type="email"
                                    className={inputClass}
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Actions & Notes */}
                <div className="space-y-6">
                    <div className="bg-white/60 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white shadow-2xl space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-500/10 text-purple-600 rounded-xl"><MapPin size={20} /></div>
                            <h3 className="text-xl font-black text-slate-900">Logistic Hub</h3>
                        </div>
                        <textarea
                            className={`${inputClass} min-h-[100px] resize-none`}
                            value={formData.address}
                            onChange={(e) => setFormData({...formData, address: e.target.value})}
                        />
                    </div>

                    <div className="bg-slate-900 p-8 rounded-[3rem] shadow-2xl text-white space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/10 rounded-xl"><FileText size={20} /></div>
                            <h3 className="text-xl font-black">Strategic Notes</h3>
                        </div>
                        <textarea
                            className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white outline-none focus:bg-white/10 transition-all min-h-[150px] resize-none"
                            value={formData.notes}
                            onChange={(e) => setFormData({...formData, notes: e.target.value})}
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-blue-600/30 transition-all flex items-center justify-center gap-3"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <RefreshCcw size={20} />}
                            {loading ? 'Processing...' : 'Sync Profile'}
                        </button>
                    </div>
                </div>
            </form>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}
