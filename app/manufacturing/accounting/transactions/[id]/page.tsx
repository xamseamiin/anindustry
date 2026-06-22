'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
    Loader2, 
    Save, 
    ArrowLeft, 
    Info, 
    Check,
    Plus,
    X,
    Building2,
    Wallet,
    Trash2
} from 'lucide-react';

const localTranslations = {
    so: {
        pageTitle: "Bedel Dhaqdhaqaaqa",
        pageSubtitle: "Wax ka bedel dhaqdhaqaaq maaliyadeed oo horay u diiwaangashnaa.",
        deleteTxBtn: "Tirtir (Delete)",
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
        modalTitle: "Bedel Lacag",
        modalSubtitle: "Fadlan buuxi xogta hoose si aad u cusboonaysiiso dhaqdhaqaaqa.",
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
        cancel: "Ka Noqo / Dib u Laqo",
        save: "Kaydi Isbedelka",
        saving: "Kaydinaya...",
        errAmount: "Fadlan qor qadar lacageed oo sax ah.",
        errDesc: "Fadlan geli sharaxaadda.",
        successSaved: "Dhaqdhaqaaqa waa la cusboonaysiiyey si guul leh!",
        errServer: "Cilad ayaa dhacday inta lagu guda jiray kaydinta.",
        errNetwork: "Kumbuyuutarku ma awoodo inuu la xiriiro server-ka.",
        quickAddCustomerOpt: "+ Ku dar Macmiil Cusub...",
        quickAddVendorOpt: "+ Ku dar Iibiye Cusub...",
        quickAddNameLabel: "Magaca Cusub",
        quickAddPhoneLabel: "Taleefanka Cusub (Option)"
    },
    en: {
        pageTitle: "Edit Transaction",
        pageSubtitle: "Modify an existing financial transaction record.",
        deleteTxBtn: "Delete",
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
        modalTitle: "Edit Transaction",
        modalSubtitle: "Please fill in the details below to update the transaction.",
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
        cancel: "Cancel / Go Back",
        save: "Save Changes",
        saving: "Saving...",
        errAmount: "Please enter a valid amount.",
        errDesc: "Please enter a description.",
        successSaved: "Transaction updated successfully!",
        errServer: "An error occurred while saving.",
        errNetwork: "Unable to connect to the server.",
        quickAddCustomerOpt: "+ Add New Customer...",
        quickAddVendorOpt: "+ Add New Vendor...",
        quickAddNameLabel: "New Name",
        quickAddPhoneLabel: "New Phone (Optional)"
    }
};

export default function EditTransactionPage({ params }: { params: { id: string } }) {
    const { language } = useLanguage();
    const router = useRouter();
    const tLocal = localTranslations[language as 'so' | 'en'] || localTranslations.so;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    
    // Form fields state
    const [txType, setTxType] = useState('INCOME');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [note, setNote] = useState('');
    const [accountId, setAccountId] = useState('');
    const [fromAccountId, setFromAccountId] = useState('');
    const [toAccountId, setToAccountId] = useState('');
    const [reference, setReference] = useState('');
    
    // For debts
    const [selectedPartyType, setSelectedPartyType] = useState('CUSTOMER');
    const [selectedPartyId, setSelectedPartyId] = useState('');
    const [quickAddName, setQuickAddName] = useState('');
    const [quickAddPhone, setQuickAddPhone] = useState('');

    const [accounts, setAccounts] = useState<any[]>([]);
    const [customers, setCustomers] = useState<any[]>([]);
    const [vendors, setVendors] = useState<any[]>([]);
    
    const [formError, setFormError] = useState('');
    const [formSuccess, setFormSuccess] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [txRes, accRes, custRes, vendRes] = await Promise.all([
                    fetch(`/api/manufacturing/accounting/transactions/${params.id}`),
                    fetch('/api/manufacturing/accounting/accounts'),
                    fetch('/api/manufacturing/customers'),
                    fetch('/api/manufacturing/vendors')
                ]);
                
                let accountsList: any[] = [];
                if (accRes.ok) {
                    const accData = await accRes.json();
                    accountsList = accData.accounts || [];
                    setAccounts(accountsList);
                }
                if (custRes.ok) {
                    const cData = await custRes.json();
                    setCustomers(cData.customers || []);
                }
                if (vendRes.ok) {
                    const vData = await vendRes.json();
                    setVendors(vData.vendors || []);
                }
                
                if (txRes.ok) {
                    const tData = await txRes.json();
                    const tx = tData.transaction;
                    if (tx) {
                        let parsedDesc = tx.description || '';
                        let parsedRef = '';
                        const refMatch = parsedDesc.match(/\(Ref:\s*([^)]+)\)/);
                        if (refMatch) {
                            parsedRef = refMatch[1];
                            parsedDesc = parsedDesc.replace(/\s*\(Ref:\s*[^)]+\)/, '');
                        }
                        
                        setDescription(parsedDesc);
                        setNote(tx.note || '');
                        setReference(parsedRef);
                        setAmount(tx.amount ? String(tx.amount) : '');
                        
                        // Map type
                        if (tx.type === 'TRANSFER_IN' || tx.type === 'TRANSFER_OUT') {
                            setTxType('TRANSFER');
                            setFromAccountId(tx.fromAccountId || (accountsList.length > 0 ? accountsList[0].id : ''));
                            setToAccountId(tx.toAccountId || (accountsList.length > 1 ? accountsList[1].id : (accountsList.length > 0 ? accountsList[0].id : '')));
                        } else {
                            setTxType(tx.type);
                            setAccountId(tx.accountId || (accountsList.length > 0 ? accountsList[0].id : ''));
                        }

                        // Map party details for debt
                        if (tx.customerId) {
                            setSelectedPartyType('CUSTOMER');
                            setSelectedPartyId(tx.customerId);
                        } else if (tx.vendorId) {
                            setSelectedPartyType('VENDOR');
                            setSelectedPartyId(tx.vendorId);
                        } else {
                            if (tx.type === 'DEBT_TAKEN' || tx.type === 'EXPENSE') {
                                setSelectedPartyType('VENDOR');
                            } else {
                                setSelectedPartyType('CUSTOMER');
                            }
                            setSelectedPartyId('');
                        }
                    }
                }
            } catch (err) {
                console.error(err);
                setFormError(tLocal.errNetwork);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [params.id]);

    const handleUpdate = async (e: React.FormEvent) => {
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

        if (txType === 'DEBT_TAKEN' || txType === 'DEBT_GIVEN') {
            if (selectedPartyId === 'NEW_PARTY') {
                if (!quickAddName.trim()) {
                    setFormError(language === 'so' ? 'Fadlan qor magaca cusub.' : 'Please enter the new name.');
                    return;
                }
            } else if (!selectedPartyId) {
                setFormError(language === 'so' ? 'Fadlan dooro qofka ama shirkada.' : 'Please select a customer or vendor.');
                return;
            }
        } else if (txType === 'INCOME' || txType === 'EXPENSE') {
            if (selectedPartyId === 'NEW_PARTY') {
                if (!quickAddName.trim()) {
                    setFormError(language === 'so' ? 'Fadlan qor magaca cusub.' : 'Please enter the new name.');
                    return;
                }
            }
        }

        setSaving(true);
        try {
            let actualPartyId = selectedPartyId;

            // Handle Quick Add customer/vendor registration
            if ((txType === 'INCOME' || txType === 'EXPENSE' || txType === 'DEBT_TAKEN' || txType === 'DEBT_GIVEN') && selectedPartyId === 'NEW_PARTY') {
                if (selectedPartyType === 'CUSTOMER') {
                    const custRes = await fetch('/api/manufacturing/customers', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            name: quickAddName.trim(),
                            phone: quickAddPhone.trim(),
                            type: 'Individual'
                        })
                    });
                    if (!custRes.ok) {
                        const errData = await custRes.json();
                        throw new Error(errData.message || 'Ku guuldareystay in la diwaangaliyo macmiilka.');
                    }
                    const custData = await custRes.json();
                    actualPartyId = custData.customer.id;
                } else {
                    const vendRes = await fetch('/api/manufacturing/vendors', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            name: quickAddName.trim(),
                            phone: quickAddPhone.trim(),
                            type: 'Supplier'
                        })
                    });
                    if (!vendRes.ok) {
                        const errData = await vendRes.json();
                        throw new Error(errData.error || errData.message || 'Ku guuldareystay in la diwaangaliyo iibiyaha.');
                    }
                    const vendData = await vendRes.json();
                    actualPartyId = vendData.vendor.id;
                }
            }

            const payload = {
                amount: parsedAmount,
                type: txType,
                description,
                note,
                reference,
                accountId: txType !== 'TRANSFER' ? accountId : null,
                fromAccountId: txType === 'TRANSFER' ? fromAccountId : null,
                toAccountId: txType === 'TRANSFER' ? toAccountId : null,
                customerId: txType !== 'TRANSFER' && selectedPartyType === 'CUSTOMER' && actualPartyId ? actualPartyId : null,
                vendorId: txType !== 'TRANSFER' && selectedPartyType === 'VENDOR' && actualPartyId ? actualPartyId : null
            };

            const res = await fetch(`/api/manufacturing/accounting/transactions/${params.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (res.ok) {
                setFormSuccess(tLocal.successSaved);
                setTimeout(() => {
                    router.push('/manufacturing/accounting/transactions');
                }, 1500);
            } else {
                setFormError(data.error || data.message || tLocal.errServer);
            }
        } catch (err: any) {
            console.error(err);
            setFormError(err.message || tLocal.errNetwork);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        const confirmMsg = language === 'so' 
            ? 'Ma hubtaa inaad tirtirto dhaqdhaqaaqan? Tirtiristu waxay bedeli doontaa haraaga akoonka.' 
            : 'Are you sure you want to delete this transaction? Deletion will reverse the account balances.';
        
        if (!confirm(confirmMsg)) return;

        setDeleting(true);
        try {
            const res = await fetch(`/api/manufacturing/accounting/transactions/${params.id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                setFormSuccess(language === 'so' ? 'Waa la tirtiray si guul leh!' : 'Transaction deleted successfully!');
                setTimeout(() => {
                    router.push('/manufacturing/accounting/transactions');
                }, 1500);
            } else {
                const data = await res.json();
                setFormError(data.message || tLocal.errServer);
                setDeleting(false);
            }
        } catch (err) {
            console.error(err);
            setFormError(tLocal.errNetwork);
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="animate-spin text-primary" size={48} />
                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Loading Transaction Details...</p>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in pb-12">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => router.back()}
                        className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full transition-colors"
                        title={tLocal.cancel}
                    >
                        <ArrowLeft size={18} className="text-slate-600 dark:text-slate-300" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{tLocal.pageTitle}</h1>
                        <p className="text-slate-500 font-bold text-xs">ID Ref: {reference || `TX-${params.id.slice(0, 8).toUpperCase()}`}</p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting || saving}
                    className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                    <Trash2 size={14} />
                    <span>{tLocal.deleteTxBtn}</span>
                </button>
            </div>

            {/* Main Edit Form Card (Identical Design to Creation Modal) */}
            <div className="bg-white dark:bg-slate-900 w-full rounded-3xl p-8 shadow-2xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                    <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                        <Save size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{tLocal.modalTitle}</h3>
                        <p className="text-slate-500 font-bold text-xs mt-1">{tLocal.modalSubtitle}</p>
                    </div>
                </div>

                <form onSubmit={handleUpdate} className="space-y-6">
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
                            onChange={(e) => {
                                const newType = e.target.value;
                                setTxType(newType);
                                if (newType === 'DEBT_TAKEN' || newType === 'EXPENSE') {
                                    setSelectedPartyType('VENDOR');
                                } else {
                                    setSelectedPartyType('CUSTOMER');
                                }
                                setSelectedPartyId('');
                                setQuickAddName('');
                                setQuickAddPhone('');
                            }}
                            className="w-full px-4 py-3.5 border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-xs font-black text-slate-900 dark:text-white focus:outline-none focus:border-primary focus:bg-white dark:focus:bg-slate-900 transition-all cursor-pointer"
                        >
                            <option value="INCOME">{tLocal.incomeOpt}</option>
                            <option value="EXPENSE">{tLocal.expenseOpt}</option>
                            <option value="TRANSFER">{tLocal.transferOpt}</option>
                            <option value="DEBT_TAKEN">{tLocal.debtTakenOpt}</option>
                            <option value="DEBT_GIVEN">{tLocal.debtGivenOpt}</option>
                        </select>
                    </div>

                    {/* Party Selection */}
                    {(txType === 'INCOME' || txType === 'EXPENSE' || txType === 'DEBT_TAKEN' || txType === 'DEBT_GIVEN') && (
                        <div className="p-4 bg-orange-50 dark:bg-orange-500/10 rounded-2xl border border-orange-100 dark:border-orange-500/20 space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Info size={16} className="text-orange-500" />
                                <h4 className="text-xs font-black text-orange-700 dark:text-orange-400 uppercase tracking-widest">
                                    {txType === 'DEBT_TAKEN' || txType === 'DEBT_GIVEN' ? tLocal.debtDetails : (language === 'so' ? 'Macmiilka / Iibiyaha' : 'Customer / Vendor')}
                                </h4>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-orange-700/70 dark:text-orange-400/70 tracking-wider mb-2">{tLocal.partyTypeLabel}</label>
                                    <select
                                        value={selectedPartyType}
                                        onChange={(e) => {
                                            setSelectedPartyType(e.target.value);
                                            setSelectedPartyId('');
                                            setQuickAddName('');
                                            setQuickAddPhone('');
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
                                        onChange={(e) => {
                                            setSelectedPartyId(e.target.value);
                                            setQuickAddName('');
                                            setQuickAddPhone('');
                                        }}
                                        className="w-full px-4 py-2.5 border-2 border-orange-200 dark:border-orange-500/30 bg-white dark:bg-slate-900 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-orange-500 transition-colors"
                                        required={txType === 'DEBT_TAKEN' || txType === 'DEBT_GIVEN'}
                                    >
                                        <option value="">{tLocal.selectOpt}</option>
                                        <option value="NEW_PARTY">{selectedPartyType === 'CUSTOMER' ? tLocal.quickAddCustomerOpt : tLocal.quickAddVendorOpt}</option>
                                        {selectedPartyType === 'CUSTOMER' ? (
                                            customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                                        ) : (
                                            vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)
                                        )}
                                    </select>
                                </div>
                            </div>
                            {selectedPartyId === 'NEW_PARTY' && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-orange-100 dark:border-orange-500/10">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-orange-700/70 dark:text-orange-400/70 tracking-wider mb-2">{tLocal.quickAddNameLabel}</label>
                                        <input
                                            type="text"
                                            value={quickAddName}
                                            onChange={(e) => setQuickAddName(e.target.value)}
                                            placeholder={selectedPartyType === 'CUSTOMER' ? "Tusaale: Axmed Cali" : "Tusaale: Warshada Baakadaha"}
                                            className="w-full px-4 py-2.5 border-2 border-orange-200 dark:border-orange-500/30 bg-white dark:bg-slate-900 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-orange-500 transition-colors"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-orange-700/70 dark:text-orange-400/70 tracking-wider mb-2">{tLocal.quickAddPhoneLabel}</label>
                                        <input
                                            type="text"
                                            value={quickAddPhone}
                                            onChange={(e) => setQuickAddPhone(e.target.value)}
                                            placeholder="Tusaale: +2519..."
                                            className="w-full px-4 py-2.5 border-2 border-orange-200 dark:border-orange-500/30 bg-white dark:bg-slate-900 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-orange-500 transition-colors"
                                        />
                                    </div>
                                </div>
                            )}
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
                            onClick={() => router.back()}
                            className="px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 transition-colors"
                        >
                            {tLocal.cancel}
                        </button>
                        <button
                            type="submit"
                            disabled={saving || deleting || ((txType === 'DEBT_TAKEN' || txType === 'DEBT_GIVEN') && !selectedPartyId)}
                            className="px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-2 disabled:opacity-55 shadow-lg shadow-primary/30 transition-all active:scale-95"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="animate-spin" size={16} /> {tLocal.saving}
                                </>
                            ) : (
                                <>
                                    <Save size={16} /> {tLocal.save}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
