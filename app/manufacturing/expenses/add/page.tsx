'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
    ArrowLeft, Save, Loader2, CreditCard, User, 
    Truck, Settings, Award, Layers, Calendar, 
    ClipboardList, Wrench, FileText, Image as ImageIcon, Wallet 
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
                return <User size={20} className="text-blue-500" />;
            case 'Transport & Fuel':
                return <Truck size={20} className="text-amber-500" />;
            case 'Equipment Rental':
                return <Settings size={20} className="text-purple-500" />;
            case 'Consultancy & Service':
                return <Award size={20} className="text-indigo-500" />;
            default:
                return <Layers size={20} className="text-gray-500 dark:text-gray-400" />;
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
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 gap-3">
                <Loader2 className="animate-spin text-blue-500" size={32} />
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest animate-pulse">Foomka diwaangelinta waa la diyaarinayaa...</p>
            </div>
        );
    }

    const isSalary = selectedCategoryKey === 'SALARY';
    const isExpense = selectedCategoryKey.startsWith('EXPENSE_');

    return (
        <div className="flex flex-col gap-6 p-2 lg:p-4 min-h-screen pb-20">

            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/manufacturing/expenses" className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white">Record Expense</h1>
                    <p className="text-sm font-medium text-gray-500">Log new operational cost</p>
                </div>
            </div>

            <div className="max-w-2xl mx-auto w-full">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-6">

                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                            <CreditCard size={20} />
                        </div>
                        <h3 className="font-bold text-gray-900 dark:text-white">Expense Category Selection</h3>
                    </div>

                    {/* Main Selector */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Dooro Qaybta/Category *</label>
                        <select
                            value={selectedCategoryKey}
                            onChange={(e) => handleCategoryChange(e.target.value)}
                            className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                        >
                            <option value="">-- Dooro Nooca Qaybta --</option>
                            <option value="SALARY">👤 Bixinta Mushaharka (Salary)</option>
                            {categories.map(c => (
                                <option key={c.id} value={`EXPENSE_${c.id}_${c.name}`}>
                                    ⚙️ {c.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {selectedCategoryKey && (
                        <form onSubmit={handleSubmit} className="space-y-6 border-t border-gray-100 dark:border-gray-700 pt-6 animate-in fade-in duration-300">
                            
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400">
                                    {getCategoryIcon(isSalary ? 'SALARY' : selectedCategoryName)}
                                </div>
                                <h3 className="font-bold text-gray-900 dark:text-white">
                                    {isSalary ? 'Salary Details' : `${selectedCategoryName} Details`}
                                </h3>
                            </div>

                            {/* --- DYNAMIC SUB-FORMS --- */}
                            
                            {/* SALARY SUB-FORM */}
                            {isSalary && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Dooro Shaqaalaha *</label>
                                        <select
                                            required
                                            value={selectedEmployeeId}
                                            onChange={(e) => setSelectedEmployeeId(e.target.value)}
                                            className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                                        >
                                            <option value="">Select Employee...</option>
                                            {employees.map(e => (
                                                <option key={e.id} value={e.id}>
                                                    {e.fullName} ({e.role})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {selectedEmployee && (
                                        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-xl flex flex-col gap-2 shadow-inner text-xs md:text-sm">
                                            <div className="flex justify-between font-bold">
                                                <span className="text-gray-500">Mushaarka Bishii:</span>
                                                <span className="text-gray-900 dark:text-white">{selectedEmployee.monthlySalary.toLocaleString()} ETB</span>
                                            </div>
                                            <div className="flex justify-between font-bold">
                                                <span className="text-gray-500">La Siiyay Bishan:</span>
                                                <span className="text-emerald-500">{selectedEmployee.paidThisMonth.toLocaleString()} ETB</span>
                                            </div>
                                            <div className="flex justify-between font-black border-t border-gray-200 dark:border-gray-700 pt-2 mt-1">
                                                <span className="text-gray-950 dark:text-white">U Dhiman (Owed):</span>
                                                <span className="text-blue-600 dark:text-blue-400">{selectedEmployee.dueThisMonth.toLocaleString()} ETB</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* OPERATIONAL CATEGORIES SUB-FORMS */}
                            {isExpense && (
                                <div className="space-y-4">
                                    {selectedCategoryName === 'Transport & Fuel' && (
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nooca Gaadiidka / Transport Type *</label>
                                            <select
                                                required
                                                value={transportType}
                                                onChange={(e) => setTransportType(e.target.value)}
                                                className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                                            >
                                                <option value="">Dooro...</option>
                                                <option value="Shidaal (Fuel)">Shidaal (Fuel)</option>
                                                <option value="Kirada Gaariga (Car Rental)">Kirada Gaariga (Car Rental)</option>
                                                <option value="Taxi (Bajaaj / Taxi)">Taxi (Bajaaj / Taxi)</option>
                                                <option value="Dayactirka Baabuurka (Vehicle Maint.)">Dayactirka Baabuurka (Vehicle Maint.)</option>
                                                <option value="Mid Kale (Other)">Mid Kale (Other)</option>
                                            </select>
                                        </div>
                                    )}

                                    {selectedCategoryName === 'Equipment Rental' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Magaca Qalabka / Equipment Name *</label>
                                                <input
                                                    type="text"
                                                    required
                                                    placeholder="e.g. Generator, Forklift"
                                                    value={equipmentName}
                                                    onChange={(e) => setEquipmentName(e.target.value)}
                                                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Muddada Kirada / Rental Period</label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. 3 Maalmood, 1 Bil"
                                                    value={rentalPeriod}
                                                    onChange={(e) => setRentalPeriod(e.target.value)}
                                                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {selectedCategoryName === 'Consultancy & Service' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Magaca La-taliyaha / Consultant Name *</label>
                                                <input
                                                    type="text"
                                                    required
                                                    placeholder="e.g. Auditing Firm"
                                                    value={consultantName}
                                                    onChange={(e) => setConsultantName(e.target.value)}
                                                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Adeegga La Qabtay / Consultancy Type</label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. Tax Audit, Technical Service"
                                                    value={consultancyType}
                                                    onChange={(e) => setConsultancyType(e.target.value)}
                                                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* --- COMMON FIELDS --- */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Lacagta (Amount in ETB) *</label>
                                    <input
                                        type="number"
                                        required
                                        min="0.01"
                                        step="0.01"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Taariikhda / Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Payment Status</label>
                                    <select
                                        value={paymentStatus}
                                        onChange={(e) => setPaymentStatus(e.target.value)}
                                        className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                                    >
                                        <option value="PAID">Paid</option>
                                        <option value="UNPAID">Unpaid / Pending</option>
                                    </select>
                                </div>

                                {paymentStatus === 'PAID' && (
                                    <div className="animate-in fade-in duration-300">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Pay From Account *</label>
                                        <select
                                            required
                                            value={selectedAccountId}
                                            onChange={(e) => setSelectedAccountId(e.target.value)}
                                            className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                                        >
                                            <option value="">Select Account...</option>
                                            {accounts.map(acc => (
                                                <option key={acc.id} value={acc.id}>
                                                    {acc.name} ({parseFloat(acc.balance).toLocaleString()} {acc.currency})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>

                            {/* Description/Note */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Faahfaahin / Notes (Description)</label>
                                <textarea
                                    rows={3}
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder={isSalary ? "Mushaharka bisha..." : "Sharaxaad guud oo ku saabsan kharashkan..."}
                                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                />
                            </div>

                            {/* Receipt Image Upload */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1.5">
                                    <ImageIcon size={14} className="text-gray-500" /> Soo Geli Receipt (Ikhtiyaari)
                                </label>
                                <div className="mt-1 flex items-center gap-4 p-3 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900/30">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                                        className="text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 dark:file:bg-blue-900/30 file:text-blue-700 dark:file:text-blue-400 hover:file:bg-blue-100 transition-all cursor-pointer"
                                    />
                                    {receiptFile && (
                                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium italic truncate max-w-xs">
                                            {receiptFile.name} ({(receiptFile.size / 1024).toFixed(1)} KB)
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Submit & Cancel Buttons */}
                            <div className="pt-4 flex gap-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 transition-all"
                                >
                                    {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                                    Save Expense
                                </button>
                                <button
                                    type="button"
                                    onClick={() => router.back()}
                                    className="px-6 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                                >
                                    Cancel
                                </button>
                            </div>

                        </form>
                    )}

                </div>
            </div>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}
