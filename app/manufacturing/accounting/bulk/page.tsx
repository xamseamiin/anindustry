// app/manufacturing/accounting/bulk/page.tsx - Premium Bulk Entry Terminal
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
    ArrowLeft, 
    Plus, 
    Trash2, 
    Save, 
    Loader2, 
    ClipboardList,
    DollarSign, 
    TrendingUp, 
    TrendingDown,
    Building2,
    Calendar,
    Users,
    Layers,
    FileSpreadsheet,
    HelpCircle
} from 'lucide-react';
import Toast from '@/components/common/Toast';

export default function BulkEntryTerminal() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'sales' | 'expenses'>('sales');
    const [loading, setLoading] = useState(false);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [selectedAccountId, setSelectedAccountId] = useState('');
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Paste Excel Raw Text Modal state
    const [showPasteModal, setShowPasteModal] = useState(false);
    const [pasteRawText, setPasteRawText] = useState('');

    // Sales Grid state
    const [salesRows, setSalesRows] = useState<any[]>([
        { id: 1, date: new Date().toISOString().split('T')[0], customerName: '', qty1L: '', price1L: '20', qty05L: '', price05L: '15', paidAmount: '' }
    ]);

    // Expenses Grid state
    const [expensesRows, setExpensesRows] = useState<any[]>([
        { id: 1, date: new Date().toISOString().split('T')[0], category: 'Utilities', description: '', amount: '', status: 'PAID', accountId: '' }
    ]);

    const expenseCategories = ['Utilities', 'Maintenance', 'Rent', 'Salaries', 'Raw Material', 'Transport', 'Marketing', 'Office Supplies'];

    useEffect(() => {
        const fetchMasterData = async () => {
            try {
                const res = await fetch('/api/manufacturing/accounting/accounts');
                if (res.ok) {
                    const data = await res.json();
                    setAccounts(data.accounts || []);
                    if (data.accounts?.length > 0) {
                        setSelectedAccountId(data.accounts[0].id);
                        // Also initialize first expense row's account
                        setExpensesRows(prev => prev.map(r => ({ ...r, accountId: data.accounts[0].id })));
                    }
                }
            } catch (err) {
                console.error('Error fetching master data:', err);
            }
        };
        fetchMasterData();
    }, []);

    // Helper to calculate sale row values
    const getSaleRowMath = (row: any) => {
        const q1L = parseFloat(row.qty1L) || 0;
        const p1L = parseFloat(row.price1L) || 0;
        const q05L = parseFloat(row.qty05L) || 0;
        const p05L = parseFloat(row.price05L) || 0;
        
        const total1L = q1L * p1L;
        const total05L = q05L * p05L;
        const grandTotal = total1L + total05L;
        const paid = parseFloat(row.paidAmount) || 0;
        const remaining = grandTotal - paid;

        return { total1L, total05L, grandTotal, remaining };
    };

    // Parse Excel Paste Text
    const handlePasteFromExcel = () => {
        if (!pasteRawText.trim()) {
            setShowPasteModal(false);
            return;
        }

        const lines = pasteRawText.trim().split('\n');
        const newRows: any[] = [];
        let parsedCount = 0;

        lines.forEach((line, idx) => {
            // Split by tab (Excel uses Tab space when copying multiple cells)
            const parts = line.split('\t');
            if (parts.length >= 2) {
                // Determine format
                // 1. Tariikh (Date)
                let dateStr = parts[0]?.trim();
                // Standardize dates to YYYY-MM-DD
                if (dateStr && (dateStr.includes('/') || dateStr.includes('-') || dateStr.includes('.'))) {
                    const splitted = dateStr.split(/[\/\-\.]/);
                    if (splitted.length === 3) {
                        let p0 = parseInt(splitted[0], 10);
                        let p1 = parseInt(splitted[1], 10);
                        let yearStr = splitted[2].trim();
                        if (yearStr.length === 2) yearStr = '20' + yearStr;
                        
                        let day = p0;
                        let month = p1;
                        
                        if (p0 > 12 && p1 <= 12) {
                            // p0 is day, p1 is month (DD/MM/YYYY)
                            day = p0;
                            month = p1;
                        } else if (p1 > 12 && p0 <= 12) {
                            // p1 is day, p0 is month (MM/DD/YYYY)
                            day = p1;
                            month = p0;
                        } else {
                            // Both are <= 12. Default to MM/DD/YYYY based on the user's Excel sheet format
                            day = p1;
                            month = p0;
                        }
                        
                        dateStr = `${yearStr}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                    }
                } else if (!dateStr || dateStr.toLowerCase().includes('tariikh') || dateStr.toLowerCase().includes('date')) {
                    // Skip header rows
                    return;
                }

                if (activeTab === 'sales') {
                    // Excel columns map: Tariikh | 1L Qty | 1L Price | 1L Amt | 0.5L Qty | 0.5L Price | 0.5L Amt | Total | Paid | PayDate | Debt | Customer
                    // Usually: Date | 1L | Price | 1L_Amt | 0.5L | Price | 0.5L_Amt | wadarta | bixiyay | Tariikh_pay | kuhadhay | macmiilka
                    // Based on spreadsheet screenshot:
                    // parts[0]: Tariikh
                    // parts[1]: 1L Qty
                    // parts[2]: 1L Price
                    // parts[3]: 1L Amt (skip auto)
                    // parts[4]: 0.5L Qty
                    // parts[5]: 0.5L Price
                    // parts[6]: 0.5L Amt (skip auto)
                    // parts[7]: Total
                    // parts[8]: Paid
                    // parts[9]: Pay Date / Empty
                    // parts[10]: Remaining / Debt
                    // parts[11]: Customer Name
                    
                    const qty1L = parts[1]?.trim() || '';
                    const price1L = parts[2]?.trim() || '20';
                    const qty05L = parts[4]?.trim() || '';
                    const price05L = parts[5]?.trim() || '15';
                    const paidAmount = parts[8]?.trim() || '';
                    const customerName = parts[11]?.trim() || parts[parts.length - 1]?.trim() || '';

                    if (customerName && customerName.toLowerCase() !== 'macmiilka') {
                        newRows.push({
                            id: Date.now() + idx,
                            date: dateStr || new Date().toISOString().split('T')[0],
                            customerName,
                            qty1L,
                            price1L,
                            qty05L,
                            price05L,
                            paidAmount: paidAmount || '0'
                        });
                        parsedCount++;
                    }
                } else {
                    // Expenses format: Date | Category | Description | Amount | Status
                    const category = parts[1]?.trim() || 'Utilities';
                    const description = parts[2]?.trim() || '';
                    const amount = parts[3]?.trim() || '';
                    const status = parts[4]?.trim()?.toUpperCase() || 'PAID';

                    if (description && amount) {
                        newRows.push({
                            id: Date.now() + idx,
                            date: dateStr || new Date().toISOString().split('T')[0],
                            category,
                            description,
                            amount,
                            status,
                            accountId: selectedAccountId
                        });
                        parsedCount++;
                    }
                }
            }
        });

        if (newRows.length > 0) {
            if (activeTab === 'sales') {
                setSalesRows(newRows);
            } else {
                setExpensesRows(newRows);
            }
            setToast({ message: `Successfully loaded ${parsedCount} rows from clipboard!`, type: 'success' });
        } else {
            setToast({ message: 'Could not parse any valid row data. Please check columns.', type: 'error' });
        }

        setPasteRawText('');
        setShowPasteModal(false);
    };

    // Row management: Sales
    const addSaleRow = () => {
        setSalesRows([...salesRows, {
            id: Date.now(),
            date: new Date().toISOString().split('T')[0],
            customerName: '',
            qty1L: '',
            price1L: '20',
            qty05L: '',
            price05L: '15',
            paidAmount: ''
        }]);
    };

    const removeSaleRow = (id: number) => {
        if (salesRows.length > 1) {
            setSalesRows(salesRows.filter(r => r.id !== id));
        }
    };

    const updateSaleRow = (id: number, field: string, value: any) => {
        setSalesRows(salesRows.map(row => {
            if (row.id === id) {
                const updated = { ...row, [field]: value };
                // Dynamic payment autofill: if they type or modify inputs, optionally default paidAmount
                if (field === 'qty1L' || field === 'qty05L' || field === 'price1L' || field === 'price05L') {
                    const math = getSaleRowMath(updated);
                    updated.paidAmount = math.grandTotal.toString();
                }
                return updated;
            }
            return row;
        }));
    };

    // Row management: Expenses
    const addExpenseRow = () => {
        setExpensesRows([...expensesRows, {
            id: Date.now(),
            date: new Date().toISOString().split('T')[0],
            category: 'Utilities',
            description: '',
            amount: '',
            status: 'PAID',
            accountId: selectedAccountId
        }]);
    };

    const removeExpenseRow = (id: number) => {
        if (expensesRows.length > 1) {
            setExpensesRows(expensesRows.filter(r => r.id !== id));
        }
    };

    const updateExpenseRow = (id: number, field: string, value: any) => {
        setExpensesRows(expensesRows.map(row => {
            if (row.id === id) {
                return { ...row, [field]: value };
            }
            return row;
        }));
    };

    // Save All Sales
    const handleSaveSales = async () => {
        // Validate rows
        const validSales = salesRows.filter(r => r.customerName.trim() && (parseFloat(r.qty1L) > 0 || parseFloat(r.qty05L) > 0));
        if (validSales.length === 0) {
            setToast({ message: 'No valid sales rows. Please specify customer and product quantities.', type: 'error' });
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/manufacturing/sales/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sales: validSales,
                    accountId: selectedAccountId
                })
            });

            const data = await res.json();
            if (res.ok) {
                setToast({ message: `Successfully registered ${data.count} bulk sales!`, type: 'success' });
                setTimeout(() => router.push('/manufacturing/sales'), 1200);
            } else {
                setToast({ message: data.error || 'Failed to submit bulk sales.', type: 'error' });
            }
        } catch (e) {
            setToast({ message: 'Network error submitting bulk sales.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    // Save All Expenses
    const handleSaveExpenses = async () => {
        const validExpenses = expensesRows.filter(r => r.description.trim() && parseFloat(r.amount) > 0);
        if (validExpenses.length === 0) {
            setToast({ message: 'No valid expenses rows. Please specify description and amount.', type: 'error' });
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/manufacturing/expenses/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ expenses: validExpenses })
            });

            const data = await res.json();
            if (res.ok) {
                setToast({ message: `Successfully recorded ${data.count} bulk expenses!`, type: 'success' });
                setTimeout(() => router.push('/manufacturing/expenses'), 1200);
            } else {
                setToast({ message: data.error || 'Failed to submit bulk expenses.', type: 'error' });
            }
        } catch (e) {
            setToast({ message: 'Network error submitting bulk expenses.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    // Math for footers
    const totalSalesCalculated = salesRows.reduce((sum, r) => sum + getSaleRowMath(r).grandTotal, 0);
    const totalSalesPaidCalculated = salesRows.reduce((sum, r) => sum + (parseFloat(r.paidAmount) || 0), 0);
    const totalSalesDebtCalculated = salesRows.reduce((sum, r) => sum + getSaleRowMath(r).remaining, 0);

    const totalExpensesCalculated = expensesRows.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);

    return (
        <div className="flex flex-col gap-6 p-2 lg:p-4 min-h-screen pb-20 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/manufacturing/accounting" className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Bulk Entry Terminal</h1>
                        <p className="text-slate-500 font-bold text-sm">Log dozens of records in a high-speed spreadsheet layout.</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowPasteModal(true)}
                        className="px-4 py-2.5 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg active:scale-95"
                    >
                        <ClipboardList size={16} /> Paste from Excel
                    </button>
                </div>
            </div>

            {/* Nav Tabs */}
            <div className="flex border-b border-slate-100 dark:border-slate-800">
                <button
                    onClick={() => setActiveTab('sales')}
                    className={`pb-4 px-6 text-xs font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${
                        activeTab === 'sales' 
                            ? 'border-emerald-500 text-emerald-600' 
                            : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                >
                    <FileSpreadsheet size={16} /> Bulk Sales Grid
                </button>
                <button
                    onClick={() => setActiveTab('expenses')}
                    className={`pb-4 px-6 text-xs font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${
                        activeTab === 'expenses' 
                            ? 'border-rose-500 text-rose-600' 
                            : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                >
                    <TrendingDown size={16} /> Bulk Expenses Grid
                </button>
            </div>

            {/* Global Settings (e.g. Deposit Account) */}
            <div className="card p-6 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl">
                        <Building2 size={20} />
                    </div>
                    <div>
                        <p className="text-xs font-black uppercase tracking-wider text-slate-400">Account (Bank/Cash)</p>
                        <p className="text-[10px] text-slate-400 font-bold mt-0.5">Select destination account for all paid amounts in this batch.</p>
                    </div>
                </div>
                <select
                    value={selectedAccountId}
                    onChange={(e) => {
                        setSelectedAccountId(e.target.value);
                        // Also update accountId for all expenses rows
                        setExpensesRows(expensesRows.map(r => ({ ...r, accountId: e.target.value })));
                    }}
                    className="w-full md:w-80 px-4 py-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl text-xs font-bold focus:outline-none focus:border-primary transition-colors"
                >
                    {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.name} ({acc.balance.toLocaleString()} ETB)</option>
                    ))}
                </select>
            </div>

            {/* Sales Grid */}
            {activeTab === 'sales' && (
                <div className="space-y-6">
                    <div className="card overflow-visible">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[1200px]">
                                <thead>
                                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50">
                                        <th className="p-3 pl-6 text-[10px] font-black uppercase tracking-wider text-slate-400 w-36">Tariikh (Date)</th>
                                        <th className="p-3 text-[10px] font-black uppercase tracking-wider text-slate-400 w-44">Macmiilka (Customer)</th>
                                        <th className="p-3 text-center text-[10px] font-black uppercase tracking-wider text-slate-400 w-24">1L Qty</th>
                                        <th className="p-3 text-center text-[10px] font-black uppercase tracking-wider text-slate-400 w-24">1L Price</th>
                                        <th className="p-3 text-right text-[10px] font-black uppercase tracking-wider text-slate-400 w-28">1L Amount</th>
                                        <th className="p-3 text-center text-[10px] font-black uppercase tracking-wider text-slate-400 w-24">0.5L Qty</th>
                                        <th className="p-3 text-center text-[10px] font-black uppercase tracking-wider text-slate-400 w-24">0.5L Price</th>
                                        <th className="p-3 text-right text-[10px] font-black uppercase tracking-wider text-slate-400 w-28">0.5L Amount</th>
                                        <th className="p-3 text-right text-[10px] font-black uppercase tracking-wider text-slate-400 w-32">Wadarta (Total)</th>
                                        <th className="p-3 text-right text-[10px] font-black uppercase tracking-wider text-slate-400 w-32">Bixiyay (Paid)</th>
                                        <th className="p-3 text-right text-[10px] font-black uppercase tracking-wider text-slate-400 w-32 text-rose-600">Kuhadhay (Debt)</th>
                                        <th className="p-3 pr-6 text-center text-[10px] font-black uppercase tracking-wider text-slate-400 w-16">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {salesRows.map((row, index) => {
                                        const math = getSaleRowMath(row);
                                        return (
                                            <tr key={row.id} className="hover:bg-slate-50/20 transition-colors">
                                                {/* Date */}
                                                <td className="p-3 pl-6">
                                                    <input
                                                        type="date"
                                                        value={row.date}
                                                        onChange={(e) => updateSaleRow(row.id, 'date', e.target.value)}
                                                        className="w-full p-2 border border-slate-100 dark:border-slate-800 bg-transparent rounded-lg text-xs font-bold focus:outline-none focus:border-emerald-500"
                                                    />
                                                </td>

                                                {/* Customer Name */}
                                                <td className="p-3">
                                                    <input
                                                        type="text"
                                                        placeholder="Name (e.g. hamse)"
                                                        value={row.customerName}
                                                        onChange={(e) => updateSaleRow(row.id, 'customerName', e.target.value)}
                                                        className="w-full p-2 border border-slate-100 dark:border-slate-800 bg-transparent rounded-lg text-xs font-black focus:outline-none focus:border-emerald-500"
                                                    />
                                                </td>

                                                {/* 1L Qty */}
                                                <td className="p-3 text-center">
                                                    <input
                                                        type="number"
                                                        placeholder="0"
                                                        value={row.qty1L}
                                                        onChange={(e) => updateSaleRow(row.id, 'qty1L', e.target.value)}
                                                        className="w-full text-center p-2 border border-slate-100 dark:border-slate-800 bg-transparent rounded-lg text-xs font-bold focus:outline-none focus:border-emerald-500"
                                                    />
                                                </td>

                                                {/* 1L Price */}
                                                <td className="p-3 text-center">
                                                    <input
                                                        type="number"
                                                        placeholder="20"
                                                        value={row.price1L}
                                                        onChange={(e) => updateSaleRow(row.id, 'price1L', e.target.value)}
                                                        className="w-full text-center p-2 border border-slate-100 dark:border-slate-800 bg-transparent rounded-lg text-xs font-bold focus:outline-none focus:border-emerald-500"
                                                    />
                                                </td>

                                                {/* 1L Amount */}
                                                <td className="p-3 text-right text-xs font-bold text-slate-500">
                                                    {math.total1L.toLocaleString()} ETB
                                                </td>

                                                {/* 0.5L Qty */}
                                                <td className="p-3 text-center">
                                                    <input
                                                        type="number"
                                                        placeholder="0"
                                                        value={row.qty05L}
                                                        onChange={(e) => updateSaleRow(row.id, 'qty05L', e.target.value)}
                                                        className="w-full text-center p-2 border border-slate-100 dark:border-slate-800 bg-transparent rounded-lg text-xs font-bold focus:outline-none focus:border-emerald-500"
                                                    />
                                                </td>

                                                {/* 0.5L Price */}
                                                <td className="p-3 text-center">
                                                    <input
                                                        type="number"
                                                        placeholder="15"
                                                        value={row.price05L}
                                                        onChange={(e) => updateSaleRow(row.id, 'price05L', e.target.value)}
                                                        className="w-full text-center p-2 border border-slate-100 dark:border-slate-800 bg-transparent rounded-lg text-xs font-bold focus:outline-none focus:border-emerald-500"
                                                    />
                                                </td>

                                                {/* 0.5L Amount */}
                                                <td className="p-3 text-right text-xs font-bold text-slate-500">
                                                    {math.total05L.toLocaleString()} ETB
                                                </td>

                                                {/* Total */}
                                                <td className="p-3 text-right text-xs font-black text-slate-900 dark:text-white">
                                                    {math.grandTotal.toLocaleString()} ETB
                                                </td>

                                                {/* Paid Amount */}
                                                <td className="p-3">
                                                    <input
                                                        type="number"
                                                        placeholder="0.00"
                                                        value={row.paidAmount}
                                                        onChange={(e) => updateSaleRow(row.id, 'paidAmount', e.target.value)}
                                                        className="w-full text-right p-2 border border-slate-100 dark:border-slate-800 bg-transparent rounded-lg text-xs font-black focus:outline-none focus:border-emerald-500"
                                                    />
                                                </td>

                                                {/* Debt Amount */}
                                                <td className={`p-3 text-right text-xs font-black ${math.remaining > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                    {math.remaining.toLocaleString()} ETB
                                                </td>

                                                {/* Actions */}
                                                <td className="p-3 pr-6 text-center">
                                                    <button
                                                        onClick={() => removeSaleRow(row.id)}
                                                        disabled={salesRows.length === 1}
                                                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-30"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                {/* Footer totals */}
                                <tfoot className="bg-slate-50/50 border-t border-slate-100 dark:border-slate-800 font-black text-xs text-slate-900 dark:text-white">
                                    <tr>
                                        <td colSpan={2} className="p-4 pl-6 text-left uppercase tracking-wider text-slate-400">Total Batch Summary</td>
                                        <td colSpan={6} />
                                        <td className="p-4 text-right text-sm">{totalSalesCalculated.toLocaleString()} ETB</td>
                                        <td className="p-4 text-right text-sm text-emerald-600">{totalSalesPaidCalculated.toLocaleString()} ETB</td>
                                        <td className="p-4 text-right text-sm text-rose-600">{totalSalesDebtCalculated.toLocaleString()} ETB</td>
                                        <td className="p-4" />
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    {/* Actions bar */}
                    <div className="flex items-center justify-between">
                        <button
                            onClick={addSaleRow}
                            className="px-4 py-2.5 border border-dashed border-emerald-500/30 hover:border-emerald-500 hover:bg-emerald-50 text-emerald-600 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                        >
                            <Plus size={16} /> Add Sale Row
                        </button>

                        <button
                            onClick={handleSaveSales}
                            disabled={loading}
                            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 disabled:opacity-50 transition-colors shadow-lg shadow-emerald-500/20"
                        >
                            {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                            Save All Bulk Sales
                        </button>
                    </div>
                </div>
            )}

            {/* Expenses Grid */}
            {activeTab === 'expenses' && (
                <div className="space-y-6">
                    <div className="card overflow-visible">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[1000px]">
                                <thead>
                                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50">
                                        <th className="p-3 pl-6 text-[10px] font-black uppercase tracking-wider text-slate-400 w-44">Tariikh (Date)</th>
                                        <th className="p-3 text-[10px] font-black uppercase tracking-wider text-slate-400 w-48">Category</th>
                                        <th className="p-3 text-[10px] font-black uppercase tracking-wider text-slate-400">Description (Fiiro/Qoraal)</th>
                                        <th className="p-3 text-right text-[10px] font-black uppercase tracking-wider text-slate-400 w-36">Lacagta (Amount)</th>
                                        <th className="p-3 text-center text-[10px] font-black uppercase tracking-wider text-slate-400 w-36">Status</th>
                                        <th className="p-3 pr-6 text-center text-[10px] font-black uppercase tracking-wider text-slate-400 w-16">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {expensesRows.map((row) => (
                                        <tr key={row.id} className="hover:bg-slate-50/20 transition-colors">
                                            {/* Date */}
                                            <td className="p-3 pl-6">
                                                <input
                                                    type="date"
                                                    value={row.date}
                                                    onChange={(e) => updateExpenseRow(row.id, 'date', e.target.value)}
                                                    className="w-full p-2 border border-slate-100 dark:border-slate-800 bg-transparent rounded-lg text-xs font-bold focus:outline-none focus:border-rose-500"
                                                />
                                            </td>

                                            {/* Category */}
                                            <td className="p-3">
                                                <select
                                                    value={row.category}
                                                    onChange={(e) => updateExpenseRow(row.id, 'category', e.target.value)}
                                                    className="w-full p-2 border border-slate-100 dark:border-slate-800 bg-transparent rounded-lg text-xs font-bold focus:outline-none focus:border-rose-500"
                                                >
                                                    {expenseCategories.map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                            </td>

                                            {/* Description */}
                                            <td className="p-3">
                                                <input
                                                    type="text"
                                                    placeholder="Description (e.g. Electric Bill)"
                                                    value={row.description}
                                                    onChange={(e) => updateExpenseRow(row.id, 'description', e.target.value)}
                                                    className="w-full p-2 border border-slate-100 dark:border-slate-800 bg-transparent rounded-lg text-xs font-bold focus:outline-none focus:border-rose-500"
                                                />
                                            </td>

                                            {/* Amount */}
                                            <td className="p-3">
                                                <input
                                                    type="number"
                                                    placeholder="0.00"
                                                    value={row.amount}
                                                    onChange={(e) => updateExpenseRow(row.id, 'amount', e.target.value)}
                                                    className="w-full text-right p-2 border border-slate-100 dark:border-slate-800 bg-transparent rounded-lg text-xs font-black focus:outline-none focus:border-rose-500"
                                                />
                                            </td>

                                            {/* Status */}
                                            <td className="p-3">
                                                <select
                                                    value={row.status}
                                                    onChange={(e) => updateExpenseRow(row.id, 'status', e.target.value)}
                                                    className="w-full p-2 border border-slate-100 dark:border-slate-800 bg-transparent rounded-lg text-xs font-bold focus:outline-none focus:border-rose-500 text-center"
                                                >
                                                    <option value="PAID">Paid</option>
                                                    <option value="UNPAID">Unpaid</option>
                                                </select>
                                            </td>

                                            {/* Actions */}
                                            <td className="p-3 pr-6 text-center">
                                                <button
                                                    onClick={() => removeExpenseRow(row.id)}
                                                    disabled={expensesRows.length === 1}
                                                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-30"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                {/* Footer totals */}
                                <tfoot className="bg-slate-50/50 border-t border-slate-100 dark:border-slate-800 font-black text-xs text-slate-900 dark:text-white">
                                    <tr>
                                        <td colSpan={2} className="p-4 pl-6 text-left uppercase tracking-wider text-slate-400">Total Expenses Summary</td>
                                        <td />
                                        <td className="p-4 text-right text-sm text-rose-600">{totalExpensesCalculated.toLocaleString()} ETB</td>
                                        <td colSpan={2} />
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    {/* Actions bar */}
                    <div className="flex items-center justify-between">
                        <button
                            onClick={addExpenseRow}
                            className="px-4 py-2.5 border border-dashed border-rose-500/30 hover:border-rose-500 hover:bg-rose-50 text-rose-600 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                        >
                            <Plus size={16} /> Add Expense Row
                        </button>

                        <button
                            onClick={handleSaveExpenses}
                            disabled={loading}
                            className="px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 disabled:opacity-50 transition-colors shadow-lg shadow-rose-500/20"
                        >
                            {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                            Save All Bulk Expenses
                        </button>
                    </div>
                </div>
            )}

            {/* Paste Excel Raw Text Modal */}
            {showPasteModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="card w-full max-w-2xl p-8 shadow-2xl relative animate-scale-in">
                        <button 
                            onClick={() => setShowPasteModal(false)}
                            className="absolute right-4 top-4 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-400 transition-colors"
                        >
                            <Trash2 size={20} />
                        </button>

                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-slate-900 text-white rounded-2xl">
                                <ClipboardList size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black tracking-tight">Paste Excel Sheet Raw Text</h3>
                                <p className="text-slate-400 font-bold text-xs">Copy cells directly from Excel/Google Sheets, paste them here, and they will populate instantly.</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl text-[10px] text-slate-500 font-black uppercase tracking-wider flex flex-col gap-1.5 border border-slate-100 dark:border-slate-800">
                                <span className="text-primary">Required Clipboard Layout structure:</span>
                                {activeTab === 'sales' ? (
                                    <span>Tariikh (Date) | 1L Qty | 1L Price | 1L Amt | 0.5L Qty | 0.5L Price | 0.5L Amt | Total | Paid | PayDate | Debt | Customer</span>
                                ) : (
                                    <span>Tariikh (Date) | Category | Description | Amount | Status</span>
                                )}
                            </div>

                            <textarea
                                value={pasteRawText}
                                onChange={(e) => setPasteRawText(e.target.value)}
                                rows={8}
                                placeholder="Paste raw text here... (Ctrl+V)"
                                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 bg-transparent rounded-xl text-xs font-bold focus:outline-none focus:border-primary transition-colors font-mono"
                            />

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    onClick={() => setShowPasteModal(false)}
                                    className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-600 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handlePasteFromExcel}
                                    className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                                >
                                    Load Paste Data
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}
