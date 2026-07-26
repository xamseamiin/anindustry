// app/manufacturing/reports/page.tsx - AN-Industory Financial & Daily Reports Hub (Glassmorphism + Executive PDF Layout)
'use client';

import React, { useState, useEffect } from 'react';
import { 
    DollarSign, TrendingUp, TrendingDown, Wallet, 
    ChevronRight, ArrowUpRight, ArrowDownRight, 
    PieChart, BarChart3, Calendar, Filter, Download,
    Briefcase, Package, RefreshCw, Printer, Copy, Check,
    FileText, ShoppingCart, CreditCard, User, Tag, Sparkles, Loader2, Building2
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
        const stmt = dailyData.statement || {};
        const formattedDate = new Date(selectedDate).toLocaleDateString('so-SO', { dateStyle: 'full' });

        let text = `<b>AN-INDUSTORY PARTNERSHIP</b>\n` +
                   `<b>📊 DAILY FINANCIAL STATEMENT (${selectedDate})</b>\n\n` +
                   `📅 Ref: ${dailyData.refNumber || 'D-' + selectedDate}\n` +
                   `👤 Prepared By: ${dailyData.preparedBy || 'Manager'}\n\n` +
                   `🏦 <b>ACCOUNT BALANCES:</b>\n`;

        if (dailyData.accountBalancesSummary) {
            dailyData.accountBalancesSummary.forEach((acc: any) => {
                text += `  • ${acc.name}: ${Number(acc.currentBalance).toLocaleString()} ETB (Change: ${acc.change >= 0 ? '+' : ''}${acc.change.toLocaleString()})\n`;
            });
        }

        text += `\n💵 <b>DAILY FINANCIAL STATEMENT:</b>\n` +
                `  • Opening Balance: ${Number(stmt.openingBalance || 0).toLocaleString()} ETB\n` +
                `  • Project Expenses: -${Number(stmt.totalProjectExp || 0).toLocaleString()} ETB\n` +
                `  • Company Expenses: -${Number(stmt.totalOpsExp || 0).toLocaleString()} ETB\n` +
                `  • <b>TOTAL OUTFLOWS: -${Number(stmt.totalOutflows || 0).toLocaleString()} ETB</b>\n` +
                `  • <b>CLOSING BALANCE: ${Number(stmt.closingBalance || 0).toLocaleString()} ETB</b>\n`;

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
    const statement = dailyData?.statement || {};
    const refNum = dailyData?.refNumber || `D-${selectedDate.replace(/-/g, '')}`;
    const preparedBy = dailyData?.preparedBy || 'Executive Manager';

    return (
        <div className="relative min-h-screen">
            {/* Dynamic Background (hidden when printing) */}
            <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden print:hidden">
                <div className="absolute top-[-10%] right-[-5%] w-[45%] h-[45%] bg-emerald-500/10 rounded-full blur-[130px] animate-pulse" />
                <div className="absolute bottom-[-10%] left-[-5%] w-[45%] h-[45%] bg-blue-500/10 rounded-full blur-[130px] animate-pulse" style={{ animationDelay: '3s' }} />
            </div>

            <div className="flex flex-col gap-8 px-8 animate-fade-in max-w-[1700px] mx-auto py-8 relative z-10 print:p-0 print:m-0 print:max-w-none">
                {/* Header & Tab Navigation (hidden when printing) */}
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

                {/* TAB 1: DAILY EXECUTIVE REPORT (EXECUTIVE PDF TEMPLATE LAYOUT) */}
                {activeTab === 'DAILY' && (
                    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-200">
                        {/* Daily Filters & Action Toolbar (hidden when printing) */}
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
                                    <Printer size={16} /> Daabac PDF (Executive Report)
                                </button>
                            </div>
                        </div>

                        {dailyLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <Loader2 className="animate-spin text-emerald-600" size={32} />
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">Generating Executive Daily Report...</p>
                            </div>
                        ) : (
                            /* EXECUTIVE REPORT CONTAINER (PDF/PRINT DESIGNED) */
                            <div className="bg-white p-8 md:p-12 rounded-[2.5rem] border border-slate-200/80 shadow-2xl relative overflow-hidden text-slate-800 font-sans print:shadow-none print:border-none print:p-0 print:m-0">
                                
                                {/* Background Logo Watermark */}
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none">
                                    <h1 className="text-[120px] font-black text-slate-900 uppercase tracking-tighter">AN-INDUSTORY</h1>
                                </div>

                                {/* 1. HEADER SECTION */}
                                <div className="flex justify-between items-start border-b-2 border-slate-100 pb-8 mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-gradient-to-tr from-emerald-600 to-amber-500 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-md">
                                            AN
                                        </div>
                                        <div>
                                            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                                                AN-INDUSTORY
                                            </h1>
                                            <p className="text-xs font-bold text-amber-600 tracking-widest italic">Daily Financial Report</p>
                                        </div>
                                    </div>

                                    {/* Metadata Box */}
                                    <div className="text-right text-xs font-mono space-y-1">
                                        <div className="flex justify-between gap-6">
                                            <span className="font-bold text-slate-400">DATE</span>
                                            <span className="font-black text-slate-900">{selectedDate}</span>
                                        </div>
                                        <div className="flex justify-between gap-6">
                                            <span className="font-bold text-slate-400">REF NUMBER</span>
                                            <span className="font-black text-slate-900">{refNum}</span>
                                        </div>
                                        <div className="flex justify-between gap-6">
                                            <span className="font-bold text-slate-400">PREPARED BY</span>
                                            <span className="font-black text-slate-900">{preparedBy}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* 2. ACCOUNT BALANCES SECTION */}
                                <div className="mb-10">
                                    <div className="border-b-2 border-emerald-600 pb-2 mb-4">
                                        <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Account Balances</h2>
                                    </div>
                                    <table className="w-full text-left text-xs">
                                        <thead>
                                            <tr className="border-b border-slate-200 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                                                <th className="py-3">ACCOUNT</th>
                                                <th className="py-3 text-right">PREVIOUS BALANCE</th>
                                                <th className="py-3 text-right">CURRENT BALANCE</th>
                                                <th className="py-3 text-right">CHANGE</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 font-medium">
                                            {dailyData?.accountBalancesSummary?.map((acc: any) => (
                                                <tr key={acc.id} className="hover:bg-slate-50/50">
                                                    <td className="py-3.5 font-bold text-slate-800">{acc.name}</td>
                                                    <td className="py-3.5 text-right font-mono">{Number(acc.previousBalance).toLocaleString()}</td>
                                                    <td className="py-3.5 text-right font-mono font-bold">{Number(acc.currentBalance).toLocaleString()}</td>
                                                    <td className={`py-3.5 text-right font-mono font-bold ${acc.change < 0 ? 'text-rose-600' : acc.change > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                        {acc.change > 0 ? `+${acc.change.toLocaleString()}` : acc.change < 0 ? `${acc.change.toLocaleString()}` : '0'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* 3. PROJECT EXPENSES SECTION */}
                                <div className="mb-10">
                                    <div className="border-b-2 border-emerald-600 pb-2 mb-4">
                                        <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Project / Factory Expenses</h2>
                                    </div>
                                    {dailyData?.projectExpenses?.length === 0 ? (
                                        <p className="text-xs text-slate-400 py-3 italic">No project or factory material expenses for this date.</p>
                                    ) : (
                                        <table className="w-full text-left text-xs">
                                            <thead>
                                                <tr className="border-b border-slate-200 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                                                    <th className="py-3">PROJECT</th>
                                                    <th className="py-3">CATEGORY</th>
                                                    <th className="py-3">EMPLOYEE / VENDOR</th>
                                                    <th className="py-3">DESCRIPTION</th>
                                                    <th className="py-3 text-right">AMOUNT</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 font-medium">
                                                {dailyData?.projectExpenses?.map((exp: any, idx: number) => (
                                                    <tr key={idx} className="hover:bg-slate-50/50">
                                                        <td className="py-3 font-bold text-slate-800">{exp.project}</td>
                                                        <td className="py-3 text-slate-600">{exp.category}</td>
                                                        <td className="py-3 text-slate-600">{exp.employeeOrVendor}</td>
                                                        <td className="py-3 text-slate-600 max-w-xs">{exp.description}</td>
                                                        <td className="py-3 text-right font-mono font-bold text-slate-900">{exp.amount.toLocaleString()} ETB</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot>
                                                <tr className="bg-slate-50 font-black border-t border-slate-200 text-xs">
                                                    <td colSpan={4} className="py-3.5 px-2 text-right uppercase text-slate-600">Total Project Exp.</td>
                                                    <td className="py-3.5 text-right font-mono text-rose-600 text-sm">{statement.totalProjectExp?.toLocaleString()} ETB</td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    )}
                                </div>

                                {/* 4. COMPANY EXPENSES SECTION */}
                                <div className="mb-10">
                                    <div className="border-b-2 border-emerald-600 pb-2 mb-4">
                                        <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Company Expenses</h2>
                                    </div>
                                    {dailyData?.companyExpenses?.length === 0 ? (
                                        <p className="text-xs text-slate-400 py-3 italic">No general company ops expenses for this date.</p>
                                    ) : (
                                        <table className="w-full text-left text-xs">
                                            <thead>
                                                <tr className="border-b border-slate-200 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                                                    <th className="py-3">CATEGORY</th>
                                                    <th className="py-3">EMPLOYEE / VENDOR</th>
                                                    <th className="py-3">DESCRIPTION</th>
                                                    <th className="py-3 text-right">AMOUNT</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 font-medium">
                                                {dailyData?.companyExpenses?.map((exp: any, idx: number) => (
                                                    <tr key={idx} className="hover:bg-slate-50/50">
                                                        <td className="py-3 font-bold text-slate-800">{exp.category}</td>
                                                        <td className="py-3 text-slate-600">{exp.employeeOrVendor}</td>
                                                        <td className="py-3 text-slate-600">{exp.description}</td>
                                                        <td className="py-3 text-right font-mono font-bold text-slate-900">{exp.amount.toLocaleString()} ETB</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot>
                                                <tr className="bg-slate-50 font-black border-t border-slate-200 text-xs">
                                                    <td colSpan={3} className="py-3.5 px-2 text-right uppercase text-slate-600">Total Ops Exp.</td>
                                                    <td className="py-3.5 text-right font-mono text-rose-600 text-sm">{statement.totalOpsExp?.toLocaleString()} ETB</td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    )}
                                </div>

                                {/* 5. DAILY FINANCIAL STATEMENT BANNER */}
                                <div className="mb-12 border border-slate-900 rounded-2xl overflow-hidden shadow-lg">
                                    {/* Dark Banner Header */}
                                    <div className="bg-slate-900 text-white px-6 py-3 flex justify-between items-center font-black text-xs uppercase tracking-wider">
                                        <span>DAILY FINANCIAL STATEMENT</span>
                                        <span>{selectedDate}</span>
                                    </div>

                                    {/* Statement Breakdown Rows */}
                                    <div className="p-6 space-y-3 text-xs font-mono bg-slate-50/50">
                                        <div className="flex justify-between items-center py-1">
                                            <span className="font-bold text-slate-700">Lacagtii hore ugu jirtay (Opening Balance)</span>
                                            <span className="font-black text-slate-900">{Number(statement.openingBalance || 0).toLocaleString()} ETB</span>
                                        </div>
                                        <div className="flex justify-between items-center py-1 text-rose-600">
                                            <span className="font-semibold ml-4">- Mashruuc / Factory Kharashyada (Project Exp.)</span>
                                            <span className="font-bold">-{Number(statement.totalProjectExp || 0).toLocaleString()} ETB</span>
                                        </div>
                                        <div className="flex justify-between items-center py-1 text-rose-600">
                                            <span className="font-semibold ml-4">- Shirkad Kharashyada (Company Exp.)</span>
                                            <span className="font-bold">-{Number(statement.totalOpsExp || 0).toLocaleString()} ETB</span>
                                        </div>

                                        <div className="border-t-2 border-slate-300 pt-3 flex justify-between items-center text-xs font-black text-rose-600">
                                            <span>TOTAL OUTFLOWS</span>
                                            <span>-{Number(statement.totalOutflows || 0).toLocaleString()} ETB</span>
                                        </div>

                                        <div className="border-t-4 border-slate-900 pt-4 flex justify-between items-center text-base font-black text-emerald-600">
                                            <span>Lacagta hada taala (Closing Balance)</span>
                                            <span className="text-lg">{Number(statement.closingBalance || 0).toLocaleString()} ETB</span>
                                        </div>
                                    </div>
                                </div>

                                {/* 6. FOOTER SECTION */}
                                <div className="border-t border-slate-200 pt-6 flex justify-between items-center text-[10px] font-mono text-slate-400">
                                    <span>Generated on {new Date().toLocaleString()}</span>
                                    <span>Page 1 of 1</span>
                                    <span className="font-bold text-slate-600">Powered by AN-INDUSTORY</span>
                                </div>
                            </div>
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
