'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
    ArrowLeft, Save, Loader2, CreditCard, User, 
    Truck, Settings, Award, Layers, Calendar, 
    ClipboardList, Wrench, FileText, Image as ImageIcon, Wallet,
    ChevronDown, DollarSign, CheckCircle2, UserCheck, AlertCircle
} from 'lucide-react';
import Toast from '@/components/common/Toast';

export default function NewExpensePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [loadingConfig, setLoadingConfig] = useState(true);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Master Data from configuration
    const [employees, setEmployees] = useState<any[]>([]);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);

    // Form State
    const [selectedCategoryKey, setSelectedCategoryKey] = useState(''); // 'SALARY' or 'EXPENSE_{id}_{name}'
    const [selectedCategoryName, setSelectedCategoryName] = useState('');
    const [selectedCategoryId, setSelectedCategoryId] = useState('');
    
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [selectedAccountId, setSelectedAccountId] = useState('');
    const [paymentStatus, setPaymentStatus] = useState('PAID');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [receiptFile, setReceiptFile] = useState<File | null>(null);

    // Salary Custom Fields
    const [selectedEmployeeId, setSelectedEmployeeId] = useState('');

    // Custom Expense Fields
    const [transportType, setTransportType] = useState('');
    const [equipmentName, setEquipmentName] = useState('');
    const [rentalPeriod, setRentalPeriod] = useState('');
    const [consultantName, setConsultantName] = useState('');
    const [consultancyType, setConsultancyType] = useState('');

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await fetch('/api/telegram/config');
                if (res.ok) {
                    const data = await res.json();
                    setEmployees(data.employees || []);
                    setAccounts(data.accounts || []);
                    
                    // Filter out Raw Material and Salaries from operational categories list
                    const filteredCats = (data.categories || []).filter(
                        (c: any) => c.name !== 'Raw Material' && c.name !== 'Salaries'
                    );
                    setCategories(filteredCats);

                    // Set default account if available
                    if (data.accounts?.length > 0) {
                        setSelectedAccountId(data.accounts[0].id);
                    }

                    // Default to Utilities category as requested
                    const utilitiesCat = filteredCats.find((c: any) => c.name === 'Utilities');
                    if (utilitiesCat) {
                        setSelectedCategoryKey(`EXPENSE_${utilitiesCat.id}_Utilities`);
                        setSelectedCategoryId(utilitiesCat.id);
                        setSelectedCategoryName('Utilities');
                    } else if (filteredCats.length > 0) {
                        const firstCat = filteredCats[0];
                        setSelectedCategoryKey(`EXPENSE_${firstCat.id}_${firstCat.name}`);
                        setSelectedCategoryId(firstCat.id);
                        setSelectedCategoryName(firstCat.name);
                    }
                } else {
                    setToast({ message: 'Ku guuldareystay in la keeno qaabeynta kharashyada.', type: 'error' });
                }
            } catch (e) {
                console.error('Failed to fetch config:', e);
                setToast({ message: 'Cilad ayaa ku dhacday soo dejinta master data.', type: 'error' });
            } finally {
                setLoadingConfig(false);
            }
        };
        fetchConfig();
    }, []);

    const handleCategoryChange = (val: string) => {
        setSelectedCategoryKey(val);
        
        // Reset dynamic fields
        setSelectedEmployeeId('');
        setSelectedCategoryId('');
        setSelectedCategoryName('');
        setTransportType('');
        setEquipmentName('');
        setRentalPeriod('');
        setConsultantName('');
        setConsultancyType('');
        setAmount('');

        if (val.startsWith('EXPENSE_')) {
            const [_, id, name] = val.split('_');
            setSelectedCategoryId(id);
            setSelectedCategoryName(name);
        }
    };

    const getCategoryIcon = (name: string) => {
        switch (name) {
            case 'SALARY':
                return <User size={20} className="text-emerald-600 dark:text-emerald-400" />;
            case 'Transport & Fuel':
                return <Truck size={20} className="text-sky-600 dark:text-sky-400" />;
            case 'Equipment Rental':
                return <Settings size={20} className="text-purple-600 dark:text-purple-400" />;
            case 'Consultancy & Service':
                return <Award size={20} className="text-indigo-600 dark:text-indigo-400" />;
            default:
                return <Layers size={20} className="text-emerald-600 dark:text-emerald-400" />;
        }
    };

    const selectedEmployee = employees.find(e => e.id === selectedEmployeeId);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (!selectedCategoryKey) {
            setToast({ message: 'Fadlan dooro qaybta kharashka ee kore.', type: 'error' });
            setLoading(false);
            return;
        }

        const isSalary = selectedCategoryKey === 'SALARY';
        
        // Validation
        if (isSalary && !selectedEmployeeId) {
            setToast({ message: 'Fadlan dooro shaqaalaha loo bixinayo mushaharka.', type: 'error' });
            setLoading(false);
            return;
        }

        if (!amount || parseFloat(amount) <= 0) {
            setToast({ message: 'Fadlan geli lacag sax ah.', type: 'error' });
            setLoading(false);
            return;
        }

        if (paymentStatus === 'PAID' && !selectedAccountId) {
            setToast({ message: 'Fadlan dooro account-ka lacagta laga bixiyay.', type: 'error' });
            setLoading(false);
            return;
        }

        try {
            const formData = new FormData();
            formData.append('accountId', selectedAccountId);
            formData.append('note', note);
            formData.append('chatId', ''); // Optional, default will be used on backend
            formData.append('requesterName', 'Web App User');
            formData.append('requesterId', '');
            formData.append('isPaid', paymentStatus === 'PAID' ? 'true' : 'false');
            
            // Append receipt file if available
            if (receiptFile) {
                formData.append('receiptFile', receiptFile);
            }

            if (isSalary) {
                formData.append('type', 'SALARY');
                formData.append('employeeId', selectedEmployeeId);
                formData.append('amount', amount);
            } else {
                formData.append('type', 'EXPENSE');
                formData.append('categoryId', selectedCategoryId);
                formData.append('amount', amount);
                
                if (selectedCategoryName === 'Transport & Fuel') {
                    formData.append('transportType', transportType);
                } else if (selectedCategoryName === 'Equipment Rental') {
                    formData.append('equipmentName', equipmentName);
                    formData.append('rentalPeriod', rentalPeriod);
                } else if (selectedCategoryName === 'Consultancy & Service') {
                    formData.append('consultantName', consultantName);
                    formData.append('consultancyType', consultancyType);
                }
            }

            const response = await fetch('/api/telegram/submit', {
                method: 'POST',
                body: formData // Content-Type is automatically set by browser
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Failed to submit operational cost');
            }

            setToast({ message: 'Kharashka si guul leh ayaa loo diwaangeliyey!', type: 'success' });
            setTimeout(() => router.push('/manufacturing/expenses'), 1000);

        } catch (error: any) {
            console.error(error);
            setToast({ message: error.message || 'Cilad ayaa ku dhacday diwaangelinta.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    if (loadingConfig) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 gap-3">
                <Loader2 className="animate-spin text-emerald-500" size={32} />
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest animate-pulse">Foomka diwaangelinta waa la diyaarinayaa...</p>
            </div>
        );
    }

    const isSalary = selectedCategoryKey === 'SALARY';
    const isExpense = selectedCategoryKey.startsWith('EXPENSE_');

    return (
        <div className="flex flex-col gap-6 p-2 lg:p-4 min-h-screen pb-20 text-gray-900 dark:text-white">

            {/* Header / Breadcrumb navigation */}
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/5 pb-5">
                <div className="flex items-center gap-4">
                    <Link href="/manufacturing/expenses" className="p-2.5 rounded-xl bg-white dark:bg-slate-900/50 hover:bg-gray-100 dark:hover:bg-slate-800 border border-gray-200 dark:border-white/10 hover:border-emerald-500/30 text-gray-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all active:scale-95">
                        <ArrowLeft size={18} />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                            <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em]">AN-Industory Terminal</span>
                        </div>
                        <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white mt-1">Record Expense</h1>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto w-full mt-4">
                {/* Premium Glassmorphic Card Container with Emerald & Sky theme borders */}
                <div className="bg-white/80 dark:bg-slate-900/40 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-3xl p-6 md:p-8 shadow-xl dark:shadow-2xl shadow-slate-200/50 relative overflow-hidden">
                    
                    {/* Theme-supporting top gradient border boundary */}
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500" />
                    
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

                    <div className="flex items-center gap-3 mb-6 pt-2">
                        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                            <CreditCard size={20} />
                        </div>
                        <div>
                            <h3 className="font-black text-gray-900 dark:text-white text-base">Expense Details</h3>
                            <p className="text-[10px] text-gray-400 dark:text-slate-400 uppercase tracking-widest mt-0.5">Fill in the operational fields below</p>
                        </div>
                    </div>

                    {/* Main Selector */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Layers size={11} className="text-emerald-500 dark:text-emerald-400" /> Dooro Qaybta / Category *
                        </label>
                        <div className="relative">
                            <select
                                value={selectedCategoryKey}
                                onChange={(e) => handleCategoryChange(e.target.value)}
                                className="w-full p-3.5 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none font-bold text-sm transition-all appearance-none cursor-pointer"
                            >
                                <option value="">-- Dooro Nooca Qaybta --</option>
                                <option value="SALARY">Bixinta Mushaharka (Salary)</option>
                                {categories.map(c => (
                                    <option key={c.id} value={`EXPENSE_${c.id}_${c.name}`}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-400 dark:text-slate-400">
                                <ChevronDown size={16} />
                            </div>
                        </div>
                    </div>

                    {selectedCategoryKey ? (
                        <form onSubmit={handleSubmit} className="space-y-6 mt-6 pt-6 border-t border-gray-100 dark:border-white/5 animate-in fade-in duration-300">
                            
                            <div className="flex items-center gap-2.5 bg-gray-50 dark:bg-white/[0.02] border border-gray-150 dark:border-white/5 rounded-2xl p-4">
                                <div className="p-2 rounded-xl bg-white dark:bg-white/5 text-emerald-600 dark:text-emerald-400 shadow-sm border border-gray-100 dark:border-none">
                                    {getCategoryIcon(isSalary ? 'SALARY' : selectedCategoryName)}
                                </div>
                                <div>
                                    <h4 className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-slate-400">Selected Category</h4>
                                    <h3 className="font-black text-gray-900 dark:text-white text-sm mt-0.5">
                                        {isSalary ? 'Bixinta Mushaharka (Salary)' : selectedCategoryName}
                                    </h3>
                                </div>
                            </div>

                            {/* --- DYNAMIC SUB-FORMS --- */}
                            
                            {/* SALARY SUB-FORM */}
                            {isSalary && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                            <User size={11} className="text-emerald-500 dark:text-emerald-400" /> Dooro Shaqaalaha *
                                        </label>
                                        <div className="relative">
                                            <select
                                                required
                                                value={selectedEmployeeId}
                                                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                                                className="w-full p-3.5 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none font-bold text-sm transition-all appearance-none cursor-pointer"
                                            >
                                                <option value="">Select Employee...</option>
                                                {employees.map(e => (
                                                    <option key={e.id} value={e.id}>
                                                        {e.fullName} ({e.role})
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-400 dark:text-slate-400">
                                                <ChevronDown size={16} />
                                            </div>
                                        </div>
                                    </div>

                                    {selectedEmployee && (
                                        <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 dark:border-emerald-500/20 rounded-2xl flex flex-col gap-2.5 shadow-inner text-xs md:text-sm animate-in slide-in-from-top-2 duration-300">
                                            <div className="flex items-center gap-2 border-b border-gray-100 dark:border-white/5 pb-2">
                                                <UserCheck size={14} className="text-emerald-600 dark:text-emerald-400" />
                                                <span className="font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider text-[10px]">Employee Salary Status</span>
                                            </div>
                                            <div className="flex justify-between font-bold mt-1">
                                                <span className="text-gray-500 dark:text-slate-400">Mushaarka Bishii:</span>
                                                <span className="text-gray-900 dark:text-white">{selectedEmployee.monthlySalary.toLocaleString()} ETB</span>
                                            </div>
                                            <div className="flex justify-between font-bold">
                                                <span className="text-gray-500 dark:text-slate-400">La Siiyay Bishan:</span>
                                                <span className="text-emerald-600 dark:text-emerald-400">+{selectedEmployee.paidThisMonth.toLocaleString()} ETB</span>
                                            </div>
                                            <div className="flex justify-between font-black border-t border-gray-150 dark:border-white/5 pt-2 mt-1">
                                                <span className="text-gray-900 dark:text-white">U Dhiman (Owed):</span>
                                                <span className="text-sky-600 dark:text-sky-400">{selectedEmployee.dueThisMonth.toLocaleString()} ETB</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* OPERATIONAL CATEGORIES SUB-FORMS */}
                            {isExpense && (
                                <div className="space-y-4">
                                    {selectedCategoryName === 'Transport & Fuel' && (
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                                <Truck size={11} className="text-sky-500 dark:text-sky-400" /> Nooca Gaadiidka *
                                            </label>
                                            <div className="relative">
                                                <select
                                                    required
                                                    value={transportType}
                                                    onChange={(e) => setTransportType(e.target.value)}
                                                    className="w-full p-3.5 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none font-bold text-sm transition-all appearance-none cursor-pointer"
                                                >
                                                    <option value="">Dooro...</option>
                                                    <option value="Shidaal (Fuel)">Shidaal (Fuel)</option>
                                                    <option value="Kirada Gaariga (Car Rental)">Kirada Gaariga (Car Rental)</option>
                                                    <option value="Taxi (Bajaaj / Taxi)">Taxi (Bajaaj / Taxi)</option>
                                                    <option value="Dayactirka Baabuurka (Vehicle Maint.)">Dayactirka Baabuurka (Vehicle Maint.)</option>
                                                    <option value="Mid Kale (Other)">Mid Kale (Other)</option>
                                                </select>
                                                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-400 dark:text-slate-400">
                                                    <ChevronDown size={16} />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {selectedCategoryName === 'Equipment Rental' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                                    <Wrench size={11} className="text-purple-500 dark:text-purple-400" /> Magaca Qalabka *
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    placeholder="Generator, Forklift..."
                                                    value={equipmentName}
                                                    onChange={(e) => setEquipmentName(e.target.value)}
                                                    className="w-full p-3.5 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm transition-all"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                                    <Calendar size={11} className="text-purple-500 dark:text-purple-400" /> Muddada Kirada
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. 3 Maalmood, 1 Bil"
                                                    value={rentalPeriod}
                                                    onChange={(e) => setRentalPeriod(e.target.value)}
                                                    className="w-full p-3.5 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm transition-all"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {selectedCategoryName === 'Consultancy & Service' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                                    <User size={11} className="text-indigo-500 dark:text-indigo-400" /> Magaca La-taliyaha *
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    placeholder="e.g. Auditing Firm"
                                                    value={consultantName}
                                                    onChange={(e) => setConsultantName(e.target.value)}
                                                    className="w-full p-3.5 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm transition-all"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                                    <ClipboardList size={11} className="text-indigo-500 dark:text-indigo-400" /> Adeegga La Qabtay
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. Tax Audit, IT Service"
                                                    value={consultancyType}
                                                    onChange={(e) => setConsultancyType(e.target.value)}
                                                    className="w-full p-3.5 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm transition-all"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* --- COMMON FIELDS --- */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                        <DollarSign size={11} className="text-emerald-500 dark:text-emerald-400" /> Lacagta (Amount in ETB) *
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="0.01"
                                        step="0.01"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full p-3.5 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none font-black text-sm transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                        <Calendar size={11} className="text-sky-500 dark:text-sky-400" /> Taariikhda / Date
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="w-full p-3.5 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm transition-all text-slate-700 dark:text-slate-300"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                        <AlertCircle size={11} className="text-amber-500" /> Payment Status
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={paymentStatus}
                                            onChange={(e) => setPaymentStatus(e.target.value)}
                                            className="w-full p-3.5 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none font-bold text-sm transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="PAID">Paid (Lacagta la bixiyay)</option>
                                            <option value="UNPAID">Unpaid / Pending (Deyn / Dib u bixi)</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-400 dark:text-slate-400">
                                            <ChevronDown size={16} />
                                        </div>
                                    </div>
                                </div>

                                {paymentStatus === 'PAID' && (
                                    <div className="space-y-2 animate-in fade-in duration-300">
                                        <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                            <Wallet size={11} className="text-emerald-500 dark:text-emerald-400" /> Pay From Account *
                                        </label>
                                        <div className="relative">
                                            <select
                                                required
                                                value={selectedAccountId}
                                                onChange={(e) => setSelectedAccountId(e.target.value)}
                                                className="w-full p-3.5 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none font-black text-sm transition-all appearance-none cursor-pointer"
                                            >
                                                <option value="">Select Account...</option>
                                                {accounts.map(acc => (
                                                    <option key={acc.id} value={acc.id}>
                                                        {acc.name} ({parseFloat(acc.balance).toLocaleString()} {acc.currency})
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-400 dark:text-slate-400">
                                                <ChevronDown size={16} />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Description/Note */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <FileText size={11} className="text-gray-400 dark:text-slate-500" /> Faahfaahin / Notes (Description)
                                </label>
                                <textarea
                                    rows={3}
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder={isSalary ? "Sharaxaad kooban oo ku saabsan mushaharkan..." : "Sharaxaad guud oo ku saabsan kharashkan..."}
                                    className="w-full p-3.5 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none resize-none text-sm transition-all"
                                />
                            </div>

                            {/* Receipt Image Upload */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <ImageIcon size={11} className="text-emerald-500 dark:text-emerald-400" /> Soo Geli Receipt (Optional)
                                </label>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 border border-dashed border-gray-200 dark:border-white/10 rounded-2xl bg-gray-50/50 dark:bg-slate-950/50 hover:border-emerald-500/40 hover:bg-gray-100 dark:hover:bg-slate-950 transition-all duration-300">
                                    <div className="relative flex-1">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                                            className="w-full text-xs text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:tracking-widest file:bg-emerald-500/10 file:text-emerald-600 dark:file:text-emerald-400 hover:file:bg-emerald-500/20 transition-all cursor-pointer outline-none"
                                        />
                                    </div>
                                    {receiptFile && (
                                        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl text-xs text-emerald-600 dark:text-emerald-400 max-w-xs truncate">
                                            <CheckCircle2 size={12} className="shrink-0" />
                                            <span className="italic truncate">{receiptFile.name}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Submit & Cancel Buttons */}
                            <div className="pt-4 flex flex-col sm:flex-row gap-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-800/40 text-white dark:text-slate-950 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/10 hover:shadow-emerald-500/25 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 transition-all duration-200"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="animate-spin" size={14} />
                                            Diiwaangelintu Waa Socotaa...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={16} />
                                            Xaree Kharashka
                                        </>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => router.back()}
                                    className="px-8 py-4 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 text-gray-600 dark:text-slate-300 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 dark:hover:bg-white/10 active:scale-[0.98] transition-all"
                                >
                                    Cancel
                                </button>
                            </div>

                        </form>
                    ) : (
                        <div className="border border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-slate-950/20 rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-3 mt-6">
                            <div className="p-4 bg-gray-100 dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 rounded-full text-gray-400 dark:text-slate-500">
                                <Layers size={24} className="opacity-30" />
                            </div>
                            <p className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest max-w-xs leading-relaxed">
                                Fadlan dooro qaybta kharashka ee kore si aad u buuxiso foomka.
                            </p>
                        </div>
                    )}

                </div>
            </div>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}
