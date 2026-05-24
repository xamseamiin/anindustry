// app/manufacturing/reports/page.tsx - AN-Industory Financial Hub (Glassmorphism)
'use client';

import React, { useState, useEffect } from 'react';
import { 
    DollarSign, TrendingUp, TrendingDown, Wallet, 
    ChevronRight, ArrowUpRight, ArrowDownRight, 
    PieChart, BarChart3, Calendar, Filter, Download,
    Briefcase, Package, RefreshCw
} from 'lucide-react';
import Link from 'next/link';

export default function FinancialHubPage() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        fetch('/api/manufacturing/reports/financials')
            .then(res => res.json())
            .then(d => {
                setData(d);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-emerald-500/5 blur-[100px] animate-pulse" />
                <div className="relative z-10 flex flex-col items-center gap-4">
                    <div className="w-16 h-16 relative">
                        <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20" />
                        <div className="absolute inset-0 rounded-full border-4 border-emerald-600 border-t-transparent animate-spin" />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Calculating Financials...</p>
                </div>
            </div>
        );
    }

    const kpis = data?.kpis || {};

    return (
        <div className="relative min-h-screen">
            {/* Dynamic Financial Background */}
            <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
                <div className="absolute top-[-10%] right-[-5%] w-[45%] h-[45%] bg-emerald-500/10 rounded-full blur-[130px] animate-pulse" />
                <div className="absolute bottom-[-10%] left-[-5%] w-[45%] h-[45%] bg-blue-500/10 rounded-full blur-[130px] animate-pulse" style={{ animationDelay: '3s' }} />
            </div>

            <div className="flex flex-col gap-8 px-8 animate-fade-in max-w-[1700px] mx-auto py-8 relative z-10">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="p-4 bg-white/60 backdrop-blur-xl rounded-2xl shadow-xl border border-white/40 text-emerald-600">
                            <Briefcase size={32} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Accounting Hub</span>
                                <ChevronRight size={10} className="text-slate-400" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Financial Performance</span>
                            </div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Executive Intelligence</h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="px-5 py-3 bg-white/60 backdrop-blur-xl text-slate-600 border border-white/40 rounded-xl font-black text-xs uppercase tracking-widest shadow-sm hover:bg-white transition-all flex items-center gap-2">
                            <Calendar size={16} /> Last 30 Days
                        </button>
                        <button className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-600/30 hover:bg-emerald-700 transition-all flex items-center gap-2">
                            <Download size={18} /> Export Report
                        </button>
                    </div>
                </div>

                {/* KPI Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { title: 'Total Revenue', value: kpis.totalRevenue?.toLocaleString(), sub: 'Lifetime Income', icon: <TrendingUp size={20} />, color: 'emerald', trend: '+12.5%' },
                        { title: 'Total Expenses', value: kpis.totalExpenses?.toLocaleString(), sub: 'COGS & Ops', icon: <TrendingDown size={20} />, color: 'rose', trend: '+4.2%' },
                        { title: 'Net Profit', value: kpis.netProfit?.toLocaleString(), sub: 'After All Costs', icon: <Wallet size={20} />, color: 'blue', trend: '+18.1%' },
                        { title: 'Profit Margin', value: kpis.profitMargin, sub: 'Business Efficiency', icon: <PieChart size={20} />, color: 'amber', trend: 'Healthy' }
                    ].map((stat, idx) => (
                        <div key={idx} className="bg-white/40 backdrop-blur-2xl p-7 rounded-3xl border border-white/40 shadow-xl relative overflow-hidden group">
                            <div className={`absolute top-0 right-0 w-24 h-24 bg-${stat.color}-500/5 rounded-full -mr-8 -mt-8 blur-2xl group-hover:bg-${stat.color}-500/10 transition-all`} />
                            <div className="flex justify-between items-start mb-6">
                                <div className={`p-4 rounded-2xl bg-${stat.color}-500/10 text-${stat.color}-600`}>{stat.icon}</div>
                                <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${stat.color === 'rose' ? 'bg-rose-500/10 text-rose-600' : 'bg-emerald-500/10 text-emerald-600'}`}>
                                    {stat.trend}
                                </span>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{stat.title}</p>
                                <p className="text-3xl font-black text-slate-900 tracking-tight">
                                    {stat.value} {stat.title !== 'Profit Margin' && <span className="text-sm font-bold text-slate-400">ETB</span>}
                                </p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">{stat.sub}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Main Content Sections */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Profitability by Batch Table */}
                    <div className="lg:col-span-2 bg-white/30 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white/50 shadow-2xl overflow-hidden">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h4 className="text-xl font-black text-slate-900 tracking-tight">Batch Profitability</h4>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Real-time Margin Analysis</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="p-2 bg-white/60 rounded-xl hover:bg-white transition-all text-slate-400"><Filter size={18} /></button>
                                <button className="p-2 bg-white/60 rounded-xl hover:bg-white transition-all text-slate-400"><RefreshCw size={18} /></button>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-white/10">
                                        <th className="pb-5">Batch Order</th>
                                        <th className="pb-5">Cost (Agab)</th>
                                        <th className="pb-5">Revenue (Iib)</th>
                                        <th className="pb-5">Profit</th>
                                        <th className="pb-5 text-right">Margin</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {data?.batchProfitability?.map((batch: any) => (
                                        <tr key={batch.id} className="group hover:bg-white/40 transition-all">
                                            <td className="py-5">
                                                <div className="flex flex-col">
                                                    <span className="font-black text-slate-900">{batch.orderNumber}</span>
                                                    <span className="text-[10px] font-bold text-slate-400">{batch.productName}</span>
                                                </div>
                                            </td>
                                            <td className="py-5 font-bold text-slate-600">
                                                {batch.cost?.toLocaleString()} <span className="text-[9px] text-slate-400">ETB</span>
                                            </td>
                                            <td className="py-5 font-bold text-emerald-600">
                                                {batch.revenue?.toLocaleString()} <span className="text-[9px] text-slate-400">ETB</span>
                                            </td>
                                            <td className="py-5">
                                                <div className="flex items-center gap-1">
                                                    <span className="font-black text-slate-900">
                                                        {batch.profit?.toLocaleString()} <span className="text-[9px] text-slate-400">ETB</span>
                                                    </span>
                                                    <ArrowUpRight size={12} className="text-emerald-500" />
                                                </div>
                                            </td>
                                            <td className="py-5 text-right">
                                                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-full text-[10px] font-black">
                                                    {batch.margin}%
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Secondary Insights Column */}
                    <div className="space-y-8">
                        {/* Debt Status Card */}
                        <div className="bg-slate-900/90 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl text-white relative overflow-hidden">
                            <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-rose-500/20 rounded-full blur-3xl" />
                            <div className="flex justify-between items-center mb-8 relative z-10">
                                <div>
                                    <h4 className="text-xl font-black tracking-tight">Outstanding Debt</h4>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Pending Collections</p>
                                </div>
                                <div className="p-3 bg-white/10 rounded-2xl text-rose-400"><Wallet size={24} /></div>
                            </div>
                            <div className="mb-8 relative z-10">
                                <p className="text-4xl font-black tracking-tighter mb-2">{kpis.outstandingDebt?.toLocaleString()} ETB</p>
                                <div className="flex items-center gap-2 text-rose-400 text-xs font-bold">
                                    <ArrowDownRight size={16} />
                                    <span>Requires Collection</span>
                                </div>
                            </div>
                            <Link href="/manufacturing/sales" className="relative z-10 w-full py-4 bg-white/10 hover:bg-white/20 transition-all rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest border border-white/5">
                                View Debtors Hub <ChevronRight size={14} />
                            </Link>
                        </div>

                        {/* Inventory Value Asset Card */}
                        <div className="bg-white/30 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white/50 shadow-2xl">
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h4 className="text-xl font-black text-slate-900 tracking-tight">Asset Value</h4>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Inventory on Hand</p>
                                </div>
                                <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-600"><Package size={24} /></div>
                            </div>
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-slate-500">Raw Materials</span>
                                    <span className="text-sm font-black text-slate-900">12,450 <span className="text-[9px] text-slate-400">ETB</span></span>
                                </div>
                                <div className="w-full h-1.5 bg-white/40 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 w-[65%]" />
                                </div>
                                <div className="flex justify-between items-center pt-2">
                                    <span className="text-xs font-bold text-slate-500">Finished Goods</span>
                                    <span className="text-sm font-black text-slate-900">8,200 <span className="text-[9px] text-slate-400">ETB</span></span>
                                </div>
                                <div className="w-full h-1.5 bg-white/40 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500 w-[40%]" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
