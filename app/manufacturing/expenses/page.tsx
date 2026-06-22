'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Plus, Search, Filter, CreditCard, DollarSign,
    PieChart, Calendar, MoreVertical, Flag, Loader2, RefreshCcw, FileText, Trash2
} from 'lucide-react';
import Toast from '@/components/common/Toast';

export default function FactoryExpensesPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [expenses, setExpenses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const fetchExpenses = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/manufacturing/expenses?t=' + Date.now());
            if (res.ok) {
                const data = await res.json();
                setExpenses(data.expenses || []);
            }
        } catch (e) {
            console.error("Failed to load expenses", e);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: string) => {
        setActionLoading(id);
        try {
            const res = await fetch('/api/manufacturing/expenses', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, action: 'APPROVE' })
            });

            if (res.ok) {
                setToast({ message: 'Expense approved and balance updated!', type: 'success' });
                await fetchExpenses();
            } else {
                const data = await res.json();
                setToast({ message: data.error || 'Failed to approve expense', type: 'error' });
            }
        } catch (e) {
            console.error('Error approving expense:', e);
            setToast({ message: 'Error approving expense', type: 'error' });
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Ma hubtaa inaad tirtirto kharashkan? Haraaga koontada waa dib loogu celinayaa haddii la bixiyay.")) {
            return;
        }
        setActionLoading(id);
        try {
            const res = await fetch(`/api/manufacturing/expenses?id=${id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                setToast({ message: 'Kharashkii waa la tirtiray, haraagiina waa la celiyey!', type: 'success' });
                await fetchExpenses();
            } else {
                const data = await res.json();
                setToast({ message: data.error || 'Failed to delete expense', type: 'error' });
            }
        } catch (e) {
            console.error('Error deleting expense:', e);
            setToast({ message: 'Error deleting expense', type: 'error' });
        } finally {
            setActionLoading(null);
        }
    };

    useEffect(() => {
        const timeout = setTimeout(fetchExpenses, 300);
        return () => clearTimeout(timeout);
    }, [searchTerm]);

    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    // Calculate top category
    const categoryCount: any = {};
    expenses.forEach(e => { categoryCount[e.category] = (categoryCount[e.category] || 0) + e.amount });
    const topCategory = Object.keys(categoryCount).reduce((a, b) => categoryCount[a] > categoryCount[b] ? a : b, '-');

    const filteredExpenses = expenses.filter(e =>
        e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col gap-6 p-2 lg:p-4 min-h-screen pb-20">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Factory Expenses</h1>
                    <p className="text-sm text-gray-500 font-medium">Track operational costs and overheads.</p>
                </div>
                <Link href="/manufacturing/expenses/add" className="px-5 py-2.5 bg-[#3498DB] hover:bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/30 flex items-center gap-2 transition-all hover:-translate-y-0.5">
                    <Plus size={18} /> Record Expense
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4">
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-xl">
                        <CreditCard size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Expenses</p>
                        <p className="text-2xl font-black text-gray-900 dark:text-white leading-none mt-1">
                            {loading ? '-' : <>{totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-[10px] text-slate-400 font-bold">ETB</span></>}
                        </p>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4">
                    <div className="p-3 bg-orange-50 dark:bg-orange-900/20 text-orange-600 rounded-xl">
                        <PieChart size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Top Category</p>
                        <p className="text-2xl font-black text-gray-900 dark:text-white leading-none mt-1">
                            {loading ? '-' : topCategory}
                        </p>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4 opacity-50">
                    <div className="p-3 bg-gray-100 dark:bg-gray-700 text-gray-400 rounded-xl">
                        <Flag size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Budget Status</p>
                        <p className="text-2xl font-black text-gray-900 dark:text-white leading-none mt-1">
                            On Track
                        </p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col min-h-[400px]">
                {/* Toolbar */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full md:max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search expenses..."
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#3498DB] outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button onClick={fetchExpenses} className="p-2.5 bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-100 transition-colors">
                        {loading ? <Loader2 className="animate-spin" size={18} /> : <RefreshCcw size={18} />}
                    </button>
                </div>

                {/* Table */}
                <div className="overflow-x-auto flex-1">
                    {loading ? (
                        <div className="p-6 space-y-4">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="h-16 bg-gray-50 dark:bg-gray-900/50 rounded-xl animate-pulse"></div>
                            ))}
                        </div>
                    ) : filteredExpenses.length === 0 ? (
                        <div className="flex flex-col h-64 items-center justify-center text-gray-400 gap-4">
                            <CreditCard size={48} className="opacity-20" />
                            <p>No expenses found.</p>
                            <Link href="/manufacturing/expenses/add" className="text-[#3498DB] hover:underline font-bold text-sm">Record your first expense</Link>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50/50 dark:bg-gray-900/50 text-xs uppercase text-gray-500 font-bold border-b border-gray-100 dark:border-gray-700">
                                <tr>
                                    <th className="px-6 py-4">Expense Details</th>
                                    <th className="px-6 py-4">Category</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Amount</th>
                                    <th className="px-6 py-4 text-right">Date</th>
                                    <th className="px-6 py-4 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {filteredExpenses.map((expense) => (
                                    <tr key={expense.id} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-900 dark:text-white">{expense.description}</div>
                                            <div className="text-xs text-gray-400 font-mono mt-0.5">{expense.id.slice(0, 8)}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg text-xs font-bold text-gray-600 dark:text-gray-300">
                                                {expense.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase
                                                ${expense.status === 'PAID' ? 'bg-green-100 text-green-600' :
                                                    'bg-yellow-100 text-yellow-600'}
                                            `}>
                                                {expense.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-black text-gray-900 dark:text-white">
                                            {expense.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-[10px] text-slate-400 font-bold">ETB</span>
                                        </td>
                                        <td className="px-6 py-4 text-right text-gray-500 text-sm">
                                            {new Date(expense.date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                {expense.status === 'UNPAID' && (
                                                    <button
                                                        disabled={actionLoading === expense.id}
                                                        onClick={() => handleApprove(expense.id)}
                                                        className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-xs shadow-md shadow-green-600/20 transition-all flex items-center justify-center gap-1"
                                                    >
                                                        {actionLoading === expense.id ? <Loader2 size={12} className="animate-spin" /> : 'Ansixi (Approve)'}
                                                    </button>
                                                )}
                                                <button
                                                    disabled={actionLoading === expense.id}
                                                    onClick={() => handleDelete(expense.id)}
                                                    className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                                                    title="Tirtir (Delete)"
                                                >
                                                    {actionLoading === expense.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}
