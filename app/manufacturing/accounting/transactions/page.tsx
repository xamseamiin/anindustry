// app/manufacturing/accounting/transactions/page.tsx - Premium Transactions Journal Page
'use client';

import React, { useState, useEffect } from 'react';
import { 
    Search, 
    ArrowUpRight, 
    ArrowDownRight, 
    History, 
    Plus, 
    Filter, 
    Loader2, 
    Calendar,
    Building2,
    Wallet,
    Info,
    X,
    Check
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const localTranslations = {
    so: {
        pageTitle: "Buugga Guud",
        pageSubtitle: "Liiska dhammaan dhaqdhaqaaqyada maaliyadeed ee shirkadda.",
        addTxBtn: "Diiwaangeli",
        searchPlaceholder: "Ka raadi magaca, note-ka ama reference...",
        allAccounts: "Dhammaan Koontooyinka",
        allTypes: "Dhammaan",
        colDate: "Taariikhda",
        colRef: "Tixraaca",
        colDesc: "Faahfaahinta",
        colAccount: "Koontada",
        colType: "Nooca",
        colAmount: "Qadarka",
        emptyTable: "Ma jiraan wax dhaqdhaqaaq ah oo la helay",
        modalTitle: "Diiwaangeli Lacag",
        modalSubtitle: "U samee dhaqdhaqaaq maaliyadeed si rasmi ah.",
        txTypeLabel: "Nooca Dhaqdhaqaaqa",
        incomeOpt: "💰 Soo Gal",
        expenseOpt: "💸 Kharash",
        transferOpt: "🔄 Xawilaad",
        debtTakenOpt: "📥 Dayn Qaadasho",
        debtGivenOpt: "📤 Dayn Bixin",
        debtDetails: "Faahfaahinta Daynta",
        partyTypeLabel: "Nooca Qofka / Shirkadda",
        customerOpt: "Macmiil",
        vendorOpt: "Iibiye",
        partyNameLabel: "Magaca Qofka / Shirkadda",
        selectOpt: "-- Dooro --",
        amountLabel: "Qadarka Lacagta",
        refLabel: "Tixraaca (Reference)",
        sourceAccLabel: "Laga Wareejinayo",
        destAccLabel: "Lagu Wareejinayo",
        accLabel: "Koontada",
        descLabel: "Sharaxaadda",
        noteLabel: "Faahfaahin Dheeri ah",
        cancel: "Ka Noqo",
        save: "Kaydi",
        saving: "Kaydinaya...",
        errAmount: "Fadlan qor qadar lacageed oo sax ah.",
        errDesc: "Fadlan geli sharaxaadda.",
        successSaved: "Waa la kaydiyey si guul leh!",
        errServer: "Cilad ayaa dhacday inta lagu guda jiray kaydinta.",
        errNetwork: "Kumbuyuutarku ma awoodo inuu la xiriiro server-ka."
    },
    en: {
        pageTitle: "General Ledger",
        pageSubtitle: "List of all financial transactions in the company.",
        addTxBtn: "Add Transaction",
        searchPlaceholder: "Search by name, note, or reference...",
        allAccounts: "All Accounts",
        allTypes: "All",
        colDate: "Date",
        colRef: "Reference",
        colDesc: "Description",
        colAccount: "Account",
        colType: "Type",
        colAmount: "Amount",
        emptyTable: "No transactions found",
        modalTitle: "Record Transaction",
        modalSubtitle: "Create an official financial movement.",
        txTypeLabel: "Transaction Type",
        incomeOpt: "💰 Income",
        expenseOpt: "💸 Expense",
        transferOpt: "🔄 Transfer",
        debtTakenOpt: "📥 Debt Taken",
        debtGivenOpt: "📤 Debt Given",
        debtDetails: "Debt Details",
        partyTypeLabel: "Party Type",
        customerOpt: "Customer",
        vendorOpt: "Vendor",
        partyNameLabel: "Party Name",
        selectOpt: "-- Select --",
        amountLabel: "Amount",
        refLabel: "Reference",
        sourceAccLabel: "Source Account",
        destAccLabel: "Destination Account",
        accLabel: "Account",
        descLabel: "Description",
        noteLabel: "Note",
        cancel: "Cancel",
        save: "Save",
        saving: "Saving...",
        errAmount: "Please enter a valid amount.",
        errDesc: "Please enter a description.",
        successSaved: "Transaction saved successfully!",
        errServer: "An error occurred while saving.",
        errNetwork: "Unable to connect to the server."
    }
};

export default function TransactionsJournalPage() {
    const { language } = useLanguage();
    const tLocal = localTranslations[language as 'so' | 'en'] || localTranslations.so;

    const [transactions, setTransactions] = useState<any[]>([]);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('ALL');
    const [selectedAccount, setSelectedAccount] = useState('');

    const [customers, setCustomers] = useState<any[]>([]);
    const [vendors, setVendors] = useState<any[]>([]);

    // Modal state for Add Transaction
    const [showModal, setShowModal] = useState(false);
    const [txType, setTxType] = useState('INCOME'); // INCOME, EXPENSE, TRANSFER
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [note, setNote] = useState('');
    const [accountId, setAccountId] = useState('');
    const [fromAccountId, setFromAccountId] = useState('');
    const [toAccountId, setToAccountId] = useState('');
    const [reference, setReference] = useState('');
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');
    const [formSuccess, setFormSuccess] = useState('');
    
    // For debts
    const [selectedPartyType, setSelectedPartyType] = useState('CUSTOMER'); // CUSTOMER or VENDOR
    const [selectedPartyId, setSelectedPartyId] = useState('');

    const fetchJournalData = async () => {
        try {
            const [txRes, accRes, custRes, vendRes] = await Promise.all([
                fetch('/api/manufacturing/accounting/transactions'),
                fetch('/api/manufacturing/accounting/accounts'),
                fetch('/api/manufacturing/customers'),
                fetch('/api/manufacturing/vendors')
            ]);
            if (txRes.ok) {
                const data = await txRes.json();
                setTransactions(data.transactions || []);
            }
            if (accRes.ok) {
                const data = await accRes.json();
                const accList = data.accounts || [];
                setAccounts(accList);
                if (accList.length > 0) {
                    setAccountId(accList[0].id);
                    setFromAccountId(accList[0].id);
                    setToAccountId(accList.length > 1 ? accList[1].id : accList[0].id);
                }
            }
            if (custRes.ok) {
                const data = await custRes.json();
                setCustomers(data.customers || []);
            }
            if (vendRes.ok) {
                const data = await vendRes.json();
                setVendors(data.vendors || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJournalData();
    }, []);

    // Handle posting a new manual transaction
    const handleAddTransaction = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');
        setFormSuccess('');

        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            setFormError(tLocal.errAmount);
            return;
        }
        if (!description.trim()) {
            setFormError(tLocal.errDesc);
            return;
        }

        setSaving(true);
        try {
            const res = await fetch('/api/manufacturing/accounting/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: parsedAmount,
                    type: txType,
                    description,
                    note,
                    accountId: txType !== 'TRANSFER' ? accountId : null,
                    fromAccountId: txType === 'TRANSFER' ? fromAccountId : null,
                    toAccountId: txType === 'TRANSFER' ? toAccountId : null,
                    reference,
                    customerId: (txType === 'DEBT_TAKEN' || txType === 'DEBT_GIVEN') && selectedPartyType === 'CUSTOMER' ? selectedPartyId : null,
                    vendorId: (txType === 'DEBT_TAKEN' || txType === 'DEBT_GIVEN') && selectedPartyType === 'VENDOR' ? selectedPartyId : null
                })
            });

            const data = await res.json();
            if (res.ok) {
                setFormSuccess(tLocal.successSaved);
                // Reset form fields
                setAmount('');
                setDescription('');
                setNote('');
                setReference('');
                setSelectedPartyId('');
                
                // Refresh list and close modal
                setTimeout(() => {
                    setShowModal(false);
                    setFormSuccess('');
                    fetchJournalData();
                }, 1200);
            } else {
                setFormError(data.message || tLocal.errServer);
            }
        } catch (err) {
            console.error(err);
            setFormError(tLocal.errNetwork);
        } finally {
            setSaving(false);
        }
    };

    // Filter transactions dynamically
    const filteredTransactions = transactions.filter(tx => {
        const matchesSearch = tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              (tx.reference && tx.reference.toLowerCase().includes(searchQuery.toLowerCase())) ||
                              (tx.note && tx.note.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesType = typeFilter === 'ALL' || tx.type === typeFilter;
        const matchesAccount = !selectedAccount || 
                               tx.accountId === selectedAccount ||
                               tx.fromAccountId === selectedAccount ||
                               tx.toAccountId === selectedAccount;
        return matchesSearch && matchesType && matchesAccount;
    });

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="animate-spin text-primary" size={48} />
                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Opening Transactions Journal...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{tLocal.pageTitle}</h1>
                    <p className="text-slate-500 font-bold text-sm">{tLocal.pageSubtitle}</p>
                </div>
                <button 
                    onClick={() => setShowModal(true)}
                    className="btn-primary flex items-center gap-2 text-xs"
                >
                    <Plus size={16} /> {tLocal.addTxBtn}
                </button>
            </div>

            {/* Controls Card */}
            <div className="card p-6 flex flex-col md:flex-row md:items-center gap-4 justify-between">
                {/* Search Inputs */}
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={tLocal.searchPlaceholder}
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900 text-xs font-bold focus:outline-none focus:border-primary transition-colors"
                    />
                </div>

                {/* Filters Row */}
                <div className="flex flex-wrap items-center gap-3">
                    {/* Account Selector */}
                    <div className="flex items-center gap-2">
                        <Filter size={14} className="text-slate-400" />
                        <select
                            value={selectedAccount}
                            onChange={(e) => setSelectedAccount(e.target.value)}
                            className="px-3 py-2 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900 text-xs font-bold focus:outline-none focus:border-primary transition-colors"
                        >
                            <option value="">{tLocal.allAccounts}</option>
                            {accounts.map(acc => (
                                <option key={acc.id} value={acc.id}>{acc.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Type Buttons */}
                    <div className="flex gap-2 flex-wrap">
                        {['ALL', 'INCOME', 'EXPENSE', 'TRANSFER', 'DEBT_TAKEN', 'DEBT_GIVEN'].map(type => (
                            <button
                                key={type}
                                onClick={() => setTypeFilter(type)}
                                className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors ${
                                    typeFilter === type 
                                    ? 'bg-slate-900 text-white' 
                                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                                }`}
                            >
                                {type === 'ALL' ? tLocal.allTypes : type.replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Ledger Statement Table */}
            <div className="card">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50">
                                <th className="p-4 pl-6 text-[10px] font-black uppercase tracking-wider text-slate-400">{tLocal.colDate}</th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-wider text-slate-400">{tLocal.colRef}</th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-wider text-slate-400">{tLocal.colDesc}</th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-wider text-slate-400">{tLocal.colAccount}</th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-wider text-slate-400">{tLocal.colType}</th>
                                <th className="p-4 pr-6 text-right text-[10px] font-black uppercase tracking-wider text-slate-400">{tLocal.colAmount}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredTransactions.length > 0 ? (
                                filteredTransactions.map((tx: any, idx: number) => {
                                    const isIncome = tx.type === 'INCOME' || tx.type === 'DEBT_TAKEN' || tx.type === 'DEBT_RECEIVED';
                                    const isExpense = tx.type === 'EXPENSE' || tx.type === 'DEBT_GIVEN' || tx.type === 'DEBT_REPAID';
                                    const isTransfer = tx.type === 'TRANSFER' || tx.type === 'TRANSFER_IN' || tx.type === 'TRANSFER_OUT';

                                    return (
                                        <tr key={idx} className="hover:bg-slate-50/30 transition-colors group">
                                            <td className="p-4 pl-6 text-xs font-bold text-slate-500 flex items-center gap-2">
                                                <Calendar size={14} className="text-slate-400" />
                                                {new Date(tx.transactionDate).toLocaleDateString()}
                                            </td>
                                            <td className="p-4 text-xs font-black text-slate-400">
                                                {tx.reference || `TX-${tx.id.slice(0, 6).toUpperCase()}`}
                                            </td>
                                            <td className="p-4">
                                                <p className="text-xs font-black text-slate-900 dark:text-white tracking-tight">{tx.description}</p>
                                                {tx.note && <p className="text-[10px] text-slate-400 mt-0.5">{tx.note}</p>}
                                            </td>
                                            <td className="p-4 text-xs font-bold text-slate-500">
                                                {isTransfer ? (
                                                    <span className="flex items-center gap-1.5">
                                                        <span className="text-rose-500 font-black">{tx.fromAccount?.name}</span>
                                                        <span className="text-slate-400">→</span>
                                                        <span className="text-emerald-500 font-black">{tx.toAccount?.name}</span>
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1">
                                                        {tx.account?.type === 'Bank' ? <Building2 size={12} /> : <Wallet size={12} />}
                                                        <span>{tx.account?.name}</span>
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                                                    isIncome ? 'bg-emerald-100 text-emerald-600' :
                                                    isExpense ? 'bg-rose-100 text-rose-600' :
                                                    'bg-blue-100 text-blue-600'
                                                }`}>
                                                    {tx.type.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className={`p-4 pr-6 text-right font-black text-sm ${
                                                isIncome ? 'text-emerald-600' :
                                                isExpense ? 'text-rose-600' :
                                                'text-blue-600'
                                            }`}>
                                                {isIncome ? '+' : isExpense ? '-' : ''}{Number(tx.amount).toLocaleString()} ETB
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={6} className="py-20 text-center text-slate-400">
                                        <History size={40} className="opacity-20 mx-auto mb-4" />
                                        <p className="text-xs font-black uppercase tracking-widest">{tLocal.emptyTable}</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal: Add Manual Transaction */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl p-8 shadow-2xl relative animate-scale-in border border-slate-200 dark:border-slate-800">
                        <button 
                            onClick={() => setShowModal(false)}
                            className="absolute right-4 top-4 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                            <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                                <Plus size={24} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{tLocal.modalTitle}</h3>
                                <p className="text-slate-500 font-bold text-xs mt-1">{tLocal.modalSubtitle}</p>
                            </div>
                        </div>

                        <form onSubmit={handleAddTransaction} className="space-y-6">
                            {formError && (
                                <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold flex items-center gap-2">
                                    <Info size={16} />
                                    <span>{formError}</span>
                                </div>
                            )}
                            {formSuccess && (
                                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-bold flex items-center gap-2">
                                    <Check size={16} />
                                    <span>{formSuccess}</span>
                                </div>
                            )}

                            {/* Transaction Type Dropdown Selection */}
                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">{tLocal.txTypeLabel}</label>
                                <select
                                    value={txType}
                                    onChange={(e) => setTxType(e.target.value)}
                                    className="w-full px-4 py-3.5 border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-xs font-black text-slate-900 dark:text-white focus:outline-none focus:border-primary focus:bg-white dark:focus:bg-slate-900 transition-all cursor-pointer"
                                >
                                    <option value="INCOME">{tLocal.incomeOpt}</option>
                                    <option value="EXPENSE">{tLocal.expenseOpt}</option>
                                    <option value="TRANSFER">{tLocal.transferOpt}</option>
                                    <option value="DEBT_TAKEN">{tLocal.debtTakenOpt}</option>
                                    <option value="DEBT_GIVEN">{tLocal.debtGivenOpt}</option>
                                </select>
                            </div>

                            {/* Party Selection for Debts */}
                            {(txType === 'DEBT_TAKEN' || txType === 'DEBT_GIVEN') && (
                                <div className="p-4 bg-orange-50 dark:bg-orange-500/10 rounded-2xl border border-orange-100 dark:border-orange-500/20 space-y-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Info size={16} className="text-orange-500" />
                                        <h4 className="text-xs font-black text-orange-700 dark:text-orange-400 uppercase tracking-widest">{tLocal.debtDetails}</h4>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-black uppercase text-orange-700/70 dark:text-orange-400/70 tracking-wider mb-2">{tLocal.partyTypeLabel}</label>
                                            <select
                                                value={selectedPartyType}
                                                onChange={(e) => {
                                                    setSelectedPartyType(e.target.value);
                                                    setSelectedPartyId('');
                                                }}
                                                className="w-full px-4 py-2.5 border-2 border-orange-200 dark:border-orange-500/30 bg-white dark:bg-slate-900 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-orange-500 transition-colors"
                                            >
                                                <option value="CUSTOMER">{tLocal.customerOpt}</option>
                                                <option value="VENDOR">{tLocal.vendorOpt}</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black uppercase text-orange-700/70 dark:text-orange-400/70 tracking-wider mb-2">{tLocal.partyNameLabel}</label>
                                            <select
                                                value={selectedPartyId}
                                                onChange={(e) => setSelectedPartyId(e.target.value)}
                                                className="w-full px-4 py-2.5 border-2 border-orange-200 dark:border-orange-500/30 bg-white dark:bg-slate-900 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-orange-500 transition-colors"
                                                required
                                            >
                                                <option value="">{tLocal.selectOpt}</option>
                                                {selectedPartyType === 'CUSTOMER' ? (
                                                    customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                                                ) : (
                                                    vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)
                                                )}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Amount & Reference */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">{tLocal.amountLabel}</label>
                                    <input
                                        type="number"
                                        step="any"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-sm font-black text-slate-900 dark:text-white focus:outline-none focus:border-primary focus:bg-white dark:focus:bg-slate-900 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-2">{tLocal.refLabel}</label>
                                    <input
                                        type="text"
                                        value={reference}
                                        onChange={(e) => setReference(e.target.value)}
                                        placeholder="Tusaale: CBE-19827"
                                        className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-sm font-black text-slate-900 dark:text-white focus:outline-none focus:border-primary focus:bg-white dark:focus:bg-slate-900 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Account Selectors based on Type */}
                            {txType === 'TRANSFER' ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-2">{tLocal.sourceAccLabel}</label>
                                        <select
                                            value={fromAccountId}
                                            onChange={(e) => setFromAccountId(e.target.value)}
                                            className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-sm font-black text-slate-900 dark:text-white focus:outline-none focus:border-primary focus:bg-white dark:focus:bg-slate-900 transition-all"
                                        >
                                            {accounts.map(acc => (
                                                <option key={acc.id} value={acc.id}>{acc.name} ({acc.balance.toLocaleString()} ETB)</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-2">{tLocal.destAccLabel}</label>
                                        <select
                                            value={toAccountId}
                                            onChange={(e) => setToAccountId(e.target.value)}
                                            className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-sm font-black text-slate-900 dark:text-white focus:outline-none focus:border-primary focus:bg-white dark:focus:bg-slate-900 transition-all"
                                        >
                                            {accounts.map(acc => (
                                                <option key={acc.id} value={acc.id}>{acc.name} ({acc.balance.toLocaleString()} ETB)</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-2">{tLocal.accLabel}</label>
                                    <select
                                        value={accountId}
                                        onChange={(e) => setAccountId(e.target.value)}
                                        className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-sm font-black text-slate-900 dark:text-white focus:outline-none focus:border-primary focus:bg-white dark:focus:bg-slate-900 transition-all"
                                    >
                                        {accounts.map(acc => (
                                            <option key={acc.id} value={acc.id}>{acc.name} ({acc.balance.toLocaleString()} ETB)</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Description & Note */}
                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-2">{tLocal.descLabel}</label>
                                <input
                                    type="text"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Tusaale: Wareejin Petty Cash ama adeeg gaar ah..."
                                    className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-sm font-black text-slate-900 dark:text-white focus:outline-none focus:border-primary focus:bg-white dark:focus:bg-slate-900 transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-2">{tLocal.noteLabel}</label>
                                <textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    rows={3}
                                    placeholder="Faahfaahin dheeri ah ama qoraal gaar ah..."
                                    className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-sm font-black text-slate-900 dark:text-white focus:outline-none focus:border-primary focus:bg-white dark:focus:bg-slate-900 transition-all resize-none"
                                />
                            </div>

                            {/* Save Actions */}
                            <div className="flex items-center justify-end gap-3 pt-6 mt-4 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 transition-colors"
                                >
                                    {tLocal.cancel}
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving || ((txType === 'DEBT_TAKEN' || txType === 'DEBT_GIVEN') && !selectedPartyId)}
                                    className="px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-2 disabled:opacity-55 shadow-lg shadow-primary/30 transition-all active:scale-95"
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="animate-spin" size={16} /> {tLocal.saving}
                                        </>
                                    ) : (
                                        <>
                                            <Plus size={16} strokeWidth={2.5} /> {tLocal.addTxBtn}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
