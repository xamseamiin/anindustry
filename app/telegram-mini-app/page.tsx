'use client';

import React, { useState, useEffect } from 'react';
import Script from 'next/script';
import { 
    Loader2, CheckCircle2, DollarSign, Wallet, 
    FileText, User, Tag, Truck, Settings, ShoppingBag, 
    Award, ArrowRight, Layers, Factory, Package,
    Hash, Banknote, Calendar, ClipboardList, Wrench
} from 'lucide-react';

// Safe localStorage helpers for iOS WebView where localStorage can throw SecurityError
const safeGetItem = (key: string): string | null => {
    try { return localStorage.getItem(key); } catch { return null; }
};
const safeSetItem = (key: string, value: string): void => {
    try { localStorage.setItem(key, value); } catch { /* silently fail */ }
};

// Shared Telegram scripts rendered in every return path
const TelegramScripts = () => (
    <>
        <script dangerouslySetInnerHTML={{ __html: `
            if (typeof window !== 'undefined' && !window.TelegramGameProxy) {
                window.TelegramGameProxy = {
                    receiveEvent: function(eventType, eventData) {
                        console.log('TelegramGameProxy.receiveEvent called:', eventType, eventData);
                    }
                };
            }
        ` }} />
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="afterInteractive" />
    </>
);

const getCategoryIcon = (name: string) => {
    switch (name) {
        case 'Salaries':
        case 'SALARY':
            return <User size={16} className="text-blue-400" />;
        case 'Raw Material':
        case 'RAW_MATERIAL':
            return <ShoppingBag size={16} className="text-emerald-400" />;
        case 'Transport & Fuel':
            return <Truck size={16} className="text-amber-400" />;
        case 'Equipment Rental':
            return <Settings size={16} className="text-purple-400" />;
        case 'Consultancy & Service':
            return <Award size={16} className="text-indigo-400" />;
        default:
            return <Layers size={16} className="text-slate-400" />;
    }
};

export default function TelegramMiniAppPage() {
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [offlineSubmitted, setOfflineSubmitted] = useState(false);
    const [syncingOffline, setSyncingOffline] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    
    // Master data
    const [employees, setEmployees] = useState<any[]>([]);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [vendors, setVendors] = useState<any[]>([]);
    const [materials, setMaterials] = useState<any[]>([]);
    
    // Unified Main Dropdown Selection
    const [selectedCategoryKey, setSelectedCategoryKey] = useState(''); // 'SALARY', 'RAW_MATERIAL', or 'EXPENSE_{id}_{name}'

    // General Form Fields
    const [selectedAccountId, setSelectedAccountId] = useState('');
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [chatId, setChatId] = useState('');

    // Metadata
    const [requesterName, setRequesterName] = useState('WebApp User');
    const [requesterId, setRequesterId] = useState('');
    
    // Tab 1: Salary Fields
    const [selectedEmployeeId, setSelectedEmployeeId] = useState('');

    // Tab 2: Expense Fields (dynamic based on selected key)
    const [selectedCategoryId, setSelectedCategoryId] = useState('');
    const [selectedCategoryName, setSelectedCategoryName] = useState('');
    // Expense Custom Fields
    const [transportType, setTransportType] = useState('');
    const [equipmentName, setEquipmentName] = useState('');
    const [rentalPeriod, setRentalPeriod] = useState('');
    const [consultantName, setConsultantName] = useState('');
    const [consultancyType, setConsultancyType] = useState('');

    // Tab 3: Raw Material Fields
    const [selectedVendorId, setSelectedVendorId] = useState('');
    const [isNewVendor, setIsNewVendor] = useState(false);
    const [newVendorName, setNewVendorName] = useState('');
    const [selectedMaterialName, setSelectedMaterialName] = useState('');
    const [isNewMaterial, setIsNewMaterial] = useState(false);
    const [newMaterialName, setNewMaterialName] = useState('');
    const [quantity, setQuantity] = useState('');
    const [unitPrice, setUnitPrice] = useState('');

    const syncOfflineSubmissions = async () => {
        if (typeof window === 'undefined' || syncingOffline) return;
        const isOnline = navigator.onLine;
        if (!isOnline) return;

        const queue = JSON.parse(safeGetItem('offline_submissions') || '[]');
        if (queue.length === 0) return;

        setSyncingOffline(true);
        const remaining: any[] = [];
        let successCount = 0;

        for (const item of queue) {
            try {
                const formData = new FormData();
                Object.keys(item).forEach(key => {
                    if (key !== 'id') {
                        formData.append(key, item[key]);
                    }
                });

                const res = await fetch('/api/telegram/submit', {
                    method: 'POST',
                    body: formData
                });

                if (res.ok) {
                    successCount++;
                } else {
                    remaining.push(item);
                }
            } catch (err) {
                console.error('Failed to sync offline item:', err);
                remaining.push(item);
            }
        }

        safeSetItem('offline_submissions', JSON.stringify(remaining));
        setSyncingOffline(false);

        if (successCount > 0) {
            alert(`✅ ${successCount} Codsiyaad offline ahaa oo la keydiyay si otomaatig ah ayaa loo diray!`);
        }
    };

    useEffect(() => {
        const handleOnline = () => {
            syncOfflineSubmissions();
        };
        if (typeof window !== 'undefined') {
            window.addEventListener('online', handleOnline);
        }

        // Fetch config details with 15-second timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        fetch('/api/telegram/config', { signal: controller.signal })
            .then(res => res.json())
            .then(data => {
                setEmployees(data.employees || []);
                setAccounts(data.accounts || []);
                setCategories(data.categories || []);
                setVendors(data.vendors || []);
                setMaterials(data.materials || []);
                if (data.accounts?.length > 0) {
                    setSelectedAccountId(data.accounts[0].id);
                }
            })
            .catch(err => console.error('Error loading config:', err))
            .finally(() => {
                clearTimeout(timeoutId);
                setLoading(false);
                syncOfflineSubmissions();
            });

        // Telegram WebApp Initialization
        if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
            const webapp = (window as any).Telegram.WebApp;
            webapp.ready();
            webapp.expand();
            
            // Extract Chat ID if available in initDataUnsafe
            const tgInitData = webapp.initDataUnsafe;
            if (tgInitData?.chat?.id) {
                setChatId(tgInitData.chat.id.toString());
            }

            if (tgInitData?.user) {
                const user = tgInitData.user;
                const fullName = (user.first_name || '') + (user.last_name ? ' ' + user.last_name : '');
                const formattedName = fullName + (user.username ? ` (@${user.username})` : '');
                setRequesterName(formattedName || 'User');
                setRequesterId(user.id.toString());
            }
        }

        return () => {
            if (typeof window !== 'undefined') {
                window.removeEventListener('online', handleOnline);
            }
        };
    }, []);

    // Parse the main dropdown value to set the respective state variables
    const handleCategoryChange = (val: string) => {
        setSelectedCategoryKey(val);
        
        // Reset states
        setSelectedEmployeeId('');
        setSelectedCategoryId('');
        setSelectedCategoryName('');
        setTransportType('');
        setEquipmentName('');
        setRentalPeriod('');
        setConsultantName('');
        setConsultancyType('');
        setSelectedVendorId('');
        setIsNewVendor(false);
        setNewVendorName('');
        setSelectedMaterialName('');
        setIsNewMaterial(false);
        setNewMaterialName('');
        setQuantity('');
        setUnitPrice('');
        setAmount('');

        if (val.startsWith('EXPENSE_')) {
            const [_, id, name] = val.split('_');
            setSelectedCategoryId(id);
            setSelectedCategoryName(name);
        }
    };

    const selectedEmployee = employees.find(e => e.id === selectedEmployeeId);
    const calculatedTotal = (parseFloat(quantity) || 0) * (parseFloat(unitPrice) || 0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        const isSalary = selectedCategoryKey === 'SALARY';
        const isRawMaterial = selectedCategoryKey === 'RAW_MATERIAL';

        const isOnline = typeof navigator !== 'undefined' && navigator.onLine;

        if (!isOnline) {
            const payload: any = {
                accountId: selectedAccountId,
                note: note,
                chatId: chatId,
                requesterName: requesterName,
                requesterId: requesterId
            };

            if (isSalary) {
                payload.type = 'SALARY';
                payload.employeeId = selectedEmployeeId;
                payload.amount = amount;
            } else if (isRawMaterial) {
                payload.type = 'RAW_MATERIAL';
                if (isNewVendor) {
                    payload.newVendorName = newVendorName;
                } else {
                    payload.vendorId = selectedVendorId;
                }
                const finalMatName = isNewMaterial ? newMaterialName : selectedMaterialName;
                payload.materialName = finalMatName;
                payload.quantity = quantity;
                payload.unitPrice = unitPrice;
                payload.amount = calculatedTotal.toString();
            } else {
                payload.type = 'EXPENSE';
                payload.categoryId = selectedCategoryId;
                payload.amount = amount;
                
                if (selectedCategoryName === 'Transport & Fuel') {
                    payload.transportType = transportType;
                } else if (selectedCategoryName === 'Equipment Rental') {
                    payload.equipmentName = equipmentName;
                    payload.rentalPeriod = rentalPeriod;
                } else if (selectedCategoryName === 'Consultancy & Service') {
                    payload.consultantName = consultantName;
                    payload.consultancyType = consultancyType;
                }
            }

            // Save to offline queue
            const queue = JSON.parse(safeGetItem('offline_submissions') || '[]');
            queue.push({ ...payload, id: Date.now().toString() });
            safeSetItem('offline_submissions', JSON.stringify(queue));
            
            setSuccess(true);
            setOfflineSubmitted(true);
            setSubmitting(false);
            return;
        }

        try {
            const formData = new FormData();
            formData.append('accountId', selectedAccountId);
            formData.append('note', note);
            formData.append('chatId', chatId);
            formData.append('requesterName', requesterName);
            formData.append('requesterId', requesterId);

            if (isSalary) {
                formData.append('type', 'SALARY');
                formData.append('employeeId', selectedEmployeeId);
                formData.append('amount', amount);
            } else if (isRawMaterial) {
                formData.append('type', 'RAW_MATERIAL');
                if (isNewVendor) {
                    formData.append('newVendorName', newVendorName);
                } else {
                    formData.append('vendorId', selectedVendorId);
                }

                const finalMatName = isNewMaterial ? newMaterialName : selectedMaterialName;
                formData.append('materialName', finalMatName);
                formData.append('quantity', quantity);
                formData.append('unitPrice', unitPrice);
                formData.append('amount', calculatedTotal.toString());
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

            const res = await fetch('/api/telegram/submit', {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                setSuccess(true);
                setOfflineSubmitted(false);
            } else {
                const data = await res.json();
                alert(data.error || 'Dalabku wuu fashilmay.');
            }
        } catch (err) {
            console.error(err);
            alert('Cilad ayaa ku dhacday server-ka.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--tg-theme-bg-color,#0f172a)] text-[var(--tg-theme-text-color,#ffffff)] gap-3 p-6">
                <TelegramScripts />
                <Loader2 className="animate-spin text-[var(--tg-theme-button-color,#2563eb)]" size={28} />
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--tg-theme-hint-color,#64748b)] animate-pulse">Diiwaangelinta waa la furayaa...</p>
            </div>
        );
    }

    if (success) {
        const handleBack = () => {
            setSuccess(false);
            setOfflineSubmitted(false);
            setAmount('');
            setNote('');
            setSelectedEmployeeId('');
            setSelectedVendorId('');
            setIsNewVendor(false);
            setNewVendorName('');
            setSelectedMaterialName('');
            setIsNewMaterial(false);
            setNewMaterialName('');
            setQuantity('');
            setUnitPrice('');
            setSelectedCategoryKey('');
        };

        const handleClose = () => {
            if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
                (window as any).Telegram.WebApp.close();
            }
        };

        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--tg-theme-bg-color,#0f172a)] text-[var(--tg-theme-text-color,#ffffff)] gap-6 p-6 text-center">
                <TelegramScripts />
                <div className="p-4 bg-gradient-to-tr from-emerald-500 to-green-400 text-white rounded-full shadow-[0_0_20px_rgba(16,185,129,0.2)] animate-bounce">
                    <CheckCircle2 size={36} />
                </div>
                <div className="flex flex-col gap-2">
                    <h2 className="text-xl font-black tracking-tight">
                        {offlineSubmitted ? "Codsiga waa la keydiyay!" : "Codsiga waa la diray!"}
                    </h2>
                    <p className="text-xs font-bold text-[var(--tg-theme-hint-color,#64748b)] uppercase tracking-wider max-w-[245px] mx-auto">
                        {offlineSubmitted 
                            ? "Waa la keydiyay (Offline). Waxaa loo diri doonaa Telegram marka internet-ku soo laabto."
                            : "Waxaa loo gudbiyay Group-ka Telegram-ka"}
                    </p>
                </div>
                
                <div className="flex flex-col gap-3 w-full max-w-xs mt-4">
                    <button
                        onClick={handleBack}
                        className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black text-xs uppercase tracking-widest active:scale-[0.98] transition-all"
                    >
                        Ku Noqo Foomka
                    </button>
                    <button
                        onClick={handleClose}
                        className="w-full py-3.5 bg-[var(--tg-theme-secondary-bg-color,rgba(255,255,255,0.05))] border border-[var(--tg-theme-hint-color,rgba(255,255,255,0.1))] opacity-80 hover:opacity-100 text-[var(--tg-theme-text-color,#ffffff)] rounded-xl font-black text-xs uppercase tracking-widest active:scale-[0.98] transition-all"
                    >
                        Xir App-ka
                    </button>
                </div>
            </div>
        );
    }

    const isSalary = selectedCategoryKey === 'SALARY';
    const isRawMaterial = selectedCategoryKey === 'RAW_MATERIAL';
    const isExpense = selectedCategoryKey.startsWith('EXPENSE_');

    return (
        <div className="min-h-screen bg-[var(--tg-theme-bg-color,#0b0f19)] text-[var(--tg-theme-text-color,#ffffff)] font-sans selection:bg-blue-500/20 pb-8 pt-4 px-4 relative overflow-x-hidden">
            <TelegramScripts />

            <div className="max-w-md mx-auto flex flex-col gap-4">
                
                {/* Header */}
                <div className="flex justify-between items-center bg-[var(--tg-theme-secondary-bg-color,rgba(255,255,255,0.02))] backdrop-blur-md border border-white/5 rounded-2xl p-4 px-5">
                    <div className="flex flex-col">
                        <p className="text-[10px] font-black text-[var(--tg-theme-button-color,#3b82f6)] uppercase tracking-[0.2em]">AN-Industory Terminal</p>
                        <h1 className="text-base font-black tracking-tight">Codsashada Kharashka</h1>
                    </div>
                    <div>
                        <span className="text-[10px] bg-white/5 border border-white/10 text-[var(--tg-theme-text-color,#ffffff)] font-black px-2.5 py-1 rounded-full uppercase">
                            {requesterName.split(' ')[0]}
                        </span>
                    </div>
                </div>

                {/* Main Selector Dropdown */}
                <div className="relative flex flex-col gap-1.5 bg-[var(--tg-theme-secondary-bg-color,rgba(255,255,255,0.02))] border border-white/5 rounded-2xl p-4">
                    <label className="text-xs font-black text-[var(--tg-theme-hint-color,#94a3b8)] uppercase tracking-wider flex items-center gap-1.5">
                        <Layers size={11} className="text-[var(--tg-theme-button-color,#3b82f6)]" /> Dooro Nooca Codsiga / Qaybta
                    </label>
                    
                    <button 
                        type="button"
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="w-full p-3 bg-[var(--tg-theme-bg-color,rgba(0,0,0,0.2))] text-[var(--tg-theme-text-color,#ffffff)] border border-white/10 rounded-xl text-sm font-bold focus:border-[var(--tg-theme-button-color,#3b82f6)] outline-none transition-all flex justify-between items-center text-left"
                    >
                        <span className="flex items-center gap-2">
                            {selectedCategoryKey ? (
                                <>
                                    {getCategoryIcon(
                                        selectedCategoryKey === 'SALARY' ? 'SALARY' : 
                                        selectedCategoryKey === 'RAW_MATERIAL' ? 'RAW_MATERIAL' : 
                                        selectedCategoryName
                                    )}
                                    <span>
                                        {selectedCategoryKey === 'SALARY' ? 'Bixinta Mushaharka (Salary)' :
                                         selectedCategoryKey === 'RAW_MATERIAL' ? 'Dalabka Raw Material' :
                                         selectedCategoryName}
                                    </span>
                                </>
                            ) : (
                                <span className="text-[var(--tg-theme-hint-color,#94a3b8)]">-- Dooro Qaybta/Category --</span>
                            )}
                        </span>
                        <span className={`transform transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''} text-xs opacity-60`}>
                            ▼
                        </span>
                    </button>

                    {dropdownOpen && (
                        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 bg-[var(--tg-theme-bg-color,#0f172a)] border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-60 overflow-y-auto animate-fade-in">
                            <button
                                type="button"
                                onClick={() => {
                                    handleCategoryChange('SALARY');
                                    setDropdownOpen(false);
                                }}
                                className="w-full p-3 hover:bg-[var(--tg-theme-secondary-bg-color,rgba(255,255,255,0.05))] text-left text-sm font-bold flex items-center gap-2 border-b border-[var(--tg-theme-hint-color,rgba(255,255,255,0.05))] opacity-90 transition-all text-[var(--tg-theme-text-color,#ffffff)]"
                            >
                                {getCategoryIcon('SALARY')}
                                <span>Bixinta Mushaharka (Salary)</span>
                            </button>
                            
                            <button
                                type="button"
                                onClick={() => {
                                    handleCategoryChange('RAW_MATERIAL');
                                    setDropdownOpen(false);
                                }}
                                className="w-full p-3 hover:bg-[var(--tg-theme-secondary-bg-color,rgba(255,255,255,0.05))] text-left text-sm font-bold flex items-center gap-2 border-b border-[var(--tg-theme-hint-color,rgba(255,255,255,0.05))] opacity-90 transition-all text-[var(--tg-theme-text-color,#ffffff)]"
                            >
                                {getCategoryIcon('RAW_MATERIAL')}
                                <span>Dalabka Raw Material</span>
                            </button>

                            {categories.filter(c => c.name !== 'Raw Material' && c.name !== 'Salaries').map(c => (
                                <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => {
                                        handleCategoryChange(`EXPENSE_${c.id}_${c.name}`);
                                        setDropdownOpen(false);
                                    }}
                                    className="w-full p-3 hover:bg-[var(--tg-theme-secondary-bg-color,rgba(255,255,255,0.05))] text-left text-sm font-bold flex items-center gap-2 border-b border-[var(--tg-theme-hint-color,rgba(255,255,255,0.05))] opacity-90 last:border-0 transition-all text-[var(--tg-theme-text-color,#ffffff)]"
                                >
                                    {getCategoryIcon(c.name)}
                                    <span>{c.name}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Form Body - Hidden until Category selected */}
                {!selectedCategoryKey ? (
                    <div className="bg-[var(--tg-theme-secondary-bg-color,rgba(255,255,255,0.02))] border border-white/5 rounded-2xl p-10 text-center flex flex-col items-center justify-center gap-3">
                        <div className="p-4 bg-white/5 rounded-full text-slate-400">
                            <Tag size={24} className="opacity-40" />
                        </div>
                        <p className="text-sm font-black text-[var(--tg-theme-hint-color,#94a3b8)] uppercase tracking-wider">
                            Fadlan dooro qaybta kharashka ee kore si aad u buuxiso formka.
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="bg-[var(--tg-theme-secondary-bg-color,rgba(255,255,255,0.02))] border border-white/10 shadow-lg rounded-3xl p-5 flex flex-col gap-4 animate-fade-in">
                        
                        {/* --- TAB 1: SALARY --- */}
                        {isSalary && (
                            <div className="flex flex-col gap-2 animate-fade-in">
                                <label className="text-xs font-black text-[var(--tg-theme-hint-color,#94a3b8)] uppercase tracking-wider flex items-center gap-1.5">
                                    <User size={11} className="text-[var(--tg-theme-button-color,#3b82f6)]" /> Dooro Shaqaalaha
                                </label>
                                <select required value={selectedEmployeeId} onChange={(e) => setSelectedEmployeeId(e.target.value)}
                                    className="w-full p-3 bg-[var(--tg-theme-bg-color,rgba(0,0,0,0.2))] text-[var(--tg-theme-text-color,#ffffff)] border border-white/10 rounded-xl text-sm font-bold outline-none"
                                >
                                    <option value="" className="bg-slate-950">Dooro Shaqaale...</option>
                                    {employees.map(e => (
                                        <option key={e.id} value={e.id} className="bg-slate-950">
                                            {e.fullName} ({e.role})
                                        </option>
                                    ))}
                                </select>
                                {selectedEmployee && (
                                    <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl flex flex-col gap-2 mt-1.5 shadow-inner text-xs">
                                        <div className="flex justify-between font-bold">
                                            <span className="text-[var(--tg-theme-hint-color,#94a3b8)]">Mushaarka Bishii:</span>
                                            <span>{selectedEmployee.monthlySalary.toLocaleString()} ETB</span>
                                        </div>
                                        <div className="flex justify-between font-bold">
                                            <span className="text-[var(--tg-theme-hint-color,#94a3b8)]">La Siiyay Bishan:</span>
                                            <span className="text-emerald-400">{selectedEmployee.paidThisMonth.toLocaleString()} ETB</span>
                                        </div>
                                        <div className="flex justify-between font-black border-t border-white/5 pt-2 mt-0.5">
                                            <span className="text-[var(--tg-theme-text-color,#ffffff)]">U Dhiman:</span>
                                            <span className="text-[var(--tg-theme-button-color,#3b82f6)]">{selectedEmployee.dueThisMonth.toLocaleString()} ETB</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* --- TAB 2: EXPENSE (Transport/Equipment/Consultancy custom fields) --- */}
                        {isExpense && (
                            <div className="flex flex-col gap-3 animate-fade-in">
                                {selectedCategoryName === 'Transport & Fuel' && (
                                    <div className="flex flex-col gap-1.5 bg-white/[0.01] border border-white/5 rounded-xl p-3">
                                        <label className="text-xs font-black text-[var(--tg-theme-hint-color,#94a3b8)] uppercase tracking-wider flex items-center gap-1.5">
                                            <Truck size={11} className="text-[var(--tg-theme-button-color,#3b82f6)]" /> Nooca Gaadiidka
                                        </label>
                                        <select required value={transportType} onChange={(e) => setTransportType(e.target.value)}
                                            className="w-full p-2.5 bg-[var(--tg-theme-bg-color,rgba(0,0,0,0.2))] border border-white/10 rounded-lg text-sm font-bold outline-none"
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
                                    <div className="flex flex-col gap-3 bg-white/[0.01] border border-white/5 rounded-xl p-3">
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-xs font-black text-[var(--tg-theme-hint-color,#94a3b8)] uppercase tracking-wider flex items-center gap-1.5">
                                                <Wrench size={11} className="text-[var(--tg-theme-button-color,#3b82f6)]" /> Magaca Qalabka (Equipment Name)
                                            </label>
                                            <input type="text" required placeholder="Magaca qalabka..." value={equipmentName} onChange={(e) => setEquipmentName(e.target.value)}
                                                className="w-full p-2.5 bg-[var(--tg-theme-bg-color,rgba(0,0,0,0.2))] border border-white/10 rounded-lg text-sm font-bold outline-none"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-xs font-black text-[var(--tg-theme-hint-color,#94a3b8)] uppercase tracking-wider flex items-center gap-1.5">
                                                <Calendar size={11} className="text-[var(--tg-theme-button-color,#3b82f6)]" /> Muddada Kirada
                                            </label>
                                            <input type="text" placeholder="e.g. 3 Maalmood, 1 Bil..." value={rentalPeriod} onChange={(e) => setRentalPeriod(e.target.value)}
                                                className="w-full p-2.5 bg-[var(--tg-theme-bg-color,rgba(0,0,0,0.2))] border border-white/10 rounded-lg text-sm font-bold outline-none"
                                            />
                                        </div>
                                    </div>
                                )}

                                {selectedCategoryName === 'Consultancy & Service' && (
                                    <div className="flex flex-col gap-3 bg-white/[0.01] border border-white/5 rounded-xl p-3">
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-xs font-black text-[var(--tg-theme-hint-color,#94a3b8)] uppercase tracking-wider flex items-center gap-1.5">
                                                <User size={11} className="text-[var(--tg-theme-button-color,#3b82f6)]" /> Magaca La-taliyaha (Consultant Name)
                                            </label>
                                            <input type="text" required placeholder="Magaca shirkada ama la-taliyaha..." value={consultantName} onChange={(e) => setConsultantName(e.target.value)}
                                                className="w-full p-2.5 bg-[var(--tg-theme-bg-color,rgba(0,0,0,0.2))] border border-white/10 rounded-lg text-sm font-bold outline-none"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-xs font-black text-[var(--tg-theme-hint-color,#94a3b8)] uppercase tracking-wider flex items-center gap-1.5">
                                                <ClipboardList size={11} className="text-[var(--tg-theme-button-color,#3b82f6)]" /> Adeegga la qabtay
                                            </label>
                                            <input type="text" placeholder="Sharaxaad kooban..." value={consultancyType} onChange={(e) => setConsultancyType(e.target.value)}
                                                className="w-full p-2.5 bg-[var(--tg-theme-bg-color,rgba(0,0,0,0.2))] border border-white/10 rounded-lg text-sm font-bold outline-none"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* --- TAB 3: RAW MATERIAL --- */}
                        {isRawMaterial && (
                            <div className="flex flex-col gap-3 animate-fade-in">
                                
                                {/* Vendor Selector */}
                                <div className="flex flex-col gap-1.5">
                                    <div className="flex justify-between items-center text-xs font-black uppercase tracking-wider">
                                        <span className="text-[var(--tg-theme-hint-color,#94a3b8)] flex items-center gap-1.5"><Factory size={11} className="text-[var(--tg-theme-button-color,#3b82f6)]" /> Supplier</span>
                                        <button type="button" onClick={() => { setIsNewVendor(!isNewVendor); setSelectedVendorId(''); }}
                                            className="text-[var(--tg-theme-button-color,#3b82f6)] hover:opacity-80"
                                        >
                                            {isNewVendor ? "Dooro mid jira" : "➕ Kordhi cusub"}
                                        </button>
                                    </div>
                                    {isNewVendor ? (
                                        <input type="text" required placeholder="Supplier-ka cusub..." value={newVendorName} onChange={(e) => setNewVendorName(e.target.value)}
                                            className="w-full p-2.5 bg-[var(--tg-theme-bg-color,rgba(0,0,0,0.2))] border border-white/10 rounded-lg text-sm font-bold outline-none"
                                        />
                                    ) : (
                                        <select required value={selectedVendorId} onChange={(e) => setSelectedVendorId(e.target.value)}
                                            className="w-full p-2.5 bg-[var(--tg-theme-bg-color,rgba(0,0,0,0.2))] border border-white/10 rounded-lg text-sm font-bold outline-none"
                                        >
                                            <option value="" className="bg-slate-950">Dooro Supplier...</option>
                                            {vendors.map(v => (
                                                <option key={v.id} value={v.id} className="bg-slate-950">
                                                    {v.name}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>

                                {/* Material Selector */}
                                <div className="flex flex-col gap-1.5">
                                    <div className="flex justify-between items-center text-xs font-black uppercase tracking-wider">
                                        <span className="text-[var(--tg-theme-hint-color,#94a3b8)] flex items-center gap-1.5"><Package size={11} className="text-[var(--tg-theme-button-color,#3b82f6)]" /> Agabka Cayriin (Raw Material)</span>
                                        <button type="button" onClick={() => { setIsNewMaterial(!isNewMaterial); setSelectedMaterialName(''); }}
                                            className="text-[var(--tg-theme-button-color,#3b82f6)] hover:opacity-80"
                                        >
                                            {isNewMaterial ? "Dooro mid jira" : "➕ Kordhi cusub"}
                                        </button>
                                    </div>
                                    {isNewMaterial ? (
                                        <input type="text" required placeholder="Magaca Agabka cusub..." value={newMaterialName} onChange={(e) => setNewMaterialName(e.target.value)}
                                            className="w-full p-2.5 bg-[var(--tg-theme-bg-color,rgba(0,0,0,0.2))] border border-white/10 rounded-lg text-sm font-bold outline-none"
                                        />
                                    ) : (
                                        <select required value={selectedMaterialName} onChange={(e) => setSelectedMaterialName(e.target.value)}
                                            className="w-full p-2.5 bg-[var(--tg-theme-bg-color,rgba(0,0,0,0.2))] border border-white/10 rounded-lg text-sm font-bold outline-none"
                                        >
                                            <option value="" className="bg-slate-950">Dooro Agabka...</option>
                                            {materials.map(m => (
                                                <option key={m.id} value={m.name} className="bg-slate-950">
                                                    {m.name}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>

                                {/* Qty & Unit Price Grid */}
                                <div className="grid grid-cols-2 gap-3.5">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-black text-[var(--tg-theme-hint-color,#94a3b8)] uppercase tracking-wider flex items-center gap-1.5">
                                            <Hash size={11} className="text-[var(--tg-theme-button-color,#3b82f6)]" /> Tirada (Qty)
                                        </label>
                                        <input type="number" required placeholder="0" value={quantity} onChange={(e) => setQuantity(e.target.value)}
                                            className="w-full p-2.5 bg-[var(--tg-theme-bg-color,rgba(0,0,0,0.2))] border border-white/10 rounded-lg text-sm font-bold outline-none"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-black text-[var(--tg-theme-hint-color,#94a3b8)] uppercase tracking-wider flex items-center gap-1.5">
                                            <Banknote size={11} className="text-[var(--tg-theme-button-color,#3b82f6)]" /> Qiimaha
                                        </label>
                                        <input type="number" required placeholder="0.00" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)}
                                            className="w-full p-2.5 bg-[var(--tg-theme-bg-color,rgba(0,0,0,0.2))] border border-white/10 rounded-lg text-sm font-bold outline-none"
                                        />
                                    </div>
                                </div>

                                {/* Computed total display */}
                                {calculatedTotal > 0 && (
                                    <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl flex justify-between items-center text-xs">
                                        <span className="font-bold text-[var(--tg-theme-hint-color,#94a3b8)]">Total Cost:</span>
                                        <span className="font-black text-[var(--tg-theme-button-color,#3b82f6)]">{calculatedTotal.toLocaleString()} ETB</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Show normal Amount input if type is NOT Raw Material */}
                        {!isRawMaterial && (
                            <div className="flex flex-col gap-1.5 animate-fade-in">
                                <label className="text-xs font-black text-[var(--tg-theme-hint-color,#94a3b8)] uppercase tracking-wider flex items-center gap-1.5">
                                    <DollarSign size={11} className="text-[var(--tg-theme-button-color,#3b82f6)]" /> Lacagta (Amount in ETB)
                                </label>
                                <input type="number" required placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)}
                                    className="w-full p-3 bg-[var(--tg-theme-bg-color,rgba(0,0,0,0.2))] text-[var(--tg-theme-text-color,#ffffff)] border border-white/10 rounded-lg text-sm font-black focus:border-[var(--tg-theme-button-color,#3b82f6)] outline-none"
                                />
                            </div>
                        )}

                        {/* Funding Account Selection */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-black text-[var(--tg-theme-hint-color,#94a3b8)] uppercase tracking-wider flex items-center gap-1.5">
                                <Wallet size={11} className="text-[var(--tg-theme-button-color,#3b82f6)]" /> Koontada (Payment Account)
                            </label>
                            <select required value={selectedAccountId} onChange={(e) => setSelectedAccountId(e.target.value)}
                                className="w-full p-2.5 bg-[var(--tg-theme-bg-color,rgba(0,0,0,0.2))] text-[var(--tg-theme-text-color,#ffffff)] border border-white/10 rounded-lg text-sm font-bold outline-none"
                            >
                                {accounts.map(a => (
                                    <option key={a.id} value={a.id} className="bg-slate-950">
                                        {a.name} ({a.balance.toLocaleString()} {a.currency})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Description/Note */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-black text-[var(--tg-theme-hint-color,#94a3b8)] uppercase tracking-wider flex items-center gap-1.5">
                                <FileText size={11} className="text-[var(--tg-theme-button-color,#3b82f6)]" /> Faahfaahin / Note (Sharaxaad)
                            </label>
                            <textarea rows={2} placeholder={isSalary ? 'Sharaxaadda mushaharka...' : isRawMaterial ? 'Sharaxaadda alaabta...' : 'Sharaxaadda kharashka...'}
                                value={note} onChange={(e) => setNote(e.target.value)}
                                className="w-full p-2.5 bg-[var(--tg-theme-bg-color,rgba(0,0,0,0.2))] text-[var(--tg-theme-text-color,#ffffff)] border border-white/10 rounded-lg text-sm font-bold outline-none resize-none"
                            />
                        </div>

                        {/* Submit Button */}
                        <button type="submit" disabled={submitting || !selectedAccountId}
                            className="w-full py-3.5 bg-[var(--tg-theme-button-color,#2563eb)] text-[var(--tg-theme-button-text-color,#ffffff)] rounded-xl font-black text-sm uppercase tracking-widest hover:opacity-90 active:scale-[0.99] disabled:opacity-40 transition-all flex items-center justify-center gap-2 mt-2"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="animate-spin" size={14} />
                                    Diiwaangelinta waa socotaa...
                                </>
                            ) : (
                                <>
                                    Guri Codsiga
                                    <ArrowRight size={12} />
                                </>
                            )}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
