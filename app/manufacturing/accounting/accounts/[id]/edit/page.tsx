// app/manufacturing/accounting/accounts/[id]/edit/page.tsx - Premium Edit Account Page
'use client';

import React, { useState, useEffect } from 'react';
import { 
    ArrowLeft, 
    Loader2, 
    Save, 
    Building2, 
    Wallet,
    Info
} from 'lucide-react';

export default function EditAccountPage({ params }: { params: { id: string } }) {
    const { id } = params;
    const [name, setName] = useState('');
    const [type, setType] = useState('Bank');
    const [balance, setBalance] = useState('0');
    const [currency, setCurrency] = useState('ETB');
    const [description, setDescription] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const fetchAccount = async () => {
            try {
                const res = await fetch(`/api/manufacturing/accounting/accounts/${id}`);
                if (res.ok) {
                    const data = await res.json();
                    const acc = data.account;
                    setName(acc.name);
                    setType(acc.type);
                    setBalance(acc.balance.toString());
                    setCurrency(acc.currency);
                    setDescription(acc.description || '');
                    setIsActive(acc.isActive);
                } else {
                    setError('Koontada lama heli karo.');
                }
            } catch (err) {
                console.error(err);
                setError('Cilad ayaa dhacday inta xogta la keenayey.');
            } finally {
                setLoading(false);
            }
        };
        fetchAccount();
    }, [id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            setError('Fadlan geli magaca koontada (Account Name)');
            return;
        }

        setSaving(true);
        setError('');
        setSuccess('');

        try {
            const res = await fetch(`/api/manufacturing/accounting/accounts/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    type,
                    balance: parseFloat(balance) || 0,
                    currency,
                    description,
                    isActive
                })
            });

            const data = await res.json();
            if (res.ok) {
                setSuccess('Wax ka bedelka waa la kaydiyey si guul leh!');
                setTimeout(() => {
                    window.location.href = `/manufacturing/accounting/accounts/${id}`;
                }, 1500);
            } else {
                setError(data.message || 'Cilad ayaa dhacday inta lagu guda jiray kaydinta.');
            }
        } catch (err) {
            console.error(err);
            setError('Kumbuyuutarku ma awoodo inuu la xiriiro server-ka.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="animate-spin text-primary" size={48} />
                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Loading Account Settings...</p>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
            {/* Back Navigation & Title */}
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => window.location.href = `/manufacturing/accounting/accounts/${id}`}
                    className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors group"
                >
                    <ArrowLeft size={20} className="text-slate-700 dark:text-slate-300 group-hover:-translate-x-1 transition-transform" />
                </button>
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Wax ka beddel Koontada</h1>
                    <p className="text-slate-500 font-bold text-sm">Wax ka beddel xogta koontada: {name}</p>
                </div>
            </div>

            {/* Foomka Card-ka */}
            <div className="card p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Error & Success Messages */}
                    {error && (
                        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold flex items-center gap-3">
                            <Info size={16} />
                            <span>{error}</span>
                        </div>
                    )}
                    {success && (
                        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-bold flex items-center gap-3">
                            <Info size={16} />
                            <span>{success}</span>
                        </div>
                    )}

                    {/* Account Type Selector */}
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            type="button"
                            onClick={() => setType('Bank')}
                            className={`p-5 rounded-2xl border-2 text-left transition-all flex flex-col gap-3 ${
                                type === 'Bank' 
                                ? 'border-primary bg-primary/5 text-primary' 
                                : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-500 dark:text-slate-400'
                            }`}
                        >
                            <Building2 size={24} />
                            <div>
                                <p className="font-black text-sm tracking-tight">Xisaab Bank (Bank Account)</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Sida CBE, Awash, iwm.</p>
                            </div>
                        </button>

                        <button
                            type="button"
                            onClick={() => setType('Cash')}
                            className={`p-5 rounded-2xl border-2 text-left transition-all flex flex-col gap-3 ${
                                type === 'Cash' 
                                ? 'border-primary bg-primary/5 text-primary' 
                                : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-500 dark:text-slate-400'
                            }`}
                        >
                            <Wallet size={24} />
                            <div>
                                <p className="font-black text-sm tracking-tight">Khasnad / Cash Box</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Petty Cash, Safe Box, iwm.</p>
                            </div>
                        </button>
                    </div>

                    {/* Form Fields */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-black uppercase text-slate-400 tracking-wider mb-2">Magaca Koontada (Account Name)</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm font-bold focus:outline-none focus:border-primary transition-colors"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-black uppercase text-slate-400 tracking-wider mb-2">Balance</label>
                                <input
                                    type="number"
                                    step="any"
                                    value={balance}
                                    onChange={(e) => setBalance(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm font-bold focus:outline-none focus:border-primary transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-black uppercase text-slate-400 tracking-wider mb-2">Nooca Lacagta (Currency)</label>
                                <select
                                    value={currency}
                                    onChange={(e) => setCurrency(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm font-bold focus:outline-none focus:border-primary transition-colors"
                                >
                                    <option value="ETB">ETB (Ethiopian Birr)</option>
                                    <option value="USD">USD (US Dollar)</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-black uppercase text-slate-400 tracking-wider mb-2 font-bold mb-2">Xaaladda Koontada (Status)</label>
                            <select
                                value={isActive ? 'Active' : 'Inactive'}
                                onChange={(e) => setIsActive(e.target.value === 'Active')}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm font-bold focus:outline-none focus:border-primary transition-colors"
                            >
                                <option value="Active">Kani waa mid Shaqaynaya (Active)</option>
                                <option value="Inactive">Kani ma Shaqaynayo (Inactive)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-black uppercase text-slate-400 tracking-wider mb-2">Faahfaahin / Xog Dheeri ah</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={4}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm font-bold focus:outline-none focus:border-primary transition-colors"
                            />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <button
                            type="button"
                            onClick={() => window.location.href = `/manufacturing/accounting/accounts/${id}`}
                            className="px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 transition-colors"
                        >
                            Ka noqo
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 disabled:opacity-55 transition-colors"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="animate-spin" size={16} /> Kaydinaya...
                                </>
                            ) : (
                                <>
                                    <Save size={16} /> Kaydi Isbeddelada
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
