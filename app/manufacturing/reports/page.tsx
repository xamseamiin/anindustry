// app/manufacturing/reports/page.tsx - AN-Industory Financial & Daily Reports Hub (Glassmorphism)
'use client';

import React, { useState, useEffect } from 'react';
import { 
    DollarSign, TrendingUp, TrendingDown, Wallet, 
    ChevronRight, ArrowUpRight, ArrowDownRight, 
    PieChart, BarChart3, Calendar, Filter, Download,
    Briefcase, Package, RefreshCw, Printer, Copy, Check,
    FileText, ShoppingCart, CreditCard, User, Tag, Sparkles, Loader2
} from 'lucide-react';
import Link from 'next/link';

export default function FinancialHubPage() {
    const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'DAILY'>('DAILY');
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);

    // Daily Report States
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [dailyData, setDailyData] = useState<any>(null);
    const [dailyLoading, setDailyLoading] = useState<boolean>(true);
    const [copiedSummary, setCopiedSummary] = useState<boolean>(false);

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

    const fetchDailyReport = (date: string) => {
        setDailyLoading(true);
        fetch(`/api/manufacturing/reports/daily?date=${date}`)
            .then(res => res.json())
            .then(d => {
                setDailyData(d);
                setDailyLoading(false);
            })
            .catch(err => {
                console.error('Error fetching daily report:', err);
                setDailyLoading(false);
            });
    };

    useEffect(() => {
        if (activeTab === 'DAILY') {
            fetchDailyReport(selectedDate);
        }
    }, [activeTab, selectedDate]);

    const handleCopyTelegramSummary = () => {
        if (!dailyData) return;
        const summary = dailyData.summary || {};
        const formattedDate = new Date(selectedDate).toLocaleDateString('so-SO', { dateStyle: 'full' });

        let text = `<b>AN-Industory</b>\n` +
                   `<b>📊 WARBIXINTA MAALINLAHA AH (${selectedDate})</b>\n\n` +
                   `📅 Taariikhda: ${formattedDate}\n\n` +
                   `📈 <b>IIBKA MAANTA:</b> ${Number(summary.totalSalesPaid || 0).toLocaleString()} ETB (${summary.salesCount || 0} Iib)\n` +
                   `📉 <b>KHARASHKA MAANTA:</b> ${Number(summary.totalPaidExpensesAmount || 0).toLocaleString()} ETB\n` +
                   (summary.totalPaidPurchasesAmount > 0 ? `📦 <b>QALABKA LA SOO GADAY:</b> ${Number(summary.totalPaidPurchasesAmount).toLocaleString()} ETB\n` : '') +
                   `💰 <b>NATIIJADA SAFI-GA AH (Net Cashflow):</b> ${Number(summary.netDailyCashflow || 0).toLocaleString()} ETB\n\n`;

        if (dailyData.expensesByCategory && dailyData.expensesByCategory.length > 0) {
            text += `📁 <b>FAAHFAAHINTA KHARASHYADA:</b>\n`;
            dailyData.expensesByCategory.forEach((cat: any) => {
                text += `  • ${cat.category}: ${Number(cat.total).toLocaleString()} ETB (${cat.count})\n`;
            });
            text += `\n`;
        }

        if (dailyData.accounts && dailyData.accounts.length > 0) {
            text += `💳 <b>HARAA-YAALKA AKOONADA:</b>\n`;
            dailyData.accounts.forEach((acc: any) => {
                text += `  • ${acc.name}: ${Number(acc.balance).toLocaleString()} ETB\n`;
            });
        }

        navigator.clipboard.writeText(text);
        setCopiedSummary(true);
        setTimeout(() => setCopiedSummary(false), 2500);
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading && !data) {
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
    const dailySummary = dailyData?.summary || {};

    return (
        <div className="relative min-h-screen">
            {/* Dynamic Financial Background */}
            <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden print:hidden">
                <div className="absolute top-[-10%] right-[-5%] w-[45%] h-[45%] bg-emerald-500/10 rounded-full blur-[130px] animate-pulse" />
                <div className="absolute bottom-[-10%] left-[-5%] w-[45%] h-[45%] bg-blue-500/10 rounded-full blur-[130px] animate-pulse" style={{ animationDelay: '3s' }} />
            </div>

            <div className="flex flex-col gap-8 px-8 animate-fade-in max-w-[1700px] mx-auto py-8 relative z-10 print:p-0 print:m-0">
                {/* Header & Tab Navigation */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 print:hidden">
                    <div className="flex items-center gap-5">
                        <div className="p-4 bg-white/60 backdrop-blur-xl rounded-2xl shadow-xl border border-white/40 text-emerald-600">
                            <Briefcase size={32} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Accounting Hub</span>
                                <ChevronRight size={10} className="text-slate-400" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Daily & Financial Reports</span>
                            </div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Executive Intelligence</h1>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex items-center gap-2 p-1.5 bg-white/40 backdrop-blur-xl border border-white/40 rounded-2xl shadow-lg">
                        <button
                            onClick={() => setActiveTab('DAILY')}
                            className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
                                activeTab === 'DAILY' 
                                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' 
                                    : 'text-slate-600 hover:bg-white/60'
                            }`}
                        >
                            <Calendar size={16} /> 📅 Warbixinta Maalinlaha
                        </button>
                        <button
                            onClick={() => setActiveTab('OVERVIEW')}
                            className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
                                activeTab === 'OVERVIEW' 
                                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' 
                                    : 'text-slate-600 hover:bg-white/60'
                            }`}
                        >
                            <BarChart3 size={16} /> Executive Overview
                        </button>
                    </div>
                </div>

                {/* TAB 1: DAILY EXECUTIVE REPORT */}
                {activeTab === 'DAILY' && (
                    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-200">
                        {/* Daily Filters & Action Toolbar */}
                        <div className="bg-white/40 backdrop-blur-2xl p-6 rounded-3xl border border-white/50 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 print:hidden">
                            <div className="flex flex-wrap items-center gap-4">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Dooro Taariikhda</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="date"
                                            value={selectedDate}
                                            onChange={(e) => setSelectedDate(e.target.value)}
                                            className="px-4 py-3 bg-white/80 border border-slate-200 rounded-xl font-black text-xs text-slate-800 outline-none focus:border-emerald-500 shadow-sm"
                                        />
                                        <button
                                            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                                            className="px-4 py-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 border border-emerald-500/20 rounded-xl font-black text-xs transition-all"
                                        >
                                            Maanta (Today)
                                        </button>
                                        <button
                                            onClick={() => {
                                                const d = new Date();
                                                d.setDate(d.getDate() - 1);
                                                setSelectedDate(d.toISOString().split('T')[0]);
                                            }}
                                            className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-black text-xs transition-all"
                                        >
                                            Shalay (Yesterday)
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleCopyTelegramSummary}
                                    className="px-5 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-blue-600/25 active:scale-95"
                                >
                                    {copiedSummary ? <Check size={16} /> : <Copy size={16} />}
                                    {copiedSummary ? 'Waa la Copy gareeyay!' : '📱 Telegram Summary'}
                                </button>
                                <button
                                    onClick={handlePrint}
                                    className="px-5 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-slate-900/25 active:scale-95"
                                >
                                    <Printer size={16} /> Daabac (Print / PDF)
                                </button>
                            </div>
                        </div>

                        {/* Print Header (Visible only when printing) */}
                        <div className="hidden print:block mb-8 text-center border-b pb-6">
                            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">AN-INDUSTORY PARTNERSHIP</h1>
                            <p className="text-sm font-bold text-slate-600">WARBIXINTA MAALINLAHA AH (EXECUTIVE DAILY REPORT)</p>
                            <p className="text-xs font-bold text-slate-500 mt-1">Taariikhda: {selectedDate}</p>
                        </div>

                        {dailyLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <Loader2 className="animate-spin text-emerald-600" size={32} />
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">Soo helaya macluumaadka maalinta...</p>
                            </div>
                        ) : (
                            <>
                                {/* Daily KPI Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <div className="bg-white/40 backdrop-blur-2xl p-7 rounded-3xl border border-white/50 shadow-xl relative overflow-hidden">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-600"><TrendingUp size={22} /></div>
                                            <span className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 uppercase">
                                                {dailySummary.salesCount || 0} Transactions
                                            </span>
                                        </div>
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Iibka Maanta (Daily Revenue)</p>
                                        <p className="text-3xl font-black text-slate-900 tracking-tight">
                                            {Number(dailySummary.totalSalesPaid || 0).toLocaleString()} <span className="text-sm font-bold text-slate-400">ETB</span>
                                        </p>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">
                                            Total Invoice: {Number(dailySummary.totalSalesRevenue || 0).toLocaleString()} ETB
                                        </p>
                                    </div>

                                    <div className="bg-white/40 backdrop-blur-2xl p-7 rounded-3xl border border-white/50 shadow-xl relative overflow-hidden">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="p-3.5 rounded-2xl bg-rose-500/10 text-rose-600"><TrendingDown size={22} /></div>
                                            <span className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-600 uppercase">
                                                {dailySummary.expensesCount || 0} Expenses
                                            </span>
                                        </div>
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Kharashka Maanta (Paid Expenses)</p>
                                        <p className="text-3xl font-black text-rose-600 tracking-tight">
                                            {Number(dailySummary.totalPaidExpensesAmount || 0).toLocaleString()} <span className="text-sm font-bold text-slate-400">ETB</span>
                                        </p>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">
                                            Pending: {Number(dailySummary.totalPendingExpensesAmount || 0).toLocaleString()} ETB
                                        </p>
                                    </div>

                                    <div className="bg-white/40 backdrop-blur-2xl p-7 rounded-3xl border border-white/50 shadow-xl relative overflow-hidden">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="p-3.5 rounded-2xl bg-blue-500/10 text-blue-600"><Wallet size={22} /></div>
                                            <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg ${dailySummary.netDailyCashflow >= 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'} uppercase`}>
                                                {dailySummary.netDailyCashflow >= 0 ? '+ Profit' : '- Deficit'}
                                            </span>
                                        </div>
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Natiijada Safiga (Net Cashflow)</p>
                                        <p className={`text-3xl font-black tracking-tight ${dailySummary.netDailyCashflow >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {Number(dailySummary.netDailyCashflow || 0).toLocaleString()} <span className="text-sm font-bold text-slate-400">ETB</span>
                                        </p>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">
                                            Daily Net Income
                                        </p>
                                    </div>

                                    <div className="bg-slate-900 p-7 rounded-3xl border border-white/10 shadow-xl relative overflow-hidden text-white">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="p-3.5 rounded-2xl bg-white/10 text-emerald-400"><CreditCard size={22} /></div>
                                            <span className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 uppercase">
                                                Live Accounts
                                            </span>
                                        </div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Koontada E-Birr Merchant</p>
                                        <p className="text-3xl font-black text-white tracking-tight">
                                            {Number(dailyData?.accounts?.find((a: any) => a.name.includes('E-Birr'))?.balance || 0).toLocaleString()} <span className="text-sm font-bold text-slate-400">ETB</span>
                                        </p>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">
                                            Current Total Liquid Balance
                                        </p>
                                    </div>
                                </div>

                                {/* Main Daily Grid */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    {/* Left 2 Cols: Sales & Expenses Details */}
                                    <div className="lg:col-span-2 space-y-8">
                                        {/* Sales Table */}
                                        <div className="bg-white/40 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-white/50 shadow-xl">
                                            <div className="flex justify-between items-center mb-6">
                                                <div>
                                                    <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                                                        <ShoppingCart className="text-emerald-600" size={20} />
                                                        Diiwaanka Iibka Maanta ({selectedDate})
                                                    </h3>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Completed Sales Transactions</p>
                                                </div>
                                                <span className="px-3 py-1.5 bg-emerald-500/10 text-emerald-600 rounded-xl text-xs font-black">
                                                    {dailyData?.sales?.length || 0} Orders
                                                </span>
                                            </div>

                                            {dailyData?.sales?.length === 0 ? (
                                                <p className="text-xs font-bold text-slate-400 text-center py-8">Lama helin wax iib ah taariikhdan.</p>
                                            ) : (
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-left">
                                                        <thead>
                                                            <tr className="text-[9px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200/50">
                                                                <th className="pb-3">Macmiilka</th>
                                                                <th className="pb-3">Alaabta</th>
                                                                <th className="pb-3">Nooca</th>
                                                                <th className="pb-3 text-right">Lacagta</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-100 text-xs font-bold">
                                                            {dailyData?.sales?.map((sale: any) => (
                                                                <tr key={sale.id} className="hover:bg-white/40 transition-all">
                                                                    <td className="py-4">
                                                                        <span className="font-black text-slate-900">{sale.customer?.name || 'Macmiil'}</span>
                                                                        <br />
                                                                        <span className="text-[9px] text-slate-400">{sale.customer?.phone}</span>
                                                                    </td>
                                                                    <td className="py-4 text-slate-600">
                                                                        {sale.items?.map((item: any) => `${item.productName} (${item.quantity})`).join(', ')}
                                                                    </td>
                                                                    <td className="py-4">
                                                                        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-[9px] font-black uppercase">
                                                                            {sale.paymentMethod}
                                                                        </span>
                                                                    </td>
                                                                    <td className="py-4 text-right font-black text-emerald-600">
                                                                        {Number(sale.paidAmount).toLocaleString()} ETB
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>

                                        {/* Expenses Table */}
                                        <div className="bg-white/40 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-white/50 shadow-xl">
                                            <div className="flex justify-between items-center mb-6">
                                                <div>
                                                    <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                                                        <FileText className="text-rose-600" size={20} />
                                                        Diiwaanka Kharashyada Maanta ({selectedDate})
                                                    </h3>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Operational Expenses & Salaries</p>
                                                </div>
                                                <span className="px-3 py-1.5 bg-rose-500/10 text-rose-600 rounded-xl text-xs font-black">
                                                    {dailyData?.expenses?.length || 0} Items
                                                </span>
                                            </div>

                                            {dailyData?.expenses?.length === 0 ? (
                                                <p className="text-xs font-bold text-slate-400 text-center py-8">Lama helin wax kharash ah taariikhdan.</p>
                                            ) : (
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-left">
                                                        <thead>
                                                            <tr className="text-[9px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200/50">
                                                                <th className="pb-3">Qaybta</th>
                                                                <th className="pb-3">Sharaxaad</th>
                                                                <th className="pb-3">Status</th>
                                                                <th className="pb-3 text-right">Lacagta</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-100 text-xs font-bold">
                                                            {dailyData?.expenses?.map((exp: any) => {
                                                                const isPaid = exp.approved || exp.paymentStatus === 'PAID' || !!exp.receiptUrl;
                                                                return (
                                                                    <tr key={exp.id} className="hover:bg-white/40 transition-all">
                                                                        <td className="py-4">
                                                                            <span className="font-black text-slate-900">{exp.category}</span>
                                                                            {exp.employee && (
                                                                                <span className="block text-[9px] text-blue-600 font-bold">👤 {exp.employee.fullName}</span>
                                                                            )}
                                                                        </td>
                                                                        <td className="py-4 text-slate-600 max-w-xs truncate">
                                                                            {exp.description || exp.note}
                                                                        </td>
                                                                        <td className="py-4">
                                                                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase ${
                                                                                isPaid ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                                                                            }`}>
                                                                                {isPaid ? 'Waala Bixiyey' : 'Sugaya Rasiid'}
                                                                            </span>
                                                                        </td>
                                                                        <td className="py-4 text-right font-black text-rose-600">
                                                                            {Number(exp.amount).toLocaleString()} ETB
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right Col: Category Breakdowns & Accounts */}
                                    <div className="space-y-8">
                                        {/* Category Breakdown Card */}
                                        <div className="bg-white/40 backdrop-blur-2xl p-7 rounded-[2.5rem] border border-white/50 shadow-xl">
                                            <h4 className="text-base font-black text-slate-900 tracking-tight mb-4 flex items-center gap-2">
                                                <Tag className="text-emerald-600" size={18} />
                                                Kharashyada oo loo qaybiyay Catagories
                                            </h4>
                                            <div className="space-y-4">
                                                {dailyData?.expensesByCategory?.map((cat: any, idx: number) => (
                                                    <div key={idx} className="flex justify-between items-center p-3 bg-white/50 rounded-2xl border border-white/40">
                                                        <div>
                                                            <p className="text-xs font-black text-slate-900">{cat.category}</p>
                                                            <p className="text-[9px] font-bold text-slate-400">{cat.count} Transactions</p>
                                                        </div>
                                                        <span className="text-xs font-black text-rose-600">
                                                            {Number(cat.total).toLocaleString()} ETB
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Financial Accounts Status Card */}
                                        <div className="bg-slate-900 p-7 rounded-[2.5rem] border border-white/10 shadow-2xl text-white">
                                            <h4 className="text-base font-black tracking-tight mb-4 flex items-center gap-2">
                                                <CreditCard className="text-emerald-400" size={18} />
                                                Haraaga Akoonada (Financial Accounts)
                                            </h4>
                                            <div className="space-y-4">
                                                {dailyData?.accounts?.map((acc: any) => (
                                                    <div key={acc.id} className="flex justify-between items-center p-3.5 bg-white/5 rounded-2xl border border-white/10">
                                                        <div>
                                                            <p className="text-xs font-black text-white">{acc.name}</p>
                                                            <p className="text-[9px] font-bold text-slate-400">{acc.type || 'Account'}</p>
                                                        </div>
                                                        <span className="text-sm font-black text-emerald-400">
                                                            {Number(acc.balance).toLocaleString()} ETB
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* TAB 2: OVERVIEW HUB (EXECUTIVE DASHBOARD) */}
                {activeTab === 'OVERVIEW' && (
                    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-200">
                        {/* KPI Cards Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                { title: 'Total Revenue', value: kpis.totalRevenue?.toLocaleString(), sub: 'Lifetime Income', icon: <TrendingUp size={20} />, color: 'emerald', trend: '+12.5%' },
                                { title: 'Total Expenses', value: kpis.totalExpenses?.toLocaleString(), sub: 'Ops & Salaries', icon: <TrendingDown size={20} />, color: 'rose', trend: '+4.2%' },
                                { title: 'Net Profit', value: kpis.netProfit?.toLocaleString(), sub: 'Revenue - COGS - Expenses', icon: <Wallet size={20} />, color: 'blue', trend: '+18.1%' },
                                { title: 'Profit Margin', value: kpis.profitMargin, sub: 'Business Efficiency', icon: <PieChart size={20} />, color: 'amber', trend: 'Healthy' }
                            ].map((stat, idx) => (
                                <div key={idx} className="bg-white/40 backdrop-blur-2xl p-7 rounded-3xl border border-white/40 shadow-xl relative overflow-hidden group">
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
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
