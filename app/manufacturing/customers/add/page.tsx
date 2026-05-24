'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
    ArrowLeft, Save, Loader2, User, Building, Phone, Mail, 
    MapPin, FileText, CheckCircle2, AlertCircle, Briefcase, Users
} from 'lucide-react';
import Toast from '@/components/common/Toast';

export default function NewCustomerPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (!formData.name) {
            setToast({ message: 'Fadlan geli magaca macaamilka.', type: 'error' });
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/manufacturing/customers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!response.ok) throw new Error('Failed to create customer');

            setToast({ message: 'Macaamilka si guul leh ayaa loo daray!', type: 'success' });
            setTimeout(() => router.push('/manufacturing/customers'), 1500);

        } catch (error) {
            setToast({ message: 'Cilad ayaa dhacday.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/40 transition-all";

    return (
        <div className="flex flex-col gap-8 p-4 lg:p-8 max-w-5xl mx-auto min-h-screen pb-20 bg-slate-50/30">
            {/* Header */}
            <div className="flex items-center gap-6">
                <Link href="/manufacturing/customers" className="p-3 bg-white rounded-2xl shadow-sm border border-slate-200 text-slate-500 hover:text-blue-600 transition-all hover:scale-105 active:scale-95">
                    <ArrowLeft size={24} />
                </Link>
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Users className="text-blue-600" size={32} />
                        Onboard Client
                    </h1>
                    <p className="text-slate-500 font-medium text-sm">Register a new manufacturing partner or client.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Identity & Category */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white/60 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white shadow-2xl space-y-8">
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                            <div className="p-2 bg-blue-500/10 text-blue-600 rounded-xl"><Building size={20} /></div>
                            <h3 className="text-xl font-black text-slate-900">Legal Identity</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Client Name *</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Som-Industries Ltd"
                                    className={inputClass}
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Company / Brand Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. SI Group"
                                    className={inputClass}
                                    value={formData.companyName}
                                    onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Engagement Type</label>
                            <select
                                className={inputClass}
                                value={formData.type}
                                onChange={(e) => setFormData({...formData, type: e.target.value})}
                            >
                                <option value="Business">B2B Corporate Client</option>
                                <option value="Individual">Private Individual</option>
                                <option value="Distributor">Regional Distributor</option>
                                <option value="Government">Government Agency</option>
                            </select>
                        </div>
                    </div>

                    <div className="bg-white/60 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white shadow-2xl space-y-8">
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                            <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-xl"><Phone size={20} /></div>
                            <h3 className="text-xl font-black text-slate-900">Contact Channels</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Primary Phone</label>
                                <input
                                    type="tel"
                                    placeholder="+252..."
                                    className={inputClass}
                                    value={formData.phone}
                                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                                <input
                                    type="email"
                                    placeholder="client@example.com"
                                    className={inputClass}
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Logistics & Actions */}
                <div className="space-y-6">
                    <div className="bg-white/60 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white shadow-2xl space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-500/10 text-purple-600 rounded-xl"><MapPin size={20} /></div>
                            <h3 className="text-xl font-black text-slate-900">Address</h3>
                        </div>
                        <textarea
                            placeholder="Primary delivery or billing address..."
                            className={`${inputClass} min-h-[100px] resize-none`}
                            value={formData.address}
                            onChange={(e) => setFormData({...formData, address: e.target.value})}
                        />
                    </div>

                    <div className="bg-slate-900 p-8 rounded-[3rem] shadow-2xl text-white space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/10 rounded-xl"><FileText size={20} /></div>
                            <h3 className="text-xl font-black">Admin Notes</h3>
                        </div>
                        <textarea
                            placeholder="Internal account briefing or specific requirements..."
                            className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white outline-none focus:bg-white/10 transition-all min-h-[150px] resize-none"
                            value={formData.notes}
                            onChange={(e) => setFormData({...formData, notes: e.target.value})}
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-blue-600/30 transition-all flex items-center justify-center gap-3"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                            {loading ? 'Processing...' : 'Register Client'}
                        </button>
                    </div>
                </div>
            </form>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}
