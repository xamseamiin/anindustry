'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
    Shield, Search, Calendar, User as UserIcon, 
    Activity, Clock, ArrowLeft,
    Loader2, AlertCircle, RefreshCcw, Download,
    Database, Terminal
} from 'lucide-react';

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [total, setTotal] = useState(0);

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/manufacturing/audit?limit=100');
            if (res.ok) {
                const data = await res.json();
                setLogs(data.logs || []);
                setTotal(data.total || 0);
            }
        } catch (error) {
            console.error("Failed to load logs", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const filteredLogs = logs.filter(log => {
        const search = searchTerm.toLowerCase();
        return (
            (log.action?.toLowerCase().includes(search)) ||
            (log.entity?.toLowerCase().includes(search)) ||
            (log.details?.toLowerCase().includes(search)) ||
            (log.user?.fullName?.toLowerCase().includes(search))
        );
    });

    const getActionColor = (action: string) => {
        const act = action || '';
        if (act.includes('CREATE')) return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
        if (act.includes('DELETE')) return 'bg-rose-500/10 text-rose-600 border-rose-500/20';
        if (act.includes('UPDATE')) return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
        if (act.includes('COMPLETE')) return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
        return 'bg-slate-500/10 text-slate-600 border-slate-500/20';
    };

    return (
        <div className="flex flex-col gap-6 p-4 lg:p-6 min-h-screen pb-20 bg-slate-50/50">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/manufacturing" className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-200 text-slate-500 hover:text-blue-600 transition-all">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <Shield className="text-blue-600" size={32} />
                            Security Audit Logs
                        </h1>
                        <p className="text-sm text-slate-500 font-medium">Immutable record of all system activities.</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button onClick={fetchLogs} className="flex-1 md:flex-none px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 text-sm shadow-sm flex items-center justify-center gap-2 hover:bg-slate-50 transition-all">
                        {loading ? <Loader2 size={18} className="animate-spin" /> : <RefreshCcw size={18} />}
                        Sync
                    </button>
                    <button className="flex-1 md:flex-none px-4 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm shadow-lg flex items-center justify-center gap-2 hover:bg-slate-800 transition-all">
                        <Download size={18} />
                        Export
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-white/60 backdrop-blur-xl p-6 rounded-3xl border border-white shadow-xl flex items-center gap-5">
                    <div className="p-4 bg-blue-500/10 text-blue-600 rounded-2xl">
                        <Activity size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Activities</p>
                        <p className="text-2xl font-black text-slate-900 leading-none mt-1">{Number(total || 0).toLocaleString()}</p>
                    </div>
                </div>
                <div className="bg-white/60 backdrop-blur-xl p-6 rounded-3xl border border-white shadow-xl flex items-center gap-5">
                    <div className="p-4 bg-emerald-500/10 text-emerald-600 rounded-2xl">
                        <Database size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Storage Status</p>
                        <p className="text-2xl font-black text-slate-900 leading-none mt-1 text-emerald-600 italic font-serif tracking-widest">ENCRYPTED</p>
                    </div>
                </div>
                <div className="bg-white/60 backdrop-blur-xl p-6 rounded-3xl border border-white shadow-xl flex items-center gap-5">
                    <div className="p-4 bg-purple-500/10 text-purple-600 rounded-2xl">
                        <Terminal size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Integrity Check</p>
                        <p className="text-2xl font-black text-slate-900 leading-none mt-1 text-purple-600">VERIFIED</p>
                    </div>
                </div>
            </div>

            {/* Main Log Table */}
            <div className="bg-white/40 backdrop-blur-2xl rounded-[2.5rem] border border-white/40 shadow-2xl overflow-hidden flex flex-col min-h-[500px]">
                {/* Toolbar */}
                <div className="p-6 border-b border-white/40 flex flex-col md:flex-row gap-4 justify-between items-center bg-white/20">
                    <div className="relative w-full md:max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by user, action, or details..."
                            className="w-full pl-12 pr-4 py-3 bg-white/60 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all placeholder:text-slate-400"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Live Monitoring Active
                        </div>
                    </div>
                </div>

                {/* Table Content */}
                <div className="overflow-x-auto flex-1">
                    {loading ? (
                        <div className="p-20 flex flex-col items-center justify-center gap-4">
                            <Loader2 size={40} className="animate-spin text-blue-500" />
                            <p className="text-sm font-bold text-slate-400 animate-pulse uppercase tracking-widest">Decrypting Logs...</p>
                        </div>
                    ) : filteredLogs.length === 0 ? (
                        <div className="p-20 flex flex-col items-center justify-center gap-4 text-slate-400">
                            <AlertCircle size={48} className="opacity-20" />
                            <p className="font-bold">No activity logs found for this search.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-[10px] uppercase text-slate-400 font-black tracking-[0.2em] border-b border-slate-100 bg-slate-50/30">
                                    <th className="p-6 pl-10">User & Timestamp</th>
                                    <th className="p-6">Action Type</th>
                                    <th className="p-6">Entity Involved</th>
                                    <th className="p-6">Faahfaahinta / Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredLogs.map((log) => (
                                    <tr key={log.id} className="group hover:bg-blue-50/50 transition-all duration-300">
                                        <td className="p-6 pl-10">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-black text-xs uppercase overflow-hidden border-2 border-white shadow-sm">
                                                    {log.user?.fullName?.slice(0, 2) || '??'}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-900 leading-none">{log.user?.fullName || 'Unknown User'}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 mt-1.5 flex items-center gap-1">
                                                        <Clock size={10} />
                                                        {log.createdAt ? new Date(log.createdAt).toLocaleString() : 'No Date'}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase border tracking-tighter shadow-sm ${getActionColor(log.action)}`}>
                                                {String(log.action || '').replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-black text-slate-700 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200/50 uppercase tracking-tighter">
                                                    {log.entity || 'N/A'}
                                                </span>
                                                {log.entityId && (
                                                    <span className="text-[10px] font-mono text-slate-400">#{log.entityId.slice(0, 8)}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-6 max-w-md">
                                            <p className="text-xs font-bold text-slate-600 leading-relaxed italic border-l-2 border-slate-200 pl-3 group-hover:border-blue-400 transition-colors">
                                                {log.details || 'No additional details.'}
                                            </p>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
