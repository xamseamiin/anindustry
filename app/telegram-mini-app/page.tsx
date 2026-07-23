'use client';

import React, { useState, useEffect } from 'react';
import Script from 'next/script';
import { 
    Loader2, CheckCircle2, DollarSign, Wallet, 
    FileText, User, Tag, Truck, Settings, ShoppingBag, 
    Award, ArrowRight, Layers, Factory, Package,
    Hash, Banknote, Calendar, ClipboardList, Wrench, Phone,
    Mic, MicOff, PlusCircle, Trash2, Pencil, AlertTriangle
} from 'lucide-react';

// Safe localStorage helpers for iOS WebView where localStorage can throw SecurityError
const safeGetItem = (key: string): string | null => {
    try { return localStorage.getItem(key); } catch { return null; }
};
const safeSetItem = (key: string, value: string): void => {
    try { localStorage.setItem(key, value); } catch { /* silently fail */ }
};
const safeParseJSON = <T,>(key: string, fallback: T): T => {
    try {
        if (typeof window === 'undefined') return fallback;
        const val = localStorage.getItem(key);
        if (!val || val === 'undefined' || val === 'null') return fallback;
        const parsed = JSON.parse(val);
        return parsed ?? fallback;
    } catch {
        return fallback;
    }
};

interface BatchItem {
    id: string;
    categoryKey: string;
    categoryName: string;
    amount: number;
    note: string;
    paymentPhone: string;
    recipientName: string;
    employeeId?: string;
    employeeName?: string;
    vendorId?: string;
    newVendorName?: string;
    materialName?: string;
    newMaterialName?: string;
    quantity?: string;
    unitPrice?: string;
    transportType?: string;
    equipmentName?: string;
    rentalPeriod?: string;
    consultantName?: string;
    consultancyType?: string;
}

const triggerHaptic = (type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection') => {
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.HapticFeedback) {
        const haptic = (window as any).Telegram.WebApp.HapticFeedback;
        if (type === 'success' || type === 'warning' || type === 'error') {
            haptic.notificationOccurred(type);
        } else if (type === 'selection') {
            haptic.selectionChanged();
        } else {
            haptic.impactOccurred(type);
        }
    }
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

const validatePhoneNumber = (phone: string): boolean => {
    if (!phone) return true; // Optional field
    const clean = phone.replace(/[\s-]/g, '');
    // Starts with +251 (Eth), +252 (Som), or local prefix 09, 07, 06, 05 followed by 7 to 10 digits
    const pattern = /^(\+251|\+252|09|07|06|05)\d{7,10}$/;
    return pattern.test(clean);
};

const CustomAlertModal = ({ isOpen, onClose, type = 'error', title, message }: any) => {
    if (!isOpen) return null;

    const isSuccess = type === 'success';
    const isWarning = type === 'warning';
    
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md animate-fade-in" onClick={onClose} />
            <div className="bg-slate-900/90 border border-white/20 backdrop-blur-3xl rounded-3xl p-6 w-full max-w-sm relative z-10 shadow-2xl animate-in zoom-in-95 duration-200 text-center flex flex-col items-center gap-4">
                <div className={`p-4 rounded-2xl shadow-xl flex items-center justify-center ${
                    isSuccess 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                        : isWarning 
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}>
                    {isSuccess ? <CheckCircle2 size={36} /> : isWarning ? <AlertTriangle size={36} /> : <AlertTriangle size={36} />}
                </div>

                <div className="space-y-1.5">
                    <h3 className="text-base font-black text-white tracking-tight">
                        {title || (isSuccess ? 'Guul' : isWarning ? 'Digniin' : 'Cillad / Warning')}
                    </h3>
                    <p className="text-xs font-bold text-slate-300 leading-relaxed">
                        {message}
                    </p>
                </div>

                <button
                    onClick={onClose}
                    className={`w-full py-3.5 px-6 rounded-2xl font-black text-xs uppercase tracking-wider transition-all active:scale-95 shadow-lg ${
                        isSuccess
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                            : isWarning
                            ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30'
                            : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                    }`}
                >
                    Fahmay (OK)
                </button>
            </div>
        </div>
    );
};

export default function TelegramMiniAppPage() {
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [offlineSubmitted, setOfflineSubmitted] = useState(false);
    const [syncingOffline, setSyncingOffline] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    // Custom Glassmorphism Alert State
    const [alertModal, setAlertModal] = useState<{ isOpen: boolean; type: 'error' | 'success' | 'warning' | 'info'; title?: string; message: string }>({
        isOpen: false,
        type: 'error',
        message: ''
    });

    const showAlert = (message: string, type: 'error' | 'success' | 'warning' | 'info' = 'error', title?: string) => {
        setAlertModal({
            isOpen: true,
            type,
            title,
            message
        });
    };
    
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

    // Payment contact fields
    const [paymentPhone, setPaymentPhone] = useState('');
    const [recipientName, setRecipientName] = useState('');
    
    // Saved contacts by category (localStorage)
    const [savedTransportContacts, setSavedTransportContacts] = useState<{name: string; phone: string}[]>([]);
    const [savedEquipmentContacts, setSavedEquipmentContacts] = useState<{name: string; phone: string}[]>([]);
    const [savedConsultantContacts, setSavedConsultantContacts] = useState<{name: string; phone: string}[]>([]);
    const [showSavedContacts, setShowSavedContacts] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [recognitionObj, setRecognitionObj] = useState<any>(null);

    // History & Edit states
    const [activeTab, setActiveTab] = useState<'NEW' | 'HISTORY'>('NEW');
    const [historyFilter, setHistoryFilter] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('all');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [historyExpenses, setHistoryExpenses] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    
    // Edit modal states
    const [editingExpense, setEditingExpense] = useState<any | null>(null);
    const [editAmount, setEditAmount] = useState('');
    const [editNote, setEditNote] = useState('');
    const [editPhone, setEditPhone] = useState('');
    const [editRecipientName, setEditRecipientName] = useState('');
    const [editCategoryId, setEditCategoryId] = useState('');
    const [savingEdit, setSavingEdit] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const isOwnerOfExpense = (exp: any) => {
        if (!exp) return false;
        if (!exp.requesterId && !exp.requesterName) return true;
        if (requesterId && exp.requesterId && String(exp.requesterId) === String(requesterId)) return true;
        if (requesterName && exp.requesterName) {
            const currentShort = requesterName.split(' ')[0].toLowerCase();
            const expShort = exp.requesterName.split(' ')[0].toLowerCase();
            if (currentShort && expShort && (currentShort === expShort || exp.requesterName.toLowerCase().includes(currentShort))) return true;
        }
        return false;
    };

    const fetchHistory = async () => {
        setLoadingHistory(true);
        try {
            let url = `/api/telegram/history?filter=${historyFilter}`;
            if (paymentPhone) url += `&phone=${encodeURIComponent(paymentPhone)}`;
            if (historyFilter === 'custom') {
                if (customStartDate) url += `&startDate=${encodeURIComponent(customStartDate)}`;
                if (customEndDate) url += `&endDate=${encodeURIComponent(customEndDate)}`;
            }
            const res = await fetch(url);
            const data = await res.json();
            if (data.success && Array.isArray(data.expenses)) {
                setHistoryExpenses(data.expenses);
            }
        } catch (err) {
            console.error('Error fetching history:', err);
        } finally {
            setLoadingHistory(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'HISTORY') {
            fetchHistory();
        }
    }, [activeTab, historyFilter, customStartDate, customEndDate]);

    const handleOpenEdit = (exp: any) => {
        triggerHaptic('light');
        if (!isOwnerOfExpense(exp)) {
            triggerHaptic('error');
            showAlert('❌ Ogolaansho ma u leehid inaad beddesho foom uusan qofkani soo galin. Qofkii soo diiwaangeliyay oo kaliya ayaa beddeli kara.', 'error', 'Ogolaansho Ma Leehid');
            return;
        }
        setEditingExpense(exp);
        setEditAmount(String(exp.amount));
        setEditNote(exp.note || '');
        setEditPhone(exp.paymentPhone || '');
        setEditRecipientName(exp.recipientName || '');
        setEditCategoryId(exp.categoryId || '');
    };

    const handleSaveEdit = async () => {
        if (!editingExpense) return;
        setSavingEdit(true);
        triggerHaptic('medium');

        try {
            const res = await fetch('/api/telegram/expense-actions', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: editingExpense.id,
                    amount: editAmount,
                    note: editNote,
                    paymentPhone: editPhone,
                    recipientName: editRecipientName,
                    categoryId: editCategoryId
                })
            });
            const data = await res.json();
            if (data.success) {
                triggerHaptic('success');
                setEditingExpense(null);
                fetchHistory();
                showAlert('Kharashka waa la cusboonaysiiyay!', 'success');
            } else {
                triggerHaptic('error');
                showAlert(data.error || 'Cillad ayaa dhacday.', 'error');
            }
        } catch (err: any) {
            triggerHaptic('error');
            showAlert('Cillad ayaa dhacday: ' + err.message, 'error');
        } finally {
            setSavingEdit(false);
        }
    };

    const handleDeleteExpense = async (id: string) => {
        if (!confirm('Ma ziirtaa inaad tirtirto kharashkan? Lacagta dib ayaa loogu soo celin doonaa E-Birr Merchant.')) return;
        setDeletingId(id);
        triggerHaptic('warning');

        try {
            const res = await fetch(`/api/telegram/expense-actions?id=${id}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (data.success) {
                triggerHaptic('success');
                if (editingExpense?.id === id) setEditingExpense(null);
                fetchHistory();
                showAlert('Kharashka waa la tirtiray, haraaguna waa loo soo celiyay koontada!', 'success');
            } else {
                triggerHaptic('error');
                showAlert(data.error || 'Cillad ayaa dhacday tirtiridda.', 'error');
            }
        } catch (err: any) {
            triggerHaptic('error');
            showAlert('Cillad: ' + err.message, 'error');
        } finally {
            setDeletingId(null);
        }
    };

    const [batchItems, setBatchItems] = useState<BatchItem[]>([]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = safeParseJSON<BatchItem[]>('telegram_mini_app_batch_items', []);
            if (Array.isArray(saved)) {
                setBatchItems(saved);
            } else {
                setBatchItems([]);
            }
        }
    }, []);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            safeSetItem('telegram_mini_app_batch_items', JSON.stringify(Array.isArray(batchItems) ? batchItems : []));
        }
    }, [batchItems]);

    const validBatchItems = Array.isArray(batchItems) ? batchItems : [];
    const totalBatchAmount = validBatchItems.reduce((sum, item) => sum + (Number(item?.amount) || 0), 0);

    const handleAddToBatch = () => {
        triggerHaptic('light');

        if (!selectedCategoryKey) {
            triggerHaptic('error');
            showAlert('Fadlan dooro nooca codsiga (Category).', 'warning');
            return;
        }

        const isSalaryKey = selectedCategoryKey === 'SALARY';
        const isRawMaterialKey = selectedCategoryKey === 'RAW_MATERIAL';

        if (isSalaryKey && !selectedEmployeeId) {
            triggerHaptic('error');
            showAlert('Fadlan dooro shaqaalaha.', 'warning');
            return;
        }

        if (paymentPhone && !validatePhoneNumber(paymentPhone)) {
            triggerHaptic('error');
            showAlert('Fadlan geli lambar telefoon oo sax ah.', 'warning');
            return;
        }

        let itemAmount = 0;
        if (isRawMaterialKey) {
            itemAmount = calculatedTotal;
            if (itemAmount <= 0) {
                triggerHaptic('error');
                showAlert('Fadlan geli tirada iyo qiimaha alaabta.', 'warning');
                return;
            }
        } else {
            itemAmount = parseFloat(amount) || 0;
            if (itemAmount <= 0) {
                triggerHaptic('error');
                showAlert('Fadlan geli lacagta (Amount).', 'warning');
                return;
            }
        }

        const selectedEmp = employees.find(e => e.id === selectedEmployeeId);
        const newItem: BatchItem = {
            id: Math.random().toString(36).substring(7),
            categoryKey: selectedCategoryKey,
            categoryName: selectedCategoryName,
            amount: itemAmount,
            note: note,
            paymentPhone: paymentPhone,
            recipientName: recipientName,
            employeeId: selectedEmployeeId || undefined,
            employeeName: selectedEmp ? selectedEmp.fullName : undefined,
            vendorId: selectedVendorId || undefined,
            newVendorName: newVendorName || undefined,
            materialName: selectedMaterialName || undefined,
            newMaterialName: newMaterialName || undefined,
            quantity: quantity || undefined,
            unitPrice: unitPrice || undefined,
            transportType: transportType || undefined,
            equipmentName: equipmentName || undefined,
            rentalPeriod: rentalPeriod || undefined,
            consultantName: consultantName || undefined,
            consultancyType: consultancyType || undefined
        };

        if (recipientName && paymentPhone) {
            saveContactIfNew(selectedCategoryName, recipientName, paymentPhone);
        }

        setBatchItems(prev => [...prev, newItem]);

        // Reset current input fields so user can add another request immediately
        setAmount('');
        setNote('');
        setQuantity('');
        setUnitPrice('');
        setSelectedEmployeeId('');
        setRecipientName('');
        setPaymentPhone('');
        setNewVendorName('');
        setNewMaterialName('');
        setTransportType('');
        setEquipmentName('');
        setRentalPeriod('');
        setConsultantName('');
        setConsultancyType('');
        setShowSavedContacts(false);
    };

    const handleRemoveFromBatch = (id: string) => {
        triggerHaptic('light');
        setBatchItems(prev => prev.filter(item => item.id !== id));
    };

    const handleClearBatch = () => {
        triggerHaptic('light');
        setBatchItems([]);
    };

    const syncOfflineSubmissions = async () => {
        if (typeof window === 'undefined' || syncingOffline) return;
        const isOnline = navigator.onLine;
        if (!isOnline) return;

        const queue = safeParseJSON<any[]>('offline_submissions', []);
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
                // Load saved contacts from localStorage
                setSavedTransportContacts(safeParseJSON<{name: string; phone: string}[]>('saved_transport_contacts', []));
                setSavedEquipmentContacts(safeParseJSON<{name: string; phone: string}[]>('saved_equipment_contacts', []));
                setSavedConsultantContacts(safeParseJSON<{name: string; phone: string}[]>('saved_consultant_contacts', []));
            });

        // Robust Telegram WebApp Initialization with retry loop
        let attempts = 0;
        const initTgUser = () => {
            attempts++;
            if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
                const webapp = (window as any).Telegram.WebApp;
                try { webapp.ready(); } catch(e) {}
                try { webapp.expand(); } catch(e) {}
                
                const tgInitData = webapp.initDataUnsafe;
                if (tgInitData?.chat?.id) {
                    setChatId(tgInitData.chat.id.toString());
                }

                if (tgInitData?.user) {
                    const user = tgInitData.user;
                    const fullName = (user.first_name || '') + (user.last_name ? ' ' + user.last_name : '');
                    const formattedName = fullName.trim() + (user.username ? ` (@${user.username})` : '');
                    setRequesterName(formattedName || user.first_name || 'Telegram User');
                    if (user.id) setRequesterId(user.id.toString());
                }
            }
        };

        initTgUser();
        const tgInterval = setInterval(() => {
            initTgUser();
            if (attempts >= 10) clearInterval(tgInterval);
        }, 300);

        return () => {
            clearInterval(tgInterval);
            if (typeof window !== 'undefined') {
                window.removeEventListener('online', handleOnline);
            }
        };
    }, []);

    // Initialize Speech Recognition
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognition) {
                const rec = new SpeechRecognition();
                rec.continuous = true;
                rec.interimResults = false;
                rec.lang = 'so-SO'; // Default to Somali language detection

                rec.onresult = (event: any) => {
                    const resultIndex = event.resultIndex;
                    const transcript = event.results[resultIndex][0].transcript;
                    setNote(prev => prev ? `${prev} ${transcript}` : transcript);
                    triggerHaptic('light');
                };

                rec.onend = () => {
                    setIsListening(false);
                };

                rec.onerror = (err: any) => {
                    console.error('Speech recognition error:', err);
                    setIsListening(false);
                };

                setRecognitionObj(rec);
            }
        }
    }, []);

    // Auto-fill payment phone and recipient name when employee is selected
    useEffect(() => {
        if (selectedEmployeeId && selectedCategoryKey === 'SALARY') {
            const emp = employees.find(e => e.id === selectedEmployeeId);
            if (emp) {
                if (emp.phone) setPaymentPhone(emp.phone);
                setRecipientName(emp.fullName);
            }
        }
    }, [selectedEmployeeId, employees, selectedCategoryKey]);

    // Parse the main dropdown value to set the respective state variables
    const handleCategoryChange = (key: string, name?: string) => {
        triggerHaptic('selection');
        setSelectedCategoryKey(key);
        
        // Reset states
        setSelectedEmployeeId('');
        setSelectedCategoryId('');
        setSelectedCategoryName(name || '');
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
        setPaymentPhone('');
        setRecipientName('');
        setShowSavedContacts(false);

        if (key.startsWith('EXPENSE_')) {
            const parts = key.split('_');
            const id = parts[1];
            setSelectedCategoryId(id);
            if (!name && parts.length >= 3) {
                setSelectedCategoryName(parts.slice(2).join('_'));
            }
        }
    };

    const activeCategorySavedContacts = 
        selectedCategoryName === 'Transport & Fuel' ? savedTransportContacts :
        selectedCategoryName === 'Equipment Rental' ? savedEquipmentContacts :
        selectedCategoryName === 'Consultancy & Service' ? savedConsultantContacts : [];

    const handleSelectSavedContact = (contact: { name: string; phone: string }) => {
        triggerHaptic('light');
        setRecipientName(contact.name);
        setPaymentPhone(contact.phone);
        setShowSavedContacts(false);
    };

    const toggleVoiceRecognition = () => {
        if (!recognitionObj) {
            alert('Voice recognition ma taageerayo browser-kan.');
            return;
        }
        if (isListening) {
            try { recognitionObj.stop(); } catch(e) {}
            setIsListening(false);
        } else {
            try {
                recognitionObj.start();
                setIsListening(true);
                triggerHaptic('medium');
            } catch (e) {
                console.error(e);
            }
        }
    };

    const selectedEmployee = employees.find(e => e.id === selectedEmployeeId);
    const calculatedTotal = (parseFloat(quantity) || 0) * (parseFloat(unitPrice) || 0);

    const activeAccount = accounts.find(a => a.id === selectedAccountId);
    const isRawMaterialTemp = selectedCategoryKey === 'RAW_MATERIAL';
    const amountVal = isRawMaterialTemp ? calculatedTotal : (parseFloat(amount) || 0);
    const isOverLimit = activeAccount && amountVal > activeAccount.balance;

    useEffect(() => {
        if (isOverLimit) {
            triggerHaptic('warning');
        }
    }, [isOverLimit]);

    const saveContactIfNew = (categoryName: string, name: string, phone: string) => {
        if (!name || !phone) return;
        let storageKey = '';
        let setter: any = null;

        if (categoryName === 'Transport & Fuel') {
            storageKey = 'saved_transport_contacts';
            setter = setSavedTransportContacts;
        } else if (categoryName === 'Equipment Rental') {
            storageKey = 'saved_equipment_contacts';
            setter = setSavedEquipmentContacts;
        } else if (categoryName === 'Consultancy & Service') {
            storageKey = 'saved_consultant_contacts';
            setter = setSavedConsultantContacts;
        }

        if (storageKey && setter) {
            const contacts = safeParseJSON<any[]>(storageKey, []);
            const exists = contacts.some((c: any) => c.name === name && c.phone === phone);
            if (!exists) {
                contacts.push({ name, phone });
                safeSetItem(storageKey, JSON.stringify(contacts));
                setter(contacts);
            }
        }
    };

    const toggleListening = () => {
        if (!recognitionObj) {
            alert('Qalabkani ma taageerayo cod-u-beddelka qoraalka (Speech recognition not supported in this browser).');
            return;
        }

        triggerHaptic('medium');
        if (isListening) {
            recognitionObj.stop();
            setIsListening(false);
        } else {
            try {
                recognitionObj.start();
                setIsListening(true);
            } catch (e) {
                console.error(e);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        if (recognitionObj && isListening) {
            try { recognitionObj.stop(); } catch(e) {}
            setIsListening(false);
        }

        const isOnline = typeof navigator !== 'undefined' && navigator.onLine;

        // If user collected batch items, submit all of them
        if (validBatchItems.length > 0) {
            let processed = 0;
            let failed = 0;

            for (let i = 0; i < validBatchItems.length; i++) {
                const item = validBatchItems[i];
                const formData = new FormData();
                formData.append('accountId', selectedAccountId);
                formData.append('type', item.categoryKey.startsWith('EXPENSE_') ? 'EXPENSE' : item.categoryKey);
                if (item.categoryKey.startsWith('EXPENSE_')) {
                    formData.append('categoryId', item.categoryKey.replace('EXPENSE_', ''));
                }
                formData.append('amount', item.amount.toString());
                formData.append('note', item.note || '');
                if (item.paymentPhone) formData.append('paymentPhone', item.paymentPhone);
                if (item.recipientName) formData.append('recipientName', item.recipientName);
                if (item.employeeId) formData.append('employeeId', item.employeeId);
                if (item.vendorId) formData.append('vendorId', item.vendorId);
                if (item.newVendorName) formData.append('newVendorName', item.newVendorName);
                if (item.materialName) formData.append('materialName', item.materialName);
                if (item.newMaterialName) formData.append('newMaterialName', item.newMaterialName);
                if (item.quantity) formData.append('quantity', item.quantity);
                if (item.unitPrice) formData.append('unitPrice', item.unitPrice);
                if (item.transportType) formData.append('transportType', item.transportType);
                if (item.equipmentName) formData.append('equipmentName', item.equipmentName);
                if (item.rentalPeriod) formData.append('rentalPeriod', item.rentalPeriod);
                if (item.consultantName) formData.append('consultantName', item.consultantName);
                if (item.consultancyType) formData.append('consultancyType', item.consultancyType);
                formData.append('requesterName', requesterName);
                formData.append('requesterId', requesterId);

                if (!isOnline) {
                    const queue = safeParseJSON<any[]>('offline_submissions', []);
                    const offlineObj: any = {};
                    formData.forEach((value, key) => { offlineObj[key] = value; });
                    offlineObj.id = Math.random().toString(36).substring(7);
                    queue.push(offlineObj);
                    safeSetItem('offline_submissions', JSON.stringify(queue));
                    processed++;
                } else {
                    try {
                        const res = await fetch('/api/telegram/submit', { method: 'POST', body: formData });
                        if (res.ok) processed++;
                        else failed++;
                    } catch(err) {
                        failed++;
                    }
                }

                // Add 600ms delay between sending individual items to Telegram
                if (isOnline && i < validBatchItems.length - 1) {
                    await new Promise(r => setTimeout(r, 600));
                }
            }

            setSubmitting(false);
            setBatchItems([]);
            if (failed === 0) {
                triggerHaptic('success');
                setSuccess(true);
                setOfflineSubmitted(!isOnline);
            } else {
                triggerHaptic('error');
                alert(`Waxaa diiwaangashay ${processed} dalab, ${failed} dalabna way fashilmeen.`);
            }
            return;
        }

        if (paymentPhone && !validatePhoneNumber(paymentPhone)) {
            triggerHaptic('error');
            alert('Fadlan geli lambar telefoon oo sax ah (tusaale: 09xxxxxxxx ama +251... / +252...)');
            setSubmitting(false);
            return;
        }

        // Save contact immediately so it's available even if offline submission
        if (recipientName && paymentPhone) {
            saveContactIfNew(selectedCategoryName, recipientName, paymentPhone);
        }

        const isSalary = selectedCategoryKey === 'SALARY';
        const isRawMaterial = selectedCategoryKey === 'RAW_MATERIAL';

        if (!isOnline) {
            const payload: any = {
                accountId: selectedAccountId,
                note: note,
                chatId: chatId,
                requesterName: requesterName,
                requesterId: requesterId
            };

            payload.paymentPhone = paymentPhone;
            payload.recipientName = recipientName;

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
            const queue = safeParseJSON<any[]>('offline_submissions', []);
            queue.push({ ...payload, id: Date.now().toString() });
            safeSetItem('offline_submissions', JSON.stringify(queue));
            
            triggerHaptic('success');
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
            if (paymentPhone) formData.append('paymentPhone', paymentPhone);
            if (recipientName) formData.append('recipientName', recipientName);

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
                triggerHaptic('success');
                setSuccess(true);
                setOfflineSubmitted(false);
            } else {
                triggerHaptic('error');
                const data = await res.json();
                showAlert(data.error || 'Dalabku wuu fashilmay.', 'error');
            }
        } catch (err) {
            triggerHaptic('error');
            console.error(err);
            showAlert('Cilad ayaa ku dhacday server-ka.', 'error');
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
            if (recognitionObj && isListening) {
                try { recognitionObj.stop(); } catch(e) {}
            }
            setIsListening(false);
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
            setPaymentPhone('');
            setRecipientName('');
            setShowSavedContacts(false);
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

                {/* Tab Switcher: Foom Cusub vs Dalabadayda */}
                <div className="grid grid-cols-2 gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
                    <button
                        type="button"
                        onClick={() => { triggerHaptic('light'); setActiveTab('NEW'); }}
                        className={`py-2.5 px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                            activeTab === 'NEW'
                                ? 'bg-[var(--tg-theme-button-color,#3b82f6)] text-[var(--tg-theme-button-text-color,#ffffff)] shadow-md'
                                : 'text-[var(--tg-theme-hint-color,#94a3b8)] hover:text-white'
                        }`}
                    >
                        ➕ Foom Cusub
                    </button>
                    <button
                        type="button"
                        onClick={() => { triggerHaptic('light'); setActiveTab('HISTORY'); }}
                        className={`py-2.5 px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                            activeTab === 'HISTORY'
                                ? 'bg-[var(--tg-theme-button-color,#3b82f6)] text-[var(--tg-theme-button-text-color,#ffffff)] shadow-md'
                                : 'text-[var(--tg-theme-hint-color,#94a3b8)] hover:text-white'
                        }`}
                    >
                        📋 Dalabadayda
                    </button>
                </div>

                {activeTab === 'HISTORY' ? (
                    <div className="flex flex-col gap-3">
                        {/* Date Filter Controls */}
                        <div className="flex flex-col gap-2 bg-[var(--tg-theme-secondary-bg-color,rgba(255,255,255,0.02))] border border-white/5 rounded-2xl p-3">
                            <label className="text-[10px] font-black uppercase text-[var(--tg-theme-hint-color,#94a3b8)] tracking-wider flex items-center justify-between">
                                <span>📅 Filter Taariikhda</span>
                                {loadingHistory && <Loader2 className="animate-spin text-blue-400" size={12} />}
                            </label>
                            
                            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                                {[
                                    { key: 'all', label: 'Dhammaan' },
                                    { key: 'today', label: 'Maanta' },
                                    { key: 'week', label: 'Toddobaadkan' },
                                    { key: 'month', label: 'Bishan' },
                                    { key: 'custom', label: 'Taariikh Gaar Ah' }
                                ].map((f) => (
                                    <button
                                        key={f.key}
                                        type="button"
                                        onClick={() => { triggerHaptic('light'); setHistoryFilter(f.key as any); }}
                                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all border ${
                                            historyFilter === f.key
                                                ? 'bg-[var(--tg-theme-button-color,#3b82f6)] text-white border-transparent'
                                                : 'bg-white/5 text-[var(--tg-theme-hint-color,#94a3b8)] border-white/5 hover:border-white/20'
                                        }`}
                                    >
                                        {f.label}
                                    </button>
                                ))}
                            </div>

                            {historyFilter === 'custom' && (
                                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                                    <div>
                                        <span className="text-[9px] text-[var(--tg-theme-hint-color,#94a3b8)] uppercase font-bold">Ka (Start)</span>
                                        <input
                                            type="date"
                                            value={customStartDate}
                                            onChange={(e) => setCustomStartDate(e.target.value)}
                                            className="w-full p-2 bg-black/20 border border-white/10 rounded-lg text-xs font-bold text-white outline-none"
                                        />
                                    </div>
                                    <div>
                                        <span className="text-[9px] text-[var(--tg-theme-hint-color,#94a3b8)] uppercase font-bold">Ilaa (End)</span>
                                        <input
                                            type="date"
                                            value={customEndDate}
                                            onChange={(e) => setCustomEndDate(e.target.value)}
                                            className="w-full p-2 bg-black/20 border border-white/10 rounded-lg text-xs font-bold text-white outline-none"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Expense Cards List */}
                        {loadingHistory ? (
                            <div className="flex flex-col items-center justify-center p-8 gap-2">
                                <Loader2 className="animate-spin text-blue-500" size={24} />
                                <p className="text-xs font-bold opacity-60">Soo akhrinaya dalabadadii hore...</p>
                            </div>
                        ) : historyExpenses.length === 0 ? (
                            <div className="bg-white/5 border border-white/5 rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-2">
                                <p className="text-2xl">📭</p>
                                <p className="text-xs font-bold opacity-70">Wax dalab ah oo la helay ma jiraan taariikhdan.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2.5">
                                {historyExpenses.map((exp) => (
                                    <div
                                        key={exp.id}
                                        onClick={() => handleOpenEdit(exp)}
                                        className="bg-[var(--tg-theme-secondary-bg-color,rgba(255,255,255,0.03))] hover:bg-white/10 border border-white/10 rounded-2xl p-4 cursor-pointer transition-all flex justify-between items-start gap-3 shadow-sm hover:shadow-md"
                                    >
                                        <div className="flex flex-col gap-1 flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black rounded-md uppercase">
                                                    {exp.category}
                                                </span>
                                                <span className="text-[10px] text-[var(--tg-theme-hint-color,#94a3b8)] font-bold">
                                                    {new Date(exp.createdAt).toLocaleDateString('so-SO')}
                                                </span>
                                            </div>

                                            <p className="text-xs font-bold line-clamp-2 mt-0.5">
                                                {exp.description || exp.note || 'Kharash'}
                                            </p>

                                            {exp.employeeName && (
                                                <p className="text-[10px] text-emerald-400 font-bold">
                                                    👤 {exp.employeeName}
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex flex-col items-end gap-1">
                                            <span className="text-sm font-black text-emerald-400">
                                                {Number(exp.amount).toLocaleString()} ETB
                                            </span>
                                            <div className="flex items-center gap-1.5">
                                                {isOwnerOfExpense(exp) ? (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleOpenEdit(exp);
                                                            }}
                                                            className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-all"
                                                            title="Edit"
                                                        >
                                                            <Pencil size={12} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteExpense(exp.id);
                                                            }}
                                                            className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-all"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <span className="text-[10px] text-white/40 font-bold px-1.5 py-0.5 bg-white/5 rounded border border-white/5" title="Kharashkan waxaa soo galay qof kale">
                                                        🔒
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <>
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

                            {categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => {
                                        handleCategoryChange(`EXPENSE_${cat.id}`, cat.name);
                                        setDropdownOpen(false);
                                    }}
                                    className="w-full p-3 hover:bg-[var(--tg-theme-secondary-bg-color,rgba(255,255,255,0.05))] text-left text-sm font-bold flex items-center gap-2 border-b border-[var(--tg-theme-hint-color,rgba(255,255,255,0.05))] opacity-90 transition-all text-[var(--tg-theme-text-color,#ffffff)] last:border-0"
                                >
                                    {getCategoryIcon(cat.name)}
                                    <span>{cat.name}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Form Body - Hidden until Category selected */}
                {!selectedCategoryKey ? (
                    <div className="bg-[var(--tg-theme-secondary-bg-color,rgba(255,255,255,0.02))] border border-white/5 rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-3">
                        <Tag className="text-[var(--tg-theme-hint-color,#94a3b8)] opacity-40" size={32} />
                        <p className="text-xs font-bold text-[var(--tg-theme-hint-color,#94a3b8)] max-w-[200px]">
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
                                            <span className="text-[var(--tg-theme-text-color,#ffffff)]">{selectedEmployee.monthlySalary?.toLocaleString() || 0} ETB</span>
                                        </div>
                                        <div className="flex justify-between font-bold">
                                            <span className="text-[var(--tg-theme-hint-color,#94a3b8)]">Lacagta La Bixiyay Bishan:</span>
                                            <span className="text-emerald-400">{selectedEmployee.paidThisMonth?.toLocaleString() || 0} ETB</span>
                                        </div>
                                        <div className="flex justify-between font-bold pt-1 border-t border-white/5">
                                            <span className="text-[var(--tg-theme-hint-color,#94a3b8)]">Ku Dhiiban Bishan:</span>
                                            <span className="text-amber-400 font-extrabold">{selectedEmployee.dueThisMonth?.toLocaleString() || 0} ETB</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* --- TAB 2: RAW MATERIAL --- */}
                        {isRawMaterial && (
                            <div className="flex flex-col gap-3 animate-fade-in">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-black text-[var(--tg-theme-hint-color,#94a3b8)] uppercase tracking-wider flex items-center gap-1.5">
                                        <Truck size={11} className="text-[var(--tg-theme-button-color,#3b82f6)]" /> Supplier / Dealer
                                    </label>
                                    {!isNewVendor ? (
                                        <div className="flex gap-2">
                                            <select required value={selectedVendorId} onChange={(e) => setSelectedVendorId(e.target.value)}
                                                className="flex-1 p-3 bg-[var(--tg-theme-bg-color,rgba(0,0,0,0.2))] text-[var(--tg-theme-text-color,#ffffff)] border border-white/10 rounded-xl text-sm font-bold outline-none"
                                            >
                                                <option value="" className="bg-slate-950">Dooro Supplier...</option>
                                                {vendors.map(v => (
                                                    <option key={v.id} value={v.id} className="bg-slate-950">{v.name}</option>
                                                ))}
                                            </select>
                                            <button type="button" onClick={() => setIsNewVendor(true)}
                                                className="px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-xl text-xs font-bold whitespace-nowrap transition-all"
                                            >
                                                + Cusub
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex gap-2">
                                            <input type="text" required value={newVendorName} onChange={(e) => setNewVendorName(e.target.value)}
                                                placeholder="Geli magaca Supplier-ka cusub"
                                                className="flex-1 p-3 bg-[var(--tg-theme-bg-color,rgba(0,0,0,0.2))] text-[var(--tg-theme-text-color,#ffffff)] border border-white/10 rounded-xl text-sm font-bold outline-none"
                                            />
                                            <button type="button" onClick={() => { setIsNewVendor(false); setNewVendorName(''); }}
                                                className="px-3 py-2 bg-white/5 hover:bg-white/10 text-[var(--tg-theme-hint-color,#94a3b8)] border border-white/10 rounded-xl text-xs font-bold whitespace-nowrap transition-all"
                                            >
                                                Tilmaam
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-black text-[var(--tg-theme-hint-color,#94a3b8)] uppercase tracking-wider flex items-center gap-1.5">
                                        <Package size={11} className="text-[var(--tg-theme-button-color,#3b82f6)]" /> Magaca Alaabta (Material Name)
                                    </label>
                                    {!isNewMaterial ? (
                                        <div className="flex gap-2">
                                            <select required value={selectedMaterialName} onChange={(e) => setSelectedMaterialName(e.target.value)}
                                                className="flex-1 p-3 bg-[var(--tg-theme-bg-color,rgba(0,0,0,0.2))] text-[var(--tg-theme-text-color,#ffffff)] border border-white/10 rounded-xl text-sm font-bold outline-none"
                                            >
                                                <option value="" className="bg-slate-950">Dooro Material...</option>
                                                {materials.map(m => (
                                                    <option key={m.id} value={m.name} className="bg-slate-950">{m.name} ({m.unit})</option>
                                                ))}
                                            </select>
                                            <button type="button" onClick={() => setIsNewMaterial(true)}
                                                className="px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-xl text-xs font-bold whitespace-nowrap transition-all"
                                            >
                                                + Cusub
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex gap-2">
                                            <input type="text" required value={newMaterialName} onChange={(e) => setNewMaterialName(e.target.value)}
                                                placeholder="Geli magaca alaabta cusub"
                                                className="flex-1 p-3 bg-[var(--tg-theme-bg-color,rgba(0,0,0,0.2))] text-[var(--tg-theme-text-color,#ffffff)] border border-white/10 rounded-xl text-sm font-bold outline-none"
                                            />
                                            <button type="button" onClick={() => { setIsNewMaterial(false); setNewMaterialName(''); }}
                                                className="px-3 py-2 bg-white/5 hover:bg-white/10 text-[var(--tg-theme-hint-color,#94a3b8)] border border-white/10 rounded-xl text-xs font-bold whitespace-nowrap transition-all"
                                            >
                                                Tilmaam
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-black text-[var(--tg-theme-hint-color,#94a3b8)] uppercase tracking-wider flex items-center gap-1.5">
                                            <Hash size={11} className="text-[var(--tg-theme-button-color,#3b82f6)]" /> Tirada (Qty)
                                        </label>
                                        <input type="number" step="any" required value={quantity} onChange={(e) => setQuantity(e.target.value)}
                                            placeholder="Tusaale: 50"
                                            className="w-full p-3 bg-[var(--tg-theme-bg-color,rgba(0,0,0,0.2))] text-[var(--tg-theme-text-color,#ffffff)] border border-white/10 rounded-xl text-sm font-bold outline-none"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-black text-[var(--tg-theme-hint-color,#94a3b8)] uppercase tracking-wider flex items-center gap-1.5">
                                            <Banknote size={11} className="text-[var(--tg-theme-button-color,#3b82f6)]" /> Qiimaha/Xabo
                                        </label>
                                        <input type="number" step="any" required value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)}
                                            placeholder="Tusaale: 120"
                                            className="w-full p-3 bg-[var(--tg-theme-bg-color,rgba(0,0,0,0.2))] text-[var(--tg-theme-text-color,#ffffff)] border border-white/10 rounded-xl text-sm font-bold outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* --- TAB 3: GENERAL EXPENSE --- */}
                        {isExpense && (
                            <div className="flex flex-col gap-3 animate-fade-in">
                                {selectedCategoryName === 'Transport & Fuel' && (
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-black text-[var(--tg-theme-hint-color,#94a3b8)] uppercase tracking-wider flex items-center gap-1.5">
                                            <Truck size={11} className="text-[var(--tg-theme-button-color,#3b82f6)]" /> Nooca Gadiidka
                                        </label>
                                        <input type="text" value={transportType} onChange={(e) => setTransportType(e.target.value)}
                                            placeholder="Tusaale: Bajaj / Gadiid V8 / Shidaal"
                                            className="w-full p-3 bg-[var(--tg-theme-bg-color,rgba(0,0,0,0.2))] text-[var(--tg-theme-text-color,#ffffff)] border border-white/10 rounded-xl text-sm font-bold outline-none"
                                        />
                                    </div>
                                )}

                                {selectedCategoryName === 'Equipment Rental' && (
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-xs font-black text-[var(--tg-theme-hint-color,#94a3b8)] uppercase tracking-wider flex items-center gap-1.5">
                                                <Wrench size={11} className="text-[var(--tg-theme-button-color,#3b82f6)]" /> Qalabka
                                            </label>
                                            <input type="text" value={equipmentName} onChange={(e) => setEquipmentName(e.target.value)}
                                                placeholder="Magaca qalabka"
                                                className="w-full p-3 bg-[var(--tg-theme-bg-color,rgba(0,0,0,0.2))] text-[var(--tg-theme-text-color,#ffffff)] border border-white/10 rounded-xl text-sm font-bold outline-none"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-xs font-black text-[var(--tg-theme-hint-color,#94a3b8)] uppercase tracking-wider flex items-center gap-1.5">
                                                <Calendar size={11} className="text-[var(--tg-theme-button-color,#3b82f6)]" /> Muddada
                                            </label>
                                            <input type="text" value={rentalPeriod} onChange={(e) => setRentalPeriod(e.target.value)}
                                                placeholder="Tusaale: 3 maalmood"
                                                className="w-full p-3 bg-[var(--tg-theme-bg-color,rgba(0,0,0,0.2))] text-[var(--tg-theme-text-color,#ffffff)] border border-white/10 rounded-xl text-sm font-bold outline-none"
                                            />
                                        </div>
                                    </div>
                                )}

                                {selectedCategoryName === 'Consultancy & Service' && (
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-xs font-black text-[var(--tg-theme-hint-color,#94a3b8)] uppercase tracking-wider flex items-center gap-1.5">
                                                <User size={11} className="text-[var(--tg-theme-button-color,#3b82f6)]" /> La-taliyaha
                                            </label>
                                            <input type="text" value={consultantName} onChange={(e) => setConsultantName(e.target.value)}
                                                placeholder="Magaca la-taliyaha"
                                                className="w-full p-3 bg-[var(--tg-theme-bg-color,rgba(0,0,0,0.2))] text-[var(--tg-theme-text-color,#ffffff)] border border-white/10 rounded-xl text-sm font-bold outline-none"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-xs font-black text-[var(--tg-theme-hint-color,#94a3b8)] uppercase tracking-wider flex items-center gap-1.5">
                                                <ClipboardList size={11} className="text-[var(--tg-theme-button-color,#3b82f6)]" /> Adeegga
                                            </label>
                                            <input type="text" value={consultancyType} onChange={(e) => setConsultancyType(e.target.value)}
                                                placeholder="Tusaale: Audit / Legal"
                                                className="w-full p-3 bg-[var(--tg-theme-bg-color,rgba(0,0,0,0.2))] text-[var(--tg-theme-text-color,#ffffff)] border border-white/10 rounded-xl text-sm font-bold outline-none"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* --- COMMON FIELDS --- */}
                        {!isRawMaterial && (
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-black text-[var(--tg-theme-hint-color,#94a3b8)] uppercase tracking-wider flex items-center gap-1.5">
                                    <DollarSign size={11} className="text-[var(--tg-theme-button-color,#3b82f6)]" /> Lacagta (Amount ETB)
                                </label>
                                <input type="number" step="any" required value={amount} onChange={(e) => setAmount(e.target.value)}
                                    placeholder="Geli lacagta ETB..."
                                    className="w-full p-3 bg-[var(--tg-theme-bg-color,rgba(0,0,0,0.2))] text-emerald-400 font-extrabold border border-white/10 rounded-xl text-base outline-none focus:border-[var(--tg-theme-button-color,#3b82f6)]"
                                />
                            </div>
                        )}

                        {isRawMaterial && (
                            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex justify-between items-center">
                                <span className="text-xs font-bold text-emerald-400">Total-ka Alaabta:</span>
                                <span className="text-base font-black text-emerald-400">{calculatedTotal.toLocaleString()} ETB</span>
                            </div>
                        )}

                        {/* Payment Contact Fields */}
                        {!(selectedCategoryKey === 'SALARY' && selectedEmployeeId) && (
                            <div className="flex flex-col gap-2 p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                                <div className="flex justify-between items-center">
                                    <label className="text-[10px] font-black text-[var(--tg-theme-hint-color,#94a3b8)] uppercase tracking-wider flex items-center gap-1.5">
                                        <Phone size={10} className="text-[var(--tg-theme-button-color,#3b82f6)]" /> Qofka Lacagta loo xawilayo
                                    </label>
                                    {activeCategorySavedContacts.length > 0 && (
                                        <button type="button" onClick={() => setShowSavedContacts(!showSavedContacts)}
                                            className="text-[10px] font-bold text-[var(--tg-theme-button-color,#3b82f6)] hover:underline"
                                        >
                                            {showSavedContacts ? 'Qari' : `📋 Xiriirradii Hore (${activeCategorySavedContacts.length})`}
                                        </button>
                                    )}
                                </div>

                                {showSavedContacts && activeCategorySavedContacts.length > 0 && (
                                    <div className="flex flex-col gap-1 max-h-32 overflow-y-auto p-1 bg-black/20 rounded-lg border border-white/5">
                                        {activeCategorySavedContacts.map((c, idx) => (
                                            <button key={idx} type="button" onClick={() => handleSelectSavedContact(c)}
                                                className="p-1.5 hover:bg-white/10 rounded text-left text-xs font-bold flex justify-between items-center transition-all"
                                            >
                                                <span>{c.name}</span>
                                                <span className="text-[10px] text-[var(--tg-theme-hint-color,#94a3b8)]">{c.phone}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-2">
                                    <input type="text" value={recipientName} onChange={(e) => setRecipientName(e.target.value)}
                                        placeholder="Magaca loo dirayo"
                                        className="w-full p-2.5 bg-[var(--tg-theme-bg-color,rgba(0,0,0,0.2))] text-[var(--tg-theme-text-color,#ffffff)] border border-white/10 rounded-lg text-xs font-bold outline-none"
                                    />
                                    <input type="tel" value={paymentPhone} onChange={(e) => setPaymentPhone(e.target.value)}
                                        placeholder="Lambar (09.../07...)"
                                        className="w-full p-2.5 bg-[var(--tg-theme-bg-color,rgba(0,0,0,0.2))] text-[var(--tg-theme-text-color,#ffffff)] border border-white/10 rounded-lg text-xs font-bold outline-none"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Note & Voice Input */}
                        <div className="flex flex-col gap-1.5">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-black text-[var(--tg-theme-hint-color,#94a3b8)] uppercase tracking-wider flex items-center gap-1.5">
                                    <FileText size={11} className="text-[var(--tg-theme-button-color,#3b82f6)]" /> Sharaxaad / Faustina
                                </label>
                                <button type="button" onClick={toggleVoiceRecognition}
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1 transition-all ${
                                        isListening ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse' : 'bg-white/5 text-[var(--tg-theme-hint-color,#94a3b8)] hover:text-white border border-white/10'
                                    }`}
                                >
                                    {isListening ? <MicOff size={10} /> : <Mic size={10} />}
                                    {isListening ? 'Dhegeystaya...' : '🎙️ Cod ku qor'}
                                </button>
                            </div>
                            <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)}
                                placeholder="Fadlan sharaxaad yar ka bixi kharashkan..."
                                className="w-full p-3 bg-[var(--tg-theme-bg-color,rgba(0,0,0,0.2))] text-[var(--tg-theme-text-color,#ffffff)] border border-white/10 rounded-xl text-xs font-bold outline-none focus:border-[var(--tg-theme-button-color,#3b82f6)]"
                            />
                        </div>

                        {/* Account Selector */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-black text-[var(--tg-theme-hint-color,#94a3b8)] uppercase tracking-wider flex items-center gap-1.5">
                                <Wallet size={11} className="text-[var(--tg-theme-button-color,#3b82f6)]" /> Koontada Lagaga Bixinayo
                            </label>
                            <select required value={selectedAccountId} onChange={(e) => setSelectedAccountId(e.target.value)}
                                className="w-full p-3 bg-[var(--tg-theme-bg-color,rgba(0,0,0,0.2))] text-[var(--tg-theme-text-color,#ffffff)] border border-white/10 rounded-xl text-sm font-bold outline-none"
                            >
                                {accounts.map(acc => (
                                    <option key={acc.id} value={acc.id} className="bg-slate-950">
                                        {acc.name} ({acc.balance.toLocaleString()} {acc.currency})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Batch Action Buttons */}
                        <div className="flex gap-2 pt-1">
                            <button type="button" onClick={handleAddToBatch}
                                className="flex-1 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5"
                            >
                                <PlusCircle size={14} /> Ku dar Batch-ka
                            </button>
                        </div>

                        {validBatchItems.length > 0 && (
                            <div className="p-3 bg-white/[0.02] border border-white/10 rounded-xl flex flex-col gap-2 animate-fade-in">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-black text-blue-400 uppercase tracking-wider">📦 Batch-ka Diiwaangashan ({validBatchItems.length})</span>
                                    <button type="button" onClick={handleClearBatch} className="text-[10px] font-bold text-red-400 hover:underline">Zaaqa Dhammaan</button>
                                </div>

                                <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto">
                                    {validBatchItems.map((item) => (
                                        <div key={item.id} className="p-2 bg-black/20 rounded-lg flex justify-between items-center text-xs font-bold border border-white/5">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-blue-400">{item.categoryName}</span>
                                                <span className="text-[11px] text-white/90 line-clamp-1">{item.note || item.employeeName || item.materialName || 'Kharash'}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-emerald-400 font-extrabold">
                                                    {item.amount.toLocaleString()} ETB
                                                </span>
                                                <button type="button" onClick={() => handleRemoveFromBatch(item.id)}
                                                    className="p-1 hover:bg-red-500/20 text-red-500 rounded-md transition-all"
                                                >
                                                    <Trash2 size={11} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button type="submit" disabled={submitting || !selectedAccountId}
                            className="w-full py-3.5 bg-[var(--tg-theme-button-color,#3b82f6)] text-[var(--tg-theme-button-text-color,#ffffff)] rounded-xl font-black text-sm uppercase tracking-widest hover:opacity-90 active:scale-[0.99] disabled:opacity-40 transition-all flex items-center justify-center gap-2 mt-1"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="animate-spin" size={14} />
                                    Diiwaangelinta waa socotaa...
                                </>
                            ) : validBatchItems.length > 0 ? (
                                <>
                                    🚀 Wada Dir Dhammaan ({validBatchItems.length} Dalab - {totalBatchAmount.toLocaleString()} ETB)
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
                </>
            )}

                {/* Edit Expense Modal Overlay (Redesigned with Premium Dark Theme & All Fields) */}
                {editingExpense && (
                    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
                        <div className="w-full max-w-md bg-[var(--tg-theme-bg-color,#0b0f19)] border border-white/15 rounded-t-3xl sm:rounded-3xl p-5 flex flex-col gap-4 shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center border-b border-white/10 pb-3">
                                <div>
                                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-1">
                                        <Pencil size={11} /> Wax ka beddel Codsiga
                                    </p>
                                    <h3 className="text-base font-black text-white">{editingExpense.category}</h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setEditingExpense(null)}
                                    className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-white/60 hover:text-white transition-all"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="flex flex-col gap-3.5">
                                {/* Amount Field */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-black text-[var(--tg-theme-hint-color,#94a3b8)] uppercase tracking-wider flex items-center gap-1.5">
                                        <DollarSign size={11} className="text-emerald-400" /> Lacagta (Amount ETB)
                                    </label>
                                    <input
                                        type="number"
                                        step="any"
                                        required
                                        value={editAmount}
                                        onChange={(e) => setEditAmount(e.target.value)}
                                        className="w-full p-3 bg-white/[0.03] border border-white/10 rounded-xl text-base font-extrabold text-emerald-400 outline-none focus:border-blue-500 transition-all"
                                        placeholder="Geli lacagta..."
                                    />
                                </div>

                                {/* Category Selector */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-black text-[var(--tg-theme-hint-color,#94a3b8)] uppercase tracking-wider flex items-center gap-1.5">
                                        <Tag size={11} className="text-blue-400" /> Qaybta (Category)
                                    </label>
                                    <select
                                        value={editCategoryId}
                                        onChange={(e) => setEditCategoryId(e.target.value)}
                                        className="w-full p-3 bg-white/[0.03] text-white border border-white/10 rounded-xl text-xs font-bold outline-none focus:border-blue-500"
                                    >
                                        <option value="" className="bg-slate-950">{editingExpense.category}</option>
                                        {categories.map((c) => (
                                            <option key={c.id} value={c.id} className="bg-slate-950">{c.name}</option>
                                        ))}
                                    </select>

                                    {!editingExpense?.employeeId && (
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="flex flex-col gap-1">
                                                <label className="text-[10px] font-black text-[var(--tg-theme-hint-color,#94a3b8)] uppercase">👤 Loo Dirayo</label>
                                                <input
                                                    type="text"
                                                    value={editRecipientName}
                                                    onChange={(e) => setEditRecipientName(e.target.value)}
                                                    className="w-full p-2.5 bg-white/[0.03] border border-white/10 rounded-xl text-xs font-bold text-white outline-none focus:border-blue-500"
                                                    placeholder="Magaca"
                                                />
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <label className="text-[10px] font-black text-[var(--tg-theme-hint-color,#94a3b8)] uppercase">📱 Lambarka</label>
                                                <input
                                                    type="tel"
                                                    value={editPhone}
                                                    onChange={(e) => setEditPhone(e.target.value)}
                                                    className="w-full p-2.5 bg-white/[0.03] border border-white/10 rounded-xl text-xs font-bold text-white outline-none focus:border-blue-500"
                                                    placeholder="Lambar"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Clean Note Field */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-black text-[var(--tg-theme-hint-color,#94a3b8)] uppercase tracking-wider flex items-center gap-1.5">
                                        <FileText size={11} className="text-blue-400" /> Sharaxaadda (Note)
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={editNote}
                                        onChange={(e) => setEditNote(e.target.value)}
                                        className="w-full p-3 bg-white/[0.03] border border-white/10 rounded-xl text-xs font-bold text-white outline-none focus:border-blue-500"
                                        placeholder="Sharaxaad ka bixi kharashka..."
                                    />
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2 pt-3 border-t border-white/10">
                                <button
                                    type="button"
                                    onClick={() => handleDeleteExpense(editingExpense.id)}
                                    disabled={deletingId === editingExpense.id || savingEdit}
                                    className="py-3 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all"
                                >
                                    {deletingId === editingExpense.id ? <Loader2 className="animate-spin" size={14} /> : <Trash2 size={14} />}
                                    Tirtir
                                </button>
                                
                                <button
                                    type="button"
                                    onClick={handleSaveEdit}
                                    disabled={savingEdit || !editAmount}
                                    className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-lg hover:shadow-blue-500/25 active:scale-[0.99] disabled:opacity-40"
                                >
                                    {savingEdit ? <Loader2 className="animate-spin" size={14} /> : '💾 Cusboonaysii (Save)'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Custom Glassmorphism Alert Modal */}
                <CustomAlertModal 
                    isOpen={alertModal.isOpen} 
                    onClose={() => setAlertModal(prev => ({ ...prev, isOpen: false }))} 
                    type={alertModal.type} 
                    title={alertModal.title} 
                    message={alertModal.message} 
                />
            </div>
        </div>
    );
}
