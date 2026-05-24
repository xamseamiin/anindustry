// app/manufacturing/accounting/accounts/[id]/page.tsx - Premium Account Statement & Ledger Page
'use client';

import React, { useState, useEffect } from 'react';
import { 
    ArrowLeft, 
    Edit3, 
    Trash2, 
    Loader2, 
    Search, 
    ArrowUpRight, 
    ArrowDownRight, 
    Building2, 
    Wallet, 
    Filter,
    TrendingUp,
    TrendingDown,
    Info,
    Calendar
} from 'lucide-react';

export default function AccountStatementPage({ params }: { params: { id: string } }) {
    const { id } = params;
    const [account, setAccount] = useState<any>(null);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('ALL');

    useEffect(() => {
        const fetchAccountDetails = async () => {
            try {
                const res = await fetch(`/api/manufacturing/accounting/accounts/${id}`);
                if (res.ok) {
                    const data = await res.json();
                    setAccount(data.account);
                    setTransactions(data.transactions || []);
                } else {
                    setError('Koontada lama heli karo.');
                }
            } catch (err) {
                console.error(err);
                setError('Waxaa dhacay khalad inta xogta la keenayey.');
            } finally {
                setLoading(false);
            }
        };
        fetchAccountDetails();
    }, [id]);

    const handleDelete = async () => {
        if (!confirm('Ma hubtaa inaad rabto inaad tirtirto koontadan?')) return;
        setDeleting(true);
        setError('');

        try {
            const res = await fetch(`/api/manufacturing/accounting/accounts/${id}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (res.ok) {
                window.location.href = '/manufacturing/accounting';
            } else {
                setError(data.message || 'Cilad ayaa dhacday.');
            }
        } catch (err) {
            console.error(err);
            setError('Server-ka lama xiriiri karo.');
        } finally {
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="animate-spin text-primary" size={48} />
                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Opening Account Ledger...</p>
            </div>
        );
    }

    if (!account) {
        return (
            <div className="max-w-md mx-auto py-20 text-center space-y-4">
                <Info size={48} className="text-rose-500 mx-auto" />
                <h3 className="text-lg font-black text-slate-900">Koontada lama helo</h3>
                <p className="text-xs font-bold text-slate-500">Xogta koontada aad raadinayso kuma jirto database-ka.</p>
                <button 
                    onClick={() => window.location.href = '/manufacturing/accounting'}
                    className="btn-primary text-xs"
                >
                    Ku laabo Accounting
                </button>
            </div>
        );
    }

    // 1. Working Backwards to compute rolling historical balances for audit-readiness!
    let balanceTracker = account.balance;
    const transactionsWithRolling = [...transactions].map(tx => {
        const amount = Number(tx.amount);
        // Determine if it was an inflow or outflow to this account
        // If accountId is matched, use the transaction type to know.
        // If transfer out: fromAccountId === id (Outflow)
        // If transfer in: toAccountId === id (Inflow)
        const isTransferOut = tx.fromAccountId === id;
        const isTransferIn = tx.toAccountId === id;
        const isIncome = tx.type === 'INCOME' || isTransferIn || tx.type === 'DEBT_RECEIVED' || tx.type === 'DEBT_TAKEN';

        const txBalance = balanceTracker;
        if (isIncome) {
            balanceTracker -= amount; // Decrement when working backwards
        } else {
            balanceTracker += amount; // Increment when working backwards
        }
        return { ...tx, isIncome, rollingBalance: txBalance };
    });

    // 2. Compute Total Inflows and Outflows
    const totalInflow = transactionsWithRolling
        .filter(tx => tx.isIncome)
        .reduce((sum, tx) => sum + Number(tx.amount), 0);

    const totalOutflow = transactionsWithRolling
        .filter(tx => !tx.isIncome)
        .reduce((sum, tx) => sum + Number(tx.amount), 0);

    // 3. Filter Transactions
    const filteredTransactions = transactionsWithRolling.filter(tx => {
        const matchesSearch = tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              (tx.note && tx.note.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesFilter = typeFilter === 'ALL' ||
                             (typeFilter === 'INFLOW' && tx.isIncome) ||
                             (typeFilter === 'OUTFLOW' && !tx.isIncome);
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header Action Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => window.location.href = '/manufacturing/accounting'}
                        className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors group text-slate-700 dark:text-slate-300"
                    >
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${account.isActive ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                                {account.isActive ? 'Shaqaynaysa' : 'Aan Shaqaynayn'}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{account.type} Account</span>
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{account.name}</h1>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => window.location.href = `/manufacturing/accounting/accounts/${id}/edit`}
                        className="btn-secondary flex items-center gap-2 text-xs"
                    >
                        <Edit3 size={16} /> Beddel Koontada
                    </button>
                    <button 
                        onClick={handleDelete}
                        disabled={deleting}
                        className="px-4 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-colors disabled:opacity-50"
                    >
                        <Trash2 size={16} /> Tirtir koontada
                    </button>
                </div>
            </div>

            {/* Error Message if deletion fails */}
            {error && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold flex items-center gap-3">
                    <Info size={16} />
                    <span>{error}</span>
                </div>
            )}

            {/* Hero Card & KPI Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Balance Hero Card */}
                <div className="card p-6 bg-slate-900 text-white flex flex-col justify-between min-h-[160px] relative overflow-hidden group">
                    <div className="absolute -right-6 -top-6 opacity-10 rotate-12 group-hover:scale-110 transition-transform duration-500">
                        {account.type === 'Bank' ? <Building2 size={160} /> : <Wallet size={160} />}
                    </div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Miyaanka / Balance-ka Hadda</p>
                        <h2 className="text-4xl font-black tracking-tight">{Number(account.balance).toLocaleString()} {account.currency}</h2>
                    </div>
                    <p className="text-xs font-bold text-slate-400 mt-4 max-w-xs">{account.description || 'Kani waa xisaab xambaarsan dhaqdhaqaaqa maaliyadeed ee warshadda.'}</p>
                </div>

                {/* Inflows Card */}
                <div className="card p-6 flex flex-col justify-between min-h-[160px]">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl">
                            <TrendingUp size={24} />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inflows / Deposits</span>
                    </div>
                    <div>
                        <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">+{totalInflow.toLocaleString()} {account.currency}</p>
                        <p className="text-xs font-bold text-slate-400 mt-1">Lacagaha guud ee koontada soo galay</p>
                    </div>
                </div>

                {/* Outflows Card */}
                <div className="card p-6 flex flex-col justify-between min-h-[160px]">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-rose-500/10 text-rose-500 rounded-2xl">
                            <TrendingDown size={24} />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Outflows / Payments</span>
                    </div>
                    <div>
                        <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">-{totalOutflow.toLocaleString()} {account.currency}</p>
                        <p className="text-xs font-bold text-slate-400 mt-1">Lacagaha guud ee koontada ka baxay</p>
                    </div>
                </div>
            </div>

            {/* Ledger Statements Section */}
            <div className="card">
                {/* Statement Control Bar */}
                <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                        <Calendar size={20} className="text-primary" /> Koobi-Xisaabeedka (Ledger Statement)
                    </h3>
                    <div className="flex flex-col md:flex-row items-center gap-3">
                        {/* Search Input */}
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Ka raadi liiska..."
                                className="w-full pl-10 pr-4 py-2 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900 text-xs font-bold focus:outline-none focus:border-primary transition-colors"
                            />
                        </div>

                        {/* Filters */}
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setTypeFilter('ALL')}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors ${
                                    typeFilter === 'ALL' 
                                    ? 'bg-slate-900 text-white' 
                                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                                }`}
                            >
                                Dhammaan
                            </button>
                            <button 
                                onClick={() => setTypeFilter('INFLOW')}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors ${
                                    typeFilter === 'INFLOW' 
                                    ? 'bg-emerald-500 text-white' 
                                    : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                }`}
                            >
                                Inflows
                            </button>
                            <button 
                                onClick={() => setTypeFilter('OUTFLOW')}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors ${
                                    typeFilter === 'OUTFLOW' 
                                    ? 'bg-rose-500 text-white' 
                                    : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                                }`}
                            >
                                Outflows
                            </button>
                        </div>
                    </div>
                </div>

                {/* Statements Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50">
                                <th className="p-4 pl-6 text-[10px] font-black uppercase tracking-wider text-slate-400">Taariikhda</th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-wider text-slate-400">Faahfaahinta / Description</th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-wider text-slate-400">Nooca / Type</th>
                                <th className="p-4 text-right text-[10px] font-black uppercase tracking-wider text-slate-400">Qadarka / Amount</th>
                                <th className="p-4 pr-6 text-right text-[10px] font-black uppercase tracking-wider text-slate-400">Rolling Balance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredTransactions.length > 0 ? (
                                filteredTransactions.map((tx: any, idx: number) => {
                                    return (
                                        <tr key={idx} className="hover:bg-slate-50/30 transition-colors group">
                                            <td className="p-4 pl-6 text-xs font-bold text-slate-500">
                                                {new Date(tx.transactionDate).toLocaleDateString()}
                                            </td>
                                            <td className="p-4">
                                                <p className="text-xs font-black text-slate-900 dark:text-white tracking-tight">{tx.description}</p>
                                                {tx.note && <p className="text-[10px] text-slate-400 mt-0.5">{tx.note}</p>}
                                            </td>
                                            <td className="p-4">
                                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                                                    tx.isIncome 
                                                    ? 'bg-emerald-50 text-emerald-600' 
                                                    : 'bg-rose-50 text-rose-600'
                                                }`}>
                                                    {tx.isIncome ? 'Deposit' : 'Withdrawal'}
                                                </span>
                                            </td>
                                            <td className={`p-4 text-right font-black text-xs ${
                                                tx.isIncome ? 'text-emerald-600' : 'text-slate-900 dark:text-white'
                                            }`}>
                                                {tx.isIncome ? '+' : '-'}{Number(tx.amount).toLocaleString()} {account.currency}
                                            </td>
                                            <td className="p-4 pr-6 text-right font-black text-xs text-slate-900 dark:text-white">
                                                {tx.rollingBalance.toLocaleString()} {account.currency}
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center text-slate-400">
                                        <Info size={40} className="opacity-20 mx-auto mb-4" />
                                        <p className="text-xs font-black uppercase tracking-widest">Dhaqdhaqaaqyo laguma helin sifeeyahan</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
