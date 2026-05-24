'use client';

import React, { useState, useEffect } from 'react';
import { 
    Sparkles, AlertTriangle, Lightbulb, TrendingUp, 
    Bell, ChevronRight, Loader2, RefreshCw, MessageCircle,
    CheckCircle, ExternalLink, Award, Send, X, Users,
    Megaphone, BarChart3, Phone
} from 'lucide-react';

interface Insight {
    id: string;
    type: 'WARNING' | 'ADVICE' | 'PROFIT' | 'REMINDER' | 'MILESTONE';
    title: string;
    content: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    createdAt: string;
}

export default function AiInsightsFeed() {
    const [insights, setInsights] = useState<Insight[]>([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [sendingWA, setSendingWA] = useState<string | null>(null);
    const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set());
    const [showBulk, setShowBulk] = useState(false);
    const [bulkFilter, setBulkFilter] = useState('all-customers');
    const [bulkMessage, setBulkMessage] = useState('');
    const [bulkSending, setBulkSending] = useState(false);
    const [bulkResult, setBulkResult] = useState<any>(null);
    const [sendingReport, setSendingReport] = useState(false);

    const fetchInsights = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const res = await fetch('/api/shop/ai/insights');
            if (res.ok) {
                const data = await res.json();
                setInsights(data);
            }
        } catch (error) {
            console.error('Failed to fetch AI insights:', error);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchInsights();
    }, []);

    const handleWhatsAppSend = async (insight: Insight) => {
        setSendingWA(insight.id);
        try {
            const res = await fetch('/api/shop/ai/whatsapp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'send-report',
                })
            });
            const data = await res.json();
            if (data.success) {
                alert('✅ WhatsApp-ka maamulka ayaa loo diray!');
            } else {
                alert('❌ ' + (data.error || 'Ma dirin karin'));
            }
        } catch (err) {
            alert('❌ Server khalad');
        } finally {
            setSendingWA(null);
        }
    };

    const handleResolve = (id: string) => {
        setResolvedIds(prev => new Set([...prev, id]));
    };

    const handleSendReport = async () => {
        setSendingReport(true);
        try {
            const res = await fetch('/api/shop/ai/whatsapp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'send-report' })
            });
            const data = await res.json();
            if (data.success) {
                alert('📊 Warbixinta maanta WhatsApp-ka ayaa loo diray!');
            } else {
                alert('❌ ' + (data.error || 'Ma dirin karin'));
            }
        } catch (err) {
            alert('❌ Server khalad');
        } finally {
            setSendingReport(false);
        }
    };

    const handleBulkSend = async () => {
        if (!bulkMessage.trim()) return;
        setBulkSending(true);
        setBulkResult(null);
        try {
            const res = await fetch('/api/shop/ai/whatsapp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'send-bulk',
                    filter: bulkFilter,
                    message: bulkMessage
                })
            });
            const data = await res.json();
            setBulkResult(data);
        } catch (err) {
            setBulkResult({ error: 'Server khalad' });
        } finally {
            setBulkSending(false);
        }
    };

    const getTypeConfig = (type: string) => {
        switch (type) {
            case 'WARNING':
                return { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20', gradient: 'from-red-500/5 to-red-600/5' };
            case 'ADVICE':
                return { icon: Lightbulb, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20', gradient: 'from-amber-500/5 to-orange-500/5' };
            case 'PROFIT':
                return { icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', gradient: 'from-emerald-500/5 to-green-500/5' };
            case 'MILESTONE':
                return { icon: Award, color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20', gradient: 'from-purple-500/5 to-pink-500/5' };
            default:
                return { icon: Bell, color: 'text-[#3498DB]', bg: 'bg-blue-500/10', border: 'border-blue-500/20', gradient: 'from-blue-500/5 to-cyan-500/5' };
        }
    };

    if (loading) {
        return (
            <div className="bg-white/50 dark:bg-[#1f2937]/30 backdrop-blur-md rounded-[32px] p-8 border border-gray-100 dark:border-white/5 h-[400px] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <Loader2 className="w-10 h-10 animate-spin text-[#3498DB]" />
                        <div className="absolute inset-0 w-10 h-10 rounded-full bg-[#3498DB]/20 animate-ping" />
                    </div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest animate-pulse">AI wuxuu falanqaynayaa ganacsigaaga...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-[#3498DB]/5 to-[#9B59B6]/5 dark:from-[#3498DB]/10 dark:to-[#9B59B6]/10 backdrop-blur-md rounded-[32px] p-6 md:p-8 border border-[#3498DB]/20 relative overflow-hidden">
            <div className="relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Revlo AI Strategy Center</p>
                        <h4 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                            Muraayadda Ganacsiga
                            <Sparkles className="text-amber-400" size={18} />
                        </h4>
                    </div>
                    <button 
                        onClick={() => { setIsRefreshing(true); fetchInsights(true); }}
                        disabled={isRefreshing}
                        className="p-2.5 rounded-xl bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-400 hover:text-[#3498DB] hover:border-[#3498DB]/30 transition-all disabled:opacity-50"
                    >
                        <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
                    </button>
                </div>

                {/* Quick Action Bar */}
                <div className="flex flex-wrap gap-2 mb-6">
                    <button
                        onClick={() => setShowBulk(!showBulk)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-[#1a2236] border border-gray-200 dark:border-gray-800 text-xs font-bold text-gray-700 dark:text-gray-300 hover:border-[#3498DB] hover:text-[#3498DB] transition-all shadow-sm"
                    >
                        <Megaphone size={14} />
                        Fariin Bulk u Dir
                    </button>
                    <button
                        onClick={handleSendReport}
                        disabled={sendingReport}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-[#1a2236] border border-gray-200 dark:border-gray-800 text-xs font-bold text-gray-700 dark:text-gray-300 hover:border-emerald-500 hover:text-emerald-500 transition-all shadow-sm disabled:opacity-50"
                    >
                        {sendingReport ? <Loader2 size={14} className="animate-spin" /> : <BarChart3 size={14} />}
                        Warbixin Maanta
                    </button>
                </div>

                {/* Bulk Message Modal */}
                {showBulk && (
                    <div className="mb-6 p-5 rounded-2xl bg-white dark:bg-[#0f172a] border border-[#3498DB]/30 shadow-lg relative">
                        <button onClick={() => { setShowBulk(false); setBulkResult(null); }} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600">
                            <X size={16} />
                        </button>
                        <h5 className="font-black text-sm text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <Megaphone size={16} className="text-[#3498DB]" />
                            Fariin Bulk ah Dir
                        </h5>
                        
                        <div className="space-y-3">
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Cidda loo dirayo</label>
                                <select 
                                    value={bulkFilter} 
                                    onChange={(e) => setBulkFilter(e.target.value)}
                                    className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1a2236] border border-gray-200 dark:border-gray-800 text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:border-[#3498DB]/50"
                                >
                                    <option value="all-customers">📱 Macaamiisha Oo Dhan</option>
                                    <option value="debtors">💰 Deynlayda Kaliya</option>
                                    <option value="vendors">🚚 Suplayarada</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Fariinta (isticmaal {'{name}'} magaca qofka)</label>
                                <textarea 
                                    value={bulkMessage}
                                    onChange={(e) => setBulkMessage(e.target.value)}
                                    placeholder="Salaan {name}! Waxaan ku ogaysiinayaa..."
                                    rows={3}
                                    className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1a2236] border border-gray-200 dark:border-gray-800 text-sm font-medium text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-[#3498DB]/50 resize-none"
                                />
                            </div>
                            <button
                                onClick={handleBulkSend}
                                disabled={bulkSending || !bulkMessage.trim()}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#3498DB] hover:bg-[#2980B9] text-white text-sm font-bold transition-all disabled:opacity-40 shadow-lg shadow-[#3498DB]/20"
                            >
                                {bulkSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                {bulkSending ? 'Waa la dirayaa...' : 'Dir Hadda'}
                            </button>
                            {bulkResult && (
                                <div className={`p-3 rounded-xl text-sm font-medium ${bulkResult.error ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-600'}`}>
                                    {bulkResult.error ? `❌ ${bulkResult.error}` : `✅ ${bulkResult.sent}/${bulkResult.total} fariin ayaa la diray!`}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Insights Grid */}
                <div className="space-y-3">
                    {insights.length === 0 ? (
                        <div className="py-12 text-center">
                            <p className="text-sm font-medium text-gray-400">Ma jiraan talooyin hadda. AI-gu wali wuxuu baranayaa xogtaada.</p>
                        </div>
                    ) : (
                        insights.filter(i => !resolvedIds.has(i.id)).map((insight) => {
                            const config = getTypeConfig(insight.type);
                            const Icon = config.icon;
                            return (
                                <div 
                                    key={insight.id}
                                    className={`p-4 rounded-2xl bg-gradient-to-r ${config.gradient} dark:from-transparent dark:to-transparent border ${config.border} hover:shadow-md transition-all relative overflow-hidden group`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`p-2.5 rounded-xl bg-white dark:bg-[#0f172a] shadow-sm ${config.color} flex-shrink-0`}>
                                            <Icon size={18} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h5 className="font-black text-sm text-gray-900 dark:text-white truncate">{insight.title}</h5>
                                                {insight.priority === 'HIGH' && (
                                                    <span className="flex h-2 w-2 relative flex-shrink-0">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                                    </span>
                                                )}
                                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                                                    insight.type === 'WARNING' ? 'bg-red-500/15 text-red-500' :
                                                    insight.type === 'ADVICE' ? 'bg-amber-500/15 text-amber-500' :
                                                    insight.type === 'PROFIT' ? 'bg-emerald-500/15 text-emerald-500' :
                                                    insight.type === 'MILESTONE' ? 'bg-purple-500/15 text-purple-500' :
                                                    'bg-blue-500/15 text-blue-500'
                                                } uppercase`}>{insight.type}</span>
                                            </div>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                                                {insight.content}
                                            </p>
                                            
                                            {/* Action Buttons */}
                                            <div className="flex items-center gap-2 mt-3">
                                                <button
                                                    onClick={() => handleWhatsAppSend(insight)}
                                                    disabled={sendingWA === insight.id}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold hover:bg-emerald-500/20 transition-all disabled:opacity-40"
                                                >
                                                    {sendingWA === insight.id ? <Loader2 size={12} className="animate-spin" /> : <Phone size={12} />}
                                                    WhatsApp
                                                </button>
                                                <button
                                                    onClick={() => handleResolve(insight.id)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-500 text-[10px] font-bold hover:bg-gray-200 dark:hover:bg-white/10 transition-all"
                                                >
                                                    <CheckCircle size={12} />
                                                    Qabo
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className={`absolute top-0 right-0 w-1 h-full ${insight.priority === 'HIGH' ? 'bg-red-500' : insight.priority === 'MEDIUM' ? 'bg-amber-400' : 'bg-blue-400'}`} />
                                </div>
                            );
                        })
                    )}
                </div>

                <div className="mt-6 flex justify-center">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest bg-white/50 dark:bg-black/20 px-4 py-1.5 rounded-full border border-gray-100 dark:border-white/5">
                        AI wuxuu cusboonaysiiyaa talooyinka maalin kasta
                    </p>
                </div>
            </div>

            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-[#3498DB]/10 rounded-full blur-[100px]" />
            <div className="absolute -top-20 -left-20 w-64 h-64 bg-[#9B59B6]/10 rounded-full blur-[100px]" />
        </div>
    );
}
