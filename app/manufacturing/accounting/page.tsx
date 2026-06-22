// app/manufacturing/accounting/page.tsx - AN-Industory Accounting Hub
'use client';

import React, { useState, useEffect } from 'react';
import {
    DollarSign, 
    TrendingUp, 
    TrendingDown, 
    CreditCard,
    Activity, 
    ArrowUpRight, 
    ArrowDownRight, 
    Briefcase, 
    Loader2,
    Plus,
    Wallet,
    Building2,
    History,
    ClipboardList
} from 'lucide-react';

const StatCard = ({ title, value, subtext, icon: Icon, color, trend }: any) => (
  <div className="card p-4 relative overflow-hidden group">
    <div className={`absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform duration-500 rotate-12 ${color.text}`}>
      <Icon size={90} />
    </div>
    
    <div className="relative z-10">
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-2 rounded-xl ${color.bg} ${color.text}`}>
          <Icon size={18} />
        </div>
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">{title}</h3>
      </div>

      <div className="flex items-end gap-1.5 mb-0.5">
        <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{value}</span>
        {trend && (
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded mb-1 ${trend > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <p className="text-[10px] font-bold text-slate-400">{subtext}</p>
    </div>
  </div>
);

export default function AccountingHub() {
    const [stats, setStats] = useState<any>(null);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [statsRes, accountsRes] = await Promise.all([
                    fetch('/api/manufacturing/accounting/stats'),
                    fetch('/api/manufacturing/accounting/accounts')
                ]);
                if (statsRes.ok) {
                    const data = await statsRes.json();
                    setStats(data);
                }
                if (accountsRes.ok) {
                    const data = await accountsRes.json();
                    setAccounts(data.accounts || []);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const revenue = stats?.totalRevenue || 0;
    const expenses = stats?.totalExpenses || 0;
    const profit = stats?.netProfit || 0;
    const cogs = stats?.totalCOGS || 0;
    const margin = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : '0.0';

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="animate-spin text-primary" size={48} />
                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Opening Accounting Hub...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight">Accounting Hub</h1>
                    <p className="text-slate-500 font-bold text-xs">Manage company accounts, income, and expenses.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => window.location.href = '/manufacturing/expenses/add'}
                        className="btn-secondary flex items-center gap-1.5"
                    >
                        <Plus size={14} /> Record Expense
                    </button>
                    <button 
                        onClick={() => window.location.href = '/manufacturing/accounting/bulk'}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all active:scale-95"
                    >
                        <ClipboardList size={13} /> Bulk Transactions
                    </button>
                    <button 
                        onClick={() => window.location.href = '/manufacturing/accounting/transactions'}
                        className="btn-primary flex items-center gap-1.5"
                    >
                        <ArrowUpRight size={14} /> Add Transaction
                    </button>
                </div>
            </div>

            {/* KPI Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Revenue"
                    value={`${revenue.toLocaleString()} ETB`}
                    subtext="All Income"
                    icon={TrendingUp}
                    color={{ bg: 'bg-emerald-500/10', text: 'text-emerald-500' }}
                    trend={15}
                />
                <StatCard
                    title="Total Expenses"
                    value={`${expenses.toLocaleString()} ETB`}
                    subtext="All Outgoings"
                    icon={TrendingDown}
                    color={{ bg: 'bg-rose-500/10', text: 'text-rose-500' }}
                />
                <StatCard
                    title="Net Profit"
                    value={`${profit.toLocaleString()} ETB`}
                    subtext={`${margin}% Margin • Cost: ${cogs.toLocaleString()} ETB`}
                    icon={Briefcase}
                    color={{ bg: 'bg-blue-500/10', text: 'text-blue-500' }}
                />
                <StatCard
                    title="Net Cashflow"
                    value={revenue - expenses > 0 ? "Positive" : "Negative"}
                    subtext="Daily Trend"
                    icon={Activity}
                    color={{ bg: 'bg-amber-500/10', text: 'text-amber-500' }}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Accounts Section */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="card p-4 bg-slate-900 text-white">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-sm font-black tracking-tight">Company Accounts</h4>
                            <button 
                                onClick={() => window.location.href = '/manufacturing/accounting/accounts/add'}
                                className="p-1.5 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors text-white"
                            >
                                <Plus size={14} />
                            </button>
                        </div>
                        <div className="space-y-3">
                            {accounts.length > 0 ? (
                                accounts.map((acc: any) => (
                                    <div 
                                        key={acc.id} 
                                        onClick={() => window.location.href = `/manufacturing/accounting/accounts/${acc.id}`}
                                        className="p-3 rounded-xl bg-slate-800 border border-slate-700 hover:border-emerald-500/50 transition-all cursor-pointer group"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-2.5">
                                                <div className={`p-1.5 rounded-lg ${acc.type === 'Bank' ? 'bg-blue-500/20 text-blue-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
                                                    {acc.type === 'Bank' ? <Building2 size={16} /> : <Wallet size={16} />}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black">{acc.name}</p>
                                                    <p className="text-[9px] font-bold text-slate-500 uppercase">{acc.type} Account</p>
                                                </div>
                                            </div>
                                            <p className="text-sm font-black text-white">{Number(acc.balance).toLocaleString()} ETB</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-[10px] text-slate-500 text-center py-2 font-bold">No accounts found.</p>
                            )}
                        </div>
                    </div>

                    <div className="card p-4">
                        <h4 className="text-sm font-black text-slate-900 mb-3">Financial Health</h4>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                                    <span>Profit Target</span>
                                    <span>75%</span>
                                </div>
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500" style={{ width: '75%' }} />
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                                    <span>Expense Limit</span>
                                    <span>32%</span>
                                </div>
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500" style={{ width: '32%' }} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Transactions Section */}
                <div className="lg:col-span-2">
                    <div className="card h-full">
                        <div className="p-4 border-b border-slate-50 flex justify-between items-center">
                            <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                                <History size={16} className="text-primary" /> Recent Transactions
                            </h4>
                            <div className="flex gap-1.5">
                                <button className="px-2 py-0.5 bg-slate-50 rounded text-[9px] font-bold uppercase tracking-wider text-slate-500 hover:bg-slate-100 transition-colors">All</button>
                                <button className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[9px] font-bold uppercase tracking-wider hover:bg-emerald-100 transition-colors">Income</button>
                                <button className="px-2 py-0.5 bg-rose-50 text-rose-600 rounded text-[9px] font-bold uppercase tracking-wider hover:bg-rose-100 transition-colors">Expense</button>
                            </div>
                        </div>
                        <div className="p-0">
                            {stats?.transactions?.length > 0 ? (
                                <div className="divide-y divide-slate-50">
                                    {stats.transactions.map((tx: any, i: number) => {
                                        const isIncome = tx.type === 'income';
                                        return (
                                            <div key={i} className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition-all group">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-xl ${isIncome ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'} transition-transform group-hover:scale-105`}>
                                                        {isIncome ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900 text-xs tracking-tight">{tx.description}</p>
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{new Date(tx.date).toLocaleDateString()} • {tx.account || 'Main Cash'}</p>
                                                    </div>
                                                </div>
                                                <p className={`font-black text-sm tracking-tighter ${isIncome ? 'text-emerald-600' : 'text-slate-900'}`}>
                                                    {isIncome ? '+' : '-'}{tx.amount.toLocaleString()} ETB
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                                    <Activity size={48} className="opacity-20 mb-4" />
                                    <p className="text-xs font-black uppercase tracking-widest">No recent transactions</p>
                                </div>
                            )}
                        </div>
                        <div className="p-4 bg-slate-50/50 border-t border-slate-50 text-center">
                            <button 
                                onClick={() => window.location.href = '/manufacturing/accounting/transactions'}
                                className="text-xs font-black text-primary uppercase tracking-widest hover:underline bg-transparent border-none cursor-pointer"
                            >
                                View Full Ledger
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
