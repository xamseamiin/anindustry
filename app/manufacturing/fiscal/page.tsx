'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
    Lock, Unlock, Calendar, CheckCircle2, 
    AlertCircle, Loader2, RefreshCcw, ArrowLeft,
    Plus, History, Briefcase, FileText
} from 'lucide-react';
import Toast from '@/components/common/Toast';

export default function FiscalControlPage() {
    const [periods, setPeriods] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // New Period Form
    const [showAddForm, setShowAddForm] = useState(false);
    const [newPeriod, setNewPeriod] = useState({
        name: '',
        startDate: '',
        endDate: ''
    });

    const fetchPeriods = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/manufacturing/fiscal');
            if (res.ok) {
                const data = await res.json();
                setPeriods(data.periods || []);
            }
        } catch (error) {
            console.error("Failed to load periods", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPeriods();
    }, []);

    const handleTogglePeriod = async (period: any) => {
        setActionLoading(period.id);
        try {
            const res = await fetch('/api/manufacturing/fiscal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: period.name,
                    isClosed: !period.isClosed
                })
            });

            if (res.ok) {
                setToast({ 
                    message: `Muddada ${period.name} waa la ${!period.isClosed ? 'xiray' : 'furay'}!`, 
                    type: 'success' 
                });
                fetchPeriods();
            } else {
                setToast({ message: 'Waa laga helay cilad. Fadlan isku day mar kale.', type: 'error' });
            }
        } catch (error) {
            setToast({ message: 'Error updating period', type: 'error' });
        } finally {
            setActionLoading(null);
        }
    };

    const handleCreatePeriod = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/manufacturing/fiscal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newPeriod,
                    isClosed: false
                })
            });

            if (res.ok) {
                setToast({ message: 'Muddada cusub waa la abuuray!', type: 'success' });
                setShowAddForm(false);
                setNewPeriod({ name: '', startDate: '', endDate: '' });
                fetchPeriods();
            } else {
                setToast({ message: 'Failed to create period', type: 'error' });
            }
        } catch (error) {
            setToast({ message: 'Error creating period', type: 'error' });
        }
    };

    return (
        <div className="flex flex-col gap-6 p-4 lg:p-6 min-h-screen pb-20 bg-slate-50/50">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/manufacturing/reports" className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-200 text-slate-500 hover:text-blue-600 transition-all">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <Briefcase className="text-blue-600" size={32} />
                            Fiscal Control
                        </h1>
                        <p className="text-sm text-slate-500 font-medium">Manage reporting periods and data integrity.</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button onClick={fetchPeriods} className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 shadow-sm transition-all">
                        <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button 
                        onClick={() => setShowAddForm(true)}
                        className="flex-1 md:flex-none px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm shadow-lg flex items-center justify-center gap-2 hover:bg-slate-800 transition-all"
                    >
                        <Plus size={18} />
                        New Period
                    </button>
                </div>
            </div>

            {/* Warning Banner */}
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-4">
                <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                    <AlertCircle size={20} />
                </div>
                <div>
                    <h3 className="text-sm font-black text-amber-900">Important: Period Locking</h3>
                    <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                        Closing a fiscal period prevents any modifications to sales and expenses within that date range. 
                        Ensure all reconciliations are complete before closing.
                    </p>
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left: Active/Recent Periods */}
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 px-2">
                        <History size={20} className="text-slate-400" />
                        Reporting Cycles
                    </h2>

                    {loading ? (
                        <div className="bg-white/40 p-20 rounded-3xl border border-white flex flex-col items-center justify-center gap-4">
                            <Loader2 size={32} className="animate-spin text-blue-500" />
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Loading Fiscal Data...</p>
                        </div>
                    ) : periods.length === 0 ? (
                        <div className="bg-white/40 p-20 rounded-3xl border border-white flex flex-col items-center justify-center gap-4 text-slate-400">
                            <Calendar size={48} className="opacity-20" />
                            <p className="font-bold">No fiscal periods defined yet.</p>
                            <button onClick={() => setShowAddForm(true)} className="text-blue-600 font-bold hover:underline">Setup your first month</button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {periods.map((period) => (
                                <div key={period.id} className="bg-white/60 backdrop-blur-xl p-6 rounded-3xl border border-white shadow-xl hover:shadow-2xl transition-all group">
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                        <div className="flex items-center gap-5">
                                            <div className={`p-4 rounded-2xl ${period.isClosed ? 'bg-slate-100 text-slate-400' : 'bg-emerald-500/10 text-emerald-600'}`}>
                                                {period.isClosed ? <Lock size={24} /> : <Unlock size={24} />}
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black text-slate-900 leading-none">{period.name}</h3>
                                                <p className="text-xs font-bold text-slate-400 mt-2 flex items-center gap-1 uppercase tracking-widest">
                                                    {new Date(period.startDate).toLocaleDateString()} — {new Date(period.endDate).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 w-full md:w-auto">
                                            <div className="flex-1 md:flex-none">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-right mb-1.5">Status</p>
                                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter border flex items-center justify-center gap-2 ${
                                                    period.isClosed ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                                }`}>
                                                    {period.isClosed ? 'LOCKED' : 'ACTIVE / OPEN'}
                                                </span>
                                            </div>
                                            <button 
                                                disabled={actionLoading === period.id}
                                                onClick={() => handleTogglePeriod(period)}
                                                className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase transition-all shadow-lg ${
                                                    period.isClosed 
                                                    ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-500/20' 
                                                    : 'bg-rose-500 text-white hover:bg-rose-600 shadow-rose-500/20'
                                                } disabled:opacity-50`}
                                            >
                                                {actionLoading === period.id ? <Loader2 size={16} className="animate-spin" /> : (period.isClosed ? 'Open Period' : 'Close Period')}
                                            </button>
                                        </div>
                                    </div>
                                    
                                    {period.isClosed && (
                                        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-400 italic">
                                            <p>Period closed by: {period.closedBy?.fullName || 'System'}</p>
                                            <p>Timestamp: {new Date(period.closedAt).toLocaleString()}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right: Setup / Configuration */}
                <div className="space-y-6">
                    {showAddForm ? (
                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-2xl animate-in slide-in-from-right-4">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-black text-slate-900">Setup Period</h3>
                                <button onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-slate-600 font-bold">Cancel</button>
                            </div>
                            <form onSubmit={handleCreatePeriod} className="space-y-5">
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Period Name</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. May 2026"
                                        required
                                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        value={newPeriod.name}
                                        onChange={e => setNewPeriod({...newPeriod, name: e.target.value})}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Start Date</label>
                                        <input 
                                            type="date" 
                                            required
                                            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none"
                                            value={newPeriod.startDate}
                                            onChange={e => setNewPeriod({...newPeriod, startDate: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">End Date</label>
                                        <input 
                                            type="date" 
                                            required
                                            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none"
                                            value={newPeriod.endDate}
                                            onChange={e => setNewPeriod({...newPeriod, endDate: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-500/30 hover:bg-blue-700 transition-all mt-4">
                                    Initialize Reporting Cycle
                                </button>
                            </form>
                        </div>
                    ) : (
                        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-8 text-white shadow-2xl">
                            <FileText size={48} className="mb-6 opacity-40" />
                            <h3 className="text-2xl font-black leading-tight mb-4">Integrity Monitoring</h3>
                            <p className="text-sm text-blue-100 leading-relaxed mb-8 opacity-80 font-medium">
                                Reporting cycles ensure that your monthly financial statements remain accurate and immutable. 
                                Once a month is audited, lock it here.
                            </p>
                            <div className="space-y-4">
                                <div className="p-4 bg-white/10 rounded-2xl border border-white/10 flex items-center gap-3">
                                    <CheckCircle2 size={18} className="text-blue-200" />
                                    <span className="text-xs font-bold">Historical data protected</span>
                                </div>
                                <div className="p-4 bg-white/10 rounded-2xl border border-white/10 flex items-center gap-3">
                                    <CheckCircle2 size={18} className="text-blue-200" />
                                    <span className="text-xs font-bold">Audit-ready reporting</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}
