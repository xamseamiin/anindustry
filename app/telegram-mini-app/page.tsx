'use client';

import React, { useState, useEffect, useRef } from 'react';
import Script from 'next/script';
import { 
    Loader2, CheckCircle2, DollarSign, Wallet, 
    FileText, User, Tag, Truck, Settings, ShoppingBag, 
    Award, ArrowRight, Layers, Factory, Package,
    Hash, Banknote, Calendar, ClipboardList, Wrench, Phone,
    Mic, MicOff, PlusCircle, Trash2, Pencil, AlertTriangle, ChevronLeft, Bell,
    Home, ArrowUpRight, ArrowDownLeft, Search, Filter, Share2, ExternalLink, Download, UserCheck, ShieldCheck, BarChart3, PieChart,
    Eye, EyeOff, Lock, Smartphone, SlidersHorizontal, LogOut, Camera, FileSpreadsheet
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
    billType?: string;
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
    const isSalary = selectedCategoryKey === 'SALARY';
    const isRawMaterial = selectedCategoryKey === 'RAW_MATERIAL';
    const isExpense = selectedCategoryKey.startsWith('EXPENSE_');

    // General Form Fields
    const [selectedAccountId, setSelectedAccountId] = useState('');
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [chatId, setChatId] = useState('');
    // Metadata & Manager Authorization
    const [requesterName, setRequesterName] = useState('WebApp User');
    const [requesterId, setRequesterId] = useState('');
    const [requesterUsername, setRequesterUsername] = useState('');
    const [telegramPhotoUrl, setTelegramPhotoUrl] = useState('');
    const [profileData, setProfileData] = useState<any>(null);
    const [showTelegramId, setShowTelegramId] = useState(false);
    const [profilePreferences, setProfilePreferences] = useState({
        sound: true,
        vibration: true,
        approvals: true,
        receipts: true,
        language: 'so',
        defaultCategory: '',
        defaultAccount: ''
    });
    const profilePreferencesRef = useRef(profilePreferences);
    // Manager authorization check (Abdehakim & Hamze Amiin for testing)
    const isManager = requesterUsername.toLowerCase() === 'abdehakimmumin' || requesterName.toLowerCase().includes('abdehakim') || requesterUsername.toLowerCase() === 'hamsemoalin' || requesterName.toLowerCase().includes('hamze') || String(requesterId) === '748392019';
    const effectiveIsManager = profileData?.permissions?.approve ?? isManager;

    // Tab 1: Salary Fields
    const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
    const [isNewEmployee, setIsNewEmployee] = useState(false);
    const [newEmployeeName, setNewEmployeeName] = useState('');

    // Tab 2: Expense Fields (dynamic based on selected key)
    const [selectedCategoryId, setSelectedCategoryId] = useState('');
    const [selectedCategoryName, setSelectedCategoryName] = useState('');
    const [amountInput, setAmountInput] = useState('');
    const [receiptFile, setReceiptFile] = useState<File | null>(null);
    const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

    // Edit Transaction Modal State
    const [showEditTxModal, setShowEditTxModal] = useState(false);
    const [editingTx, setEditingTx] = useState<any>(null);

    // Notification Modal & Sound/Vibration Helper
    const [showNotificationModal, setShowNotificationModal] = useState(false);
    const [transportType, setTransportType] = useState('');
    const [billType, setBillType] = useState('');

    const playNotificationSoundAndVibrate = () => {
        try {
            if (profilePreferencesRef.current.vibration && typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.HapticFeedback) {
                (window as any).Telegram.WebApp.HapticFeedback.notificationOccurred('success');
                setTimeout(() => {
                    try { (window as any).Telegram.WebApp.HapticFeedback.notificationOccurred('success'); } catch {}
                }, 180);
            }
            if (profilePreferencesRef.current.vibration && typeof window !== 'undefined' && 'vibrate' in navigator) {
                navigator.vibrate([150, 100, 150]);
            }
        } catch (e) {
            console.log('Haptic error:', e);
        }

        try {
            if (profilePreferencesRef.current.sound && typeof window !== 'undefined' && (window.AudioContext || (window as any).webkitAudioContext)) {
                const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
                const ctx = new AudioCtx();
                
                const playNote = (freq: number, start: number, duration: number) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
                    gain.gain.setValueAtTime(0.15, ctx.currentTime + start);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(ctx.currentTime + start);
                    osc.stop(ctx.currentTime + start + duration);
                };
                
                playNote(659.25, 0, 0.15); // E5
                playNote(880.00, 0.12, 0.25); // A5
            }
        } catch (e) {
            console.log('Audio error:', e);
        }
    };
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

    // 5-Tab iOS 26 Dock States
    const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'TRANSACTIONS' | 'NEW' | 'REPORTS' | 'PROFILE'>('DASHBOARD');
    const [historyFilter, setHistoryFilter] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('all');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [historyExpenses, setHistoryExpenses] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const latestHistoryIdRef = useRef<string | null>(null);
    
    // Transactions Ledger & Detail Modal states
    const [selectedTransactionForDetails, setSelectedTransactionForDetails] = useState<any | null>(null);
    const [transactionSearchQuery, setTransactionSearchQuery] = useState('');
    const [transactionTypeFilter, setTransactionTypeFilter] = useState<'ALL' | 'DEPOSIT' | 'WITHDRAWAL'>('ALL');
    
    // Edit modal states
    const [editingExpense, setEditingExpense] = useState<any | null>(null);
    const [editAmount, setEditAmount] = useState('');
    const [editNote, setEditNote] = useState('');
    const [editPhone, setEditPhone] = useState('');
    const [editRecipientName, setEditRecipientName] = useState('');
    const [editCategoryId, setEditCategoryId] = useState('');
    const [savingEdit, setSavingEdit] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [showAccountModal, setShowAccountModal] = useState(false);
    const [selectedAccountForModal, setSelectedAccountForModal] = useState<any>(null);

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
            let url = `/api/telegram/history?filter=${historyFilter}&_t=${Date.now()}`;
            if (historyFilter === 'custom') {
                if (customStartDate) url += `&startDate=${encodeURIComponent(customStartDate)}`;
                if (customEndDate) url += `&endDate=${encodeURIComponent(customEndDate)}`;
            }
            const res = await fetch(url);
            const data = await res.json();
            if (data.success && Array.isArray(data.expenses)) {
                const newestId = data.expenses[0]?.id || null;
                if (historyFilter === 'all') latestHistoryIdRef.current = newestId;
                setHistoryExpenses(data.expenses);
            }
        } catch (err) {
            console.error('Error fetching history:', err);
        } finally {
            setLoadingHistory(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    useEffect(() => {
        if (activeTab === 'TRANSACTIONS' || activeTab === 'REPORTS' || activeTab === 'DASHBOARD') {
            fetchHistory();
        }
    }, [activeTab, historyFilter, customStartDate, customEndDate]);

    useEffect(() => {
        const pollForNewRequests = async () => {
            try {
                const res = await fetch(`/api/telegram/history?filter=all&_t=${Date.now()}`);
                const data = await res.json();
                const newestId = data.success && Array.isArray(data.expenses) ? data.expenses[0]?.id : null;
                if (latestHistoryIdRef.current && newestId && latestHistoryIdRef.current !== newestId) {
                    playNotificationSoundAndVibrate();
                    setHistoryExpenses(data.expenses);
                }
                if (newestId) latestHistoryIdRef.current = newestId;
            } catch (error) {
                console.error('Notification polling failed:', error);
            }
        };
        const notificationInterval = window.setInterval(pollForNewRequests, 15000);
        return () => window.clearInterval(notificationInterval);
    }, []);

    useEffect(() => {
        profilePreferencesRef.current = profilePreferences;
        if (requesterId) safeSetItem(`mini_profile_preferences_${requesterId}`, JSON.stringify(profilePreferences));
    }, [profilePreferences, requesterId]);

    useEffect(() => {
        if (profilePreferences.defaultAccount && accounts.some(a => a.id === profilePreferences.defaultAccount)) {
            setSelectedAccountId(profilePreferences.defaultAccount);
        }
        const preferredCategory = categories.find(c => c.id === profilePreferences.defaultCategory);
        if (preferredCategory && !selectedCategoryKey) {
            setSelectedCategoryId(preferredCategory.id);
            setSelectedCategoryName(preferredCategory.name);
            setSelectedCategoryKey(`EXPENSE_${preferredCategory.id}`);
        }
    }, [profilePreferences.defaultAccount, profilePreferences.defaultCategory, accounts, categories]);

    useEffect(() => {
        if (!requesterId) return;
        setProfilePreferences(safeParseJSON(`mini_profile_preferences_${requesterId}`, profilePreferences));
        fetch(`/api/telegram/profile?telegramId=${encodeURIComponent(requesterId)}&name=${encodeURIComponent(requesterName)}&username=${encodeURIComponent(requesterUsername)}`)
            .then(res => res.json())
            .then(data => { if (data.success) setProfileData(data.profile); })
            .catch(error => console.error('Profile loading failed:', error));
    }, [requesterId, requesterName, requesterUsername]);

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

    const openTransactionInMainForm = (exp: any) => {
        triggerHaptic('medium');
        if (!isOwnerOfExpense(exp)) {
            showAlert('Kaliya qofkii diiwaangeliyay ayaa wax ka beddeli kara.', 'error', 'Ogolaansho Ma Lehid');
            return;
        }

        const categoryName = exp.category || '';
        const description = exp.description || '';
        const structuredMatch = description.match(/^([^:]+?)(?:\s*\(([^)]+)\))?:\s*(.*)$/);

        setEditingTx(exp);
        setSelectedCategoryId(exp.categoryId || '');
        setSelectedCategoryName(categoryName);
        setSelectedCategoryKey(`EXPENSE_${exp.categoryId || ''}`);
        setSelectedAccountId(exp.accountId || selectedAccountId);
        setAmount(String(exp.amount || ''));
        setNote(structuredMatch?.[3] || exp.note || description);
        setRecipientName(exp.recipientName || '');
        setPaymentPhone(exp.paymentPhone || '');
        setTransportType(categoryName === 'Transport & Fuel' ? (structuredMatch?.[2] || '') : '');
        setBillType(categoryName === 'Bills' ? (exp.subCategory || structuredMatch?.[2] || '') : '');
        setEquipmentName(categoryName === 'Equipment Rental' ? (structuredMatch?.[2] || '') : '');
        setRentalPeriod('');
        setConsultantName(categoryName === 'Consultancy & Service' ? (structuredMatch?.[2] || '') : '');
        setConsultancyType('');
        setSelectedTransactionForDetails(null);
        setActiveTab('NEW');
        window.scrollTo({ top: 0, behavior: 'smooth' });
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
            consultancyType: consultancyType || undefined,
            billType: billType || undefined
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
        setBillType('');
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
                    if (user.username) setRequesterUsername(user.username);
                    if (user.id) setRequesterId(user.id.toString());
                    if (user.photo_url) setTelegramPhotoUrl(user.photo_url);
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

    const removeSavedContact = (phone: string) => {
        const transport = savedTransportContacts.filter(c => c.phone !== phone);
        const equipment = savedEquipmentContacts.filter(c => c.phone !== phone);
        const consultants = savedConsultantContacts.filter(c => c.phone !== phone);
        setSavedTransportContacts(transport);
        setSavedEquipmentContacts(equipment);
        setSavedConsultantContacts(consultants);
        safeSetItem('saved_transport_contacts', JSON.stringify(transport));
        safeSetItem('saved_equipment_contacts', JSON.stringify(equipment));
        safeSetItem('saved_consultant_contacts', JSON.stringify(consultants));
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

        // Editing deliberately reuses this exact Add form so every category-specific
        // field and validation behaves identically for create and update.
        if (editingTx) {
            if (!isOnline) {
                showAlert('Wax ka beddelku wuxuu u baahan yahay internet.', 'warning');
                setSubmitting(false);
                return;
            }

            try {
                const res = await fetch('/api/telegram/expense-actions', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: editingTx.expenseId || editingTx.id,
                        amount,
                        note,
                        paymentPhone,
                        recipientName,
                        categoryId: selectedCategoryId,
                        accountId: selectedAccountId,
                        transportType,
                        equipmentName,
                        rentalPeriod,
                        consultantName,
                        consultancyType,
                        billType
                    })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Wax ka beddelku wuu fashilmay.');

                triggerHaptic('success');
                setEditingTx(null);
                setActiveTab('TRANSACTIONS');
                await fetchHistory();
                showAlert('Transaction-ka iyo fariintiisa Telegram waa la cusboonaysiiyay.', 'success');
            } catch (error: any) {
                triggerHaptic('error');
                showAlert(error.message || 'Wax ka beddelku wuu fashilmay.', 'error');
            } finally {
                setSubmitting(false);
            }
            return;
        }

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
                if (item.billType) formData.append('billType', item.billType);
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
                } else if (selectedCategoryName === 'Bills') {
                    payload.billType = billType;
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
                } else if (selectedCategoryName === 'Bills') {
                    formData.append('billType', billType);
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

    const exportPersonalExcel = async () => {
        const XLSX = await import('xlsx');
        const rows = historyExpenses
            .filter(exp => !requesterId || exp.requesterId === requesterId || exp.requesterName?.includes(requesterName.split(' ')[0]))
            .map(exp => ({
                Date: new Date(exp.createdAt).toLocaleString('so-SO'),
                Category: exp.category,
                Description: exp.description,
                Amount_ETB: Number(exp.amount),
                Status: exp.paymentStatus,
                Receipt: exp.receiptUrl || ''
            }));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), 'My Requests');
        XLSX.writeFile(workbook, `AN-Industry-${requesterUsername || 'profile'}-report.xlsx`);
    };

    const exportPersonalPdf = async () => {
        const { jsPDF } = await import('jspdf');
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text('AN-Industry Personal Activity Report', 14, 18);
        doc.setFontSize(10);
        doc.text(`User: ${requesterName}`, 14, 27);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 34);
        let y = 44;
        (profileData?.recent || []).forEach((item: any) => {
            doc.text(`${new Date(item.date).toLocaleDateString()} | ${item.description.slice(0, 65)} | ${item.amount.toLocaleString()} ETB | ${item.status}`, 14, y);
            y += 7;
        });
        doc.save(`AN-Industry-${requesterUsername || 'profile'}-report.pdf`);
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

    if (success) {
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

    return (
        <div className="min-h-screen bg-[var(--tg-theme-bg-color,#0b0f19)] text-[var(--tg-theme-text-color,#ffffff)] font-sans selection:bg-blue-500/20 pb-8 pt-4 px-4 relative overflow-x-hidden">
            <TelegramScripts />

            <div className="max-w-md mx-auto flex flex-col gap-4">
                
                {/* iOS 26 Header */}
                <div className="flex justify-between items-center bg-slate-900/60 backdrop-blur-2xl border border-white/15 shadow-[0_0_25px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.2)] rounded-3xl p-4 px-5">
                    <button type="button" onClick={() => triggerHaptic('light')} className="w-10 h-10 rounded-full bg-white/10 border border-white/20 backdrop-blur-xl flex items-center justify-center text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] active:scale-95 transition-all">
                        <ChevronLeft size={20} />
                    </button>
                    
                    <div className="flex flex-col items-center text-center">
                        <div className="flex items-center gap-1.5">
                            <p className="text-[12px] font-black text-white tracking-wider uppercase">AN-INDUSTRY TERMINAL</p>
                            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse shadow-[0_0_8px_#60a5fa]" />
                        </div>
                        <h1 className="text-xs font-bold text-slate-400">Codsashada Kharashka</h1>
                    </div>

                    <button 
                        type="button" 
                        onClick={() => {
                            setShowNotificationModal(true);
                        }} 
                        className="w-10 h-10 rounded-full bg-white/10 border border-white/20 backdrop-blur-xl flex items-center justify-center text-white relative shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] active:scale-95 transition-all"
                        title="Ogeysiisyada & System Notifications"
                    >
                        <Bell size={18} />
                        <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-emerald-400 border-2 border-slate-900 rounded-full shadow-[0_0_6px_#34d399]" />
                    </button>
                </div>

                {/* Persistent Offline Status Banner */}
                {typeof window !== 'undefined' && (!navigator.onLine || safeParseJSON<any[]>('offline_submissions', []).length > 0) && (
                    <div className="bg-amber-500/20 backdrop-blur-xl border border-amber-400/40 rounded-2xl p-3.5 flex items-center justify-between gap-2 shadow-[0_0_20px_rgba(245,158,11,0.2)] animate-pulse">
                        <div className="flex items-center gap-2">
                            <span className="text-amber-400 font-bold text-xs">📶 Offline Mode:</span>
                            <span className="text-[11px] text-slate-200 font-bold">
                                {safeParseJSON<any[]>('offline_submissions', []).length} codsi ayaa draft ahaan u keydsan.
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => syncOfflineSubmissions()}
                            disabled={syncingOffline}
                            className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 flex items-center gap-1 shadow-lg"
                        >
                            {syncingOffline ? <Loader2 className="animate-spin" size={12} /> : 'Sync Now'}
                        </button>
                    </div>
                )}

                {activeTab === 'DASHBOARD' ? (
                    <div className="flex flex-col gap-4 animate-fade-in pb-16">
                        {/* E-Birr Merchant Account Card (Clickable to open Account Transactions Modal) */}
                        <div 
                            onClick={() => { triggerHaptic('medium'); setShowAccountModal(true); }}
                            className="bg-gradient-to-br from-emerald-950/60 via-slate-950/90 to-cyan-950/60 border border-emerald-400/40 rounded-3xl p-6 shadow-[0_0_35px_rgba(16,185,129,0.25),inset_0_1px_1.5px_rgba(255,255,255,0.3)] flex justify-between items-center backdrop-blur-2xl relative overflow-hidden cursor-pointer hover:border-emerald-400/80 transition-all group"
                        >
                            <div className="flex flex-col gap-3 z-10">
                                <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500/30 via-emerald-400/20 to-teal-500/30 border border-emerald-400/60 backdrop-blur-xl flex items-center justify-center text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.4),inset_0_1px_1px_rgba(255,255,255,0.4)]">
                                        <Wallet size={20} className="text-emerald-300" />
                                    </div>
                                    <span className="text-sm font-black text-white tracking-wide">
                                        {activeAccount ? activeAccount.name : 'E-Birr Merchant Account'}
                                    </span>
                                    <ArrowRight size={16} className="text-slate-400 group-hover:translate-x-1 transition-transform ml-1" />
                                </div>

                                <div className="flex flex-col mt-1">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Available Balance</span>
                                    <div className="flex items-baseline gap-1.5">
                                        <span className="text-3xl font-black text-white tracking-tight">
                                            {activeAccount ? Number(activeAccount.balance).toLocaleString() : '100,000'}
                                        </span>
                                        <span className="text-sm font-bold text-emerald-400">ETB</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 mt-1">Budget progress</span>
                                    <div className="w-36 bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1 border border-white/10">
                                        <div className="bg-gradient-to-r from-emerald-400 to-cyan-400 h-full rounded-full w-3/4 shadow-[0_0_8px_#34d399]" />
                                    </div>
                                </div>
                            </div>

                            {/* Speedometer Gauge SVG */}
                            <div className="relative w-28 h-28 flex items-center justify-center z-10">
                                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                                    <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.1)" strokeWidth="8" fill="none" />
                                    <circle cx="50" cy="50" r="40" stroke="url(#emerald-gradient)" strokeWidth="8" fill="none" strokeDasharray="251" strokeDashoffset="60" strokeLinecap="round" className="shadow-[0_0_15px_#10b981]" />
                                    <defs>
                                        <linearGradient id="emerald-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor="#34d399" />
                                            <stop offset="100%" stopColor="#3b82f6" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                    <span className="text-[9px] font-black text-emerald-400">CLICK</span>
                                    <span className="text-[8px] text-slate-400 font-bold">Ledger</span>
                                </div>
                            </div>
                        </div>

                        {/* Category Breakdown Card (Live Data) */}
                        <div className="bg-gradient-to-br from-slate-950/90 via-slate-900/90 to-cyan-950/40 border border-cyan-500/30 rounded-3xl p-5 shadow-[0_0_30px_rgba(6,182,212,0.15),inset_0_1px_1px_rgba(255,255,255,0.2)] flex flex-col gap-4 backdrop-blur-2xl">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                                        <Layers size={14} />
                                    </div>
                                    Category Breakdown
                                </h3>
                                <span className="text-slate-400 text-xs font-bold">Live Database</span>
                            </div>

                            <div className="flex flex-col gap-3.5">
                                {[
                                    { name: 'Salaries (Mushaharka)', color: 'bg-blue-500 shadow-[0_0_10px_#3b82f6]', icon: <User size={14} className="text-blue-400" /> },
                                    { name: 'Utilities & Rent (Biilasha & Kiro)', color: 'bg-indigo-500 shadow-[0_0_10px_#6366f1]', icon: <FileText size={14} className="text-indigo-400" /> },
                                    { name: 'Transport & Fuel (Gaadiidka)', color: 'bg-amber-500 shadow-[0_0_10px_#f59e0b]', icon: <Truck size={14} className="text-amber-400" /> },
                                    { name: 'Raw Materials & Rentals', color: 'bg-emerald-500 shadow-[0_0_10px_#10b981]', icon: <Package size={14} className="text-emerald-400" /> }
                                ].map((item) => {
                                    const catTotal = historyExpenses
                                        .filter(e => !e.isDeposit && e.type !== 'DEPOSIT')
                                        .filter(e => {
                                            const c = (e.category || '').toLowerCase();
                                            const d = (e.description || '').toLowerCase();
                                            if (item.name.includes('Salaries')) {
                                                return c.includes('salary') || c.includes('mushahar') || d.includes('mushahar') || d.includes('mushaar');
                                            }
                                            if (item.name.includes('Utilities')) {
                                                return c.includes('utility') || c.includes('utilities') || c.includes('rent') || d.includes('biil') || d.includes('laydh') || d.includes('kiro') || d.includes('rent');
                                            }
                                            if (item.name.includes('Transport')) {
                                                return c.includes('transport') || c.includes('fuel') || d.includes('transport') || d.includes('gaadhi') || d.includes('cagado') || d.includes('bajaaj');
                                            }
                                            if (item.name.includes('Raw Materials')) {
                                                return c.includes('raw') || c.includes('material') || c.includes('equipment') || c.includes('rental') || d.includes('raw') || d.includes('qalab');
                                            }
                                            return false;
                                        })
                                        .reduce((s, e) => s + Number(e.amount), 0);

                                    const totalWithdrawals = historyExpenses
                                        .filter(e => !e.isDeposit && e.type !== 'DEPOSIT')
                                        .reduce((s, e) => s + Number(e.amount), 0) || 1;

                                    const percent = Math.min(100, Math.round((catTotal / totalWithdrawals) * 100)) || 0;

                                    return (
                                        <div key={item.name} className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                                                {item.icon}
                                            </div>
                                            <div className="flex-1 flex flex-col gap-1">
                                                <div className="flex justify-between text-xs font-bold">
                                                    <span className="text-slate-200">{item.name}</span>
                                                    <span className="text-slate-400">{catTotal.toLocaleString()} ETB ({percent}%)</span>
                                                </div>
                                                <div className="w-full bg-slate-800/80 h-2 rounded-full overflow-hidden border border-white/5">
                                                    <div className={`h-full rounded-full ${item.color}`} style={{ width: `${Math.max(4, percent)}%` }} />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Manager Approval Workflow Card (Visible to Managers) */}
                        {effectiveIsManager ? (
                            <div className="bg-gradient-to-br from-slate-950/90 via-slate-900/90 to-blue-950/60 border border-blue-500/30 rounded-3xl p-5 shadow-[0_0_35px_rgba(59,130,246,0.2),inset_0_1px_1.5px_rgba(255,255,255,0.25)] flex flex-col gap-4 backdrop-blur-2xl relative overflow-hidden">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                                            <CheckCircle2 size={16} />
                                        </div>
                                        <div>
                                            <h3 className="text-xs font-black text-white uppercase tracking-wider">Manager Approval Workflow</h3>
                                            <p className="text-[10px] font-bold text-amber-300 mt-0.5">👤 Logged in as Manager ({requesterName})</p>
                                        </div>
                                    </div>
                                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500/30 to-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                                        🛡️
                                    </div>
                                </div>

                                {historyExpenses.filter(e => !e.approved && Number(e.amount) >= 5000).length === 0 ? (
                                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-center text-xs font-bold text-slate-300">
                                        ✅ Majiraan dalabyo waaweyn (&gt;= 5,000 ETB) oo sugaya approval-kaaga.
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-3">
                                        {historyExpenses.filter(e => !e.approved && Number(e.amount) >= 5000).map((exp) => (
                                            <div key={exp.id} className="p-4 bg-slate-950/80 border border-amber-500/40 rounded-2xl flex flex-col gap-3 shadow-lg">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <span className="text-[10px] font-black text-amber-400 uppercase bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                                                            ⏳ Sugaya Approval
                                                        </span>
                                                        <p className="text-xs font-bold text-white mt-1">
                                                            {exp.description || exp.category}
                                                        </p>
                                                        {exp.requesterName && (
                                                            <p className="text-[10px] text-slate-400 font-bold mt-0.5">👤 Codsaday: {exp.requesterName}</p>
                                                        )}
                                                    </div>
                                                    <span className="text-sm font-black text-amber-400">
                                                        {Number(exp.amount).toLocaleString()} ETB
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
                                                    <button
                                                        type="button"
                                                        onClick={async () => {
                                                            triggerHaptic('success');
                                                            const res = await fetch('/api/telegram/expense-actions', {
                                                                method: 'POST',
                                                                headers: { 'Content-Type': 'application/json' },
                                                                body: JSON.stringify({ id: exp.id, action: 'approve', managerName: requesterName })
                                                            });
                                                            const data = await res.json();
                                                            if (data.success) {
                                                                showAlert('✅ Dalabka waa la oggolaaday!', 'success');
                                                                fetchHistory();
                                                            }
                                                        }}
                                                        className="py-3 px-3 bg-gradient-to-b from-emerald-400/40 via-emerald-500/30 to-emerald-700/50 hover:from-emerald-400/60 border border-emerald-300/80 shadow-[0_0_15px_rgba(16,185,129,0.4)] text-white font-black rounded-xl text-xs active:scale-95 transition-all flex items-center justify-center gap-1.5"
                                                    >
                                                        <CheckCircle2 size={14} /> Approve
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={async () => {
                                                            triggerHaptic('warning');
                                                            const res = await fetch('/api/telegram/expense-actions', {
                                                                method: 'POST',
                                                                headers: { 'Content-Type': 'application/json' },
                                                                body: JSON.stringify({ id: exp.id, action: 'reject', managerName: requesterName })
                                                            });
                                                            const data = await res.json();
                                                            if (data.success) {
                                                                showAlert('🛑 Dalabku waa la diaday.', 'warning');
                                                                fetchHistory();
                                                            }
                                                        }}
                                                        className="py-3 px-3 bg-gradient-to-b from-blue-400/40 via-blue-500/30 to-blue-700/50 hover:from-blue-400/60 border border-blue-300/80 shadow-[0_0_15px_rgba(59,130,246,0.4)] text-white font-black rounded-xl text-xs active:scale-95 transition-all flex items-center justify-center gap-1.5"
                                                    >
                                                        <AlertTriangle size={14} /> Reject
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-4 text-center backdrop-blur-xl">
                                <p className="text-xs font-bold text-slate-400">
                                    ℹ️ Oggolaanshaha dalabada waaweyn (&gt;= 10,000 ETB) waxaa toos u maamula Manager Abdehakim Mumin.
                                </p>
                            </div>
                        )}
                    </div>
                ) : activeTab === 'TRANSACTIONS' ? (
                    <div className="flex flex-col gap-4 animate-fade-in pb-20">
                        {/* Summary Cards Row */}
                        <div className="grid grid-cols-3 gap-2">
                            {/* Deposits Card */}
                            <div className="bg-gradient-to-br from-emerald-950/80 via-slate-950 to-slate-950 border border-emerald-400/40 rounded-2xl p-3 flex flex-col justify-between shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                                <div className="w-7 h-7 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
                                    <ArrowDownLeft size={16} />
                                </div>
                                <div className="flex flex-col mt-2">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Deposits</span>
                                    <span className="text-xs font-black text-emerald-400 tracking-tight">
                                        {historyExpenses.filter(e => e.isDeposit || e.type === 'DEPOSIT').reduce((s, e) => s + Number(e.amount), 0).toLocaleString()} ETB
                                    </span>
                                    <span className="text-[8px] text-slate-400 font-bold mt-0.5">
                                        {historyExpenses.filter(e => e.isDeposit || e.type === 'DEPOSIT').length} Transactions
                                    </span>
                                </div>
                            </div>

                            {/* Withdrawals Card */}
                            <div className="bg-gradient-to-br from-blue-950/80 via-slate-950 to-slate-950 border border-blue-400/40 rounded-2xl p-3 flex flex-col justify-between shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                                <div className="w-7 h-7 rounded-xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-400">
                                    <ArrowUpRight size={16} />
                                </div>
                                <div className="flex flex-col mt-2">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Withdrawals</span>
                                    <span className="text-xs font-black text-blue-400 tracking-tight">
                                        {historyExpenses.filter(e => !e.isDeposit && e.type !== 'DEPOSIT').reduce((s, e) => s + Number(e.amount), 0).toLocaleString()} ETB
                                    </span>
                                    <span className="text-[8px] text-slate-400 font-bold mt-0.5">
                                        {historyExpenses.filter(e => !e.isDeposit && e.type !== 'DEPOSIT').length} Transactions
                                    </span>
                                </div>
                            </div>

                            {/* Balance Card */}
                            <div className="bg-gradient-to-br from-cyan-950/80 via-slate-950 to-slate-950 border border-cyan-400/40 rounded-2xl p-3 flex flex-col justify-between shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                                <div className="w-7 h-7 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400">
                                    <Wallet size={16} />
                                </div>
                                <div className="flex flex-col mt-2">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Balance</span>
                                    <span className="text-xs font-black text-white tracking-tight">
                                        {(
                                            historyExpenses.filter(e => e.isDeposit || e.type === 'DEPOSIT').reduce((s, e) => s + Number(e.amount), 0) -
                                            historyExpenses.filter(e => !e.isDeposit && e.type !== 'DEPOSIT').reduce((s, e) => s + Number(e.amount), 0)
                                        ).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB
                                    </span>
                                    <span className="text-[8px] text-emerald-400 font-bold mt-0.5">Updated now</span>
                                </div>
                            </div>
                        </div>

                        {/* Search & Filter Bar */}
                        <div className="flex gap-2">
                            <div className="flex-1 bg-slate-950/70 border border-white/15 rounded-xl px-3 py-2.5 flex items-center gap-2 backdrop-blur-xl">
                                <Search size={14} className="text-slate-400" />
                                <input
                                    type="text"
                                    value={transactionSearchQuery}
                                    onChange={(e) => setTransactionSearchQuery(e.target.value)}
                                    placeholder="Search transactions..."
                                    className="w-full bg-transparent text-xs font-bold text-white outline-none placeholder:text-slate-500"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    const next = transactionTypeFilter === 'ALL' ? 'DEPOSIT' : transactionTypeFilter === 'DEPOSIT' ? 'WITHDRAWAL' : 'ALL';
                                    setTransactionTypeFilter(next);
                                }}
                                className="px-3.5 py-2.5 bg-blue-600/30 hover:bg-blue-600/50 border border-blue-400/50 rounded-xl text-xs font-black text-white flex items-center gap-1.5 backdrop-blur-xl active:scale-95 transition-all shadow-md"
                            >
                                <Filter size={14} className="text-blue-300" />
                                <span>{transactionTypeFilter}</span>
                            </button>
                        </div>

                        {/* Transactions Table Container */}
                        <div className="bg-slate-950/80 border border-white/10 rounded-2xl p-4 flex flex-col gap-2 backdrop-blur-xl">
                            <div className="grid grid-cols-3 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-white/10 pb-2">
                                <span className="text-emerald-400">DEPOSIT (ETB)</span>
                                <span className="text-blue-400">WITHDRAW (ETB)</span>
                                <span className="text-right">BALANCE (ETB)</span>
                            </div>

                            {/* Transaction Rows */}
                            <div className="flex flex-col gap-1 pt-1">
                                {loadingHistory ? (
                                    <div className="flex items-center justify-center p-6 gap-2">
                                        <Loader2 className="animate-spin text-blue-400" size={18} />
                                        <span className="text-xs text-slate-400 font-bold">Loading transactions...</span>
                                    </div>
                                ) : historyExpenses.length === 0 ? (
                                    <div className="p-6 text-center text-xs text-slate-400 font-bold">
                                        No transactions found.
                                    </div>
                                ) : (
                                    historyExpenses
                                        .filter(t => {
                                            const matchesSearch = !transactionSearchQuery || (t.description || t.category || t.note || '').toLowerCase().includes(transactionSearchQuery.toLowerCase());
                                            const isDep = t.isDeposit || t.type === 'DEPOSIT';
                                            if (transactionTypeFilter === 'DEPOSIT') return matchesSearch && isDep;
                                            if (transactionTypeFilter === 'WITHDRAWAL') return matchesSearch && !isDep;
                                            return matchesSearch;
                                        })
                                        .map((exp, idx) => {
                                            const isDep = exp.isDeposit || exp.type === 'DEPOSIT';
                                            return (
                                                <div
                                                    key={exp.id}
                                                    onClick={() => { triggerHaptic('medium'); setSelectedTransactionForDetails(exp); }}
                                                    className="grid grid-cols-3 items-center py-3 px-2 hover:bg-white/5 rounded-xl cursor-pointer transition-all border-b border-white/5 last:border-0"
                                                >
                                                    {/* Deposit Column */}
                                                    {isDep ? (
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-black text-emerald-400">+ {Number(exp.amount).toLocaleString()}</span>
                                                            <span className="text-[8px] text-slate-400 font-bold">{new Date(exp.createdAt).toLocaleDateString('so-SO')}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs font-bold text-slate-600">-</span>
                                                    )}

                                                    {/* Withdraw Column */}
                                                    {!isDep ? (
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-black text-blue-400">{Number(exp.amount).toLocaleString()}</span>
                                                            <span className="text-[8px] text-slate-400 font-bold">{new Date(exp.createdAt).toLocaleDateString('so-SO')}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs font-bold text-slate-600">-</span>
                                                    )}

                                                    {/* Balance Column */}
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <span className="text-xs font-black text-white">
                                                            {Number(exp.runningBalance).toLocaleString(undefined, {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2
                                                            })}
                                                        </span>
                                                        <ArrowRight size={12} className="text-slate-400" />
                                                    </div>
                                                </div>
                                            );
                                        })
                                )}
                            </div>
                        </div>
                    </div>
                ) : activeTab === 'REPORTS' ? (
                    <div className="flex flex-col gap-4 animate-fade-in pb-20">
                        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/40 border border-emerald-500/30 rounded-3xl p-6 backdrop-blur-2xl flex flex-col gap-5 shadow-[0_0_35px_rgba(16,185,129,0.2)]">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
                                        <BarChart3 size={18} />
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-black text-white uppercase tracking-wider">Reports & Financial Audit Hub</h3>
                                        <p className="text-[10px] text-emerald-400 font-bold">Coming Soon (Baqshiinka warbixinada)</p>
                                    </div>
                                </div>
                                <span className="px-3 py-1 bg-emerald-400/20 border border-emerald-400/40 text-emerald-300 text-[9px] font-black uppercase rounded-full animate-pulse">
                                    v2.5 Release
                                </span>
                            </div>

                            {/* Coming Soon Graphic Banner */}
                            <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-cyan-950/80 border border-white/10 rounded-2xl p-6 text-center flex flex-col items-center gap-3">
                                <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-500 to-cyan-400 p-0.5 shadow-[0_0_30px_rgba(16,185,129,0.5)]">
                                    <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center text-emerald-400">
                                        <PieChart size={30} />
                                    </div>
                                </div>
                                <h2 className="text-base font-black text-white">Qaybta Warbixinada (Reports Hub)</h2>
                                <p className="text-xs text-slate-300 font-medium leading-relaxed max-w-xs">
                                    Qaybtaan waxaa lagu soo kordhin doonaa warbixinada rasmiga ah ee warshada, sida PDF Exporting, Daily Financial Audit, Category Analytics, iyo Kharashyada oo dhan ee bishii la soo dhaafay.
                                </p>
                            </div>

                            {/* Roadmap Features List */}
                            <div className="flex flex-col gap-2.5">
                                <span className="text-xs font-black text-slate-300 uppercase tracking-wider">Qorshaha Warbixinada Cusub:</span>
                                {[
                                    { title: '📄 Full Financial PDF Report Export', desc: 'Warbixinta kharashka oo PDF ah oo loo habaysay maamulka', status: 'Coming Soon' },
                                    { title: '📅 Custom Date Range Audit Logs', desc: 'Bixinta taariikh kasta iyo rasiidhada oo dhan', status: 'In Development' },
                                    { title: '📈 Monthly Spend Breakdown & Projections', desc: 'Saadaasha kharashka bisha ee warshada AN-Industory', status: 'Planned' }
                                ].map((item, idx) => (
                                    <div key={idx} className="p-3.5 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between gap-3">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-white">{item.title}</span>
                                            <span className="text-[10px] text-slate-400 font-medium">{item.desc}</span>
                                        </div>
                                        <span className="px-2.5 py-1 bg-white/10 border border-white/10 text-cyan-300 text-[9px] font-bold rounded-lg whitespace-nowrap">
                                            {item.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : activeTab === 'PROFILE' ? (
                    <div className="flex flex-col gap-4 animate-fade-in pb-20">
                        {/* Profile Header Card */}
                        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950/60 border border-blue-400/30 rounded-3xl p-6 flex flex-col items-center text-center gap-3 backdrop-blur-2xl shadow-[0_0_35px_rgba(59,130,246,0.2)]">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-cyan-400 via-blue-500 to-emerald-400 p-1 shadow-[0_0_20px_rgba(34,211,238,0.5)]">
                                <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center text-cyan-300 font-black text-2xl border border-white/20">
                                    {telegramPhotoUrl ? (
                                        <img src={telegramPhotoUrl} alt="Telegram profile" className="w-full h-full rounded-full object-cover" />
                                    ) : requesterName.substring(0, 2).toUpperCase()}
                                </div>
                            </div>

                            <div className="flex flex-col items-center">
                                <div className="flex items-center gap-1.5">
                                    <h2 className="text-base font-black text-white">{requesterName}</h2>
                                    <UserCheck size={16} className="text-emerald-400" />
                                </div>
                                <span className="text-xs text-cyan-400 font-bold">@{requesterUsername || 'user'}</span>
                                <span className="mt-1 px-3 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-black uppercase">
                                    {profileData?.role || (effectiveIsManager ? 'FINANCIAL MANAGER' : 'AUTHORIZED OPERATOR')}
                                </span>
                            </div>
                        </div>

                        {/* Profile Details List */}
                        <div className="bg-slate-950/80 border border-white/10 rounded-3xl p-5 flex flex-col gap-3 backdrop-blur-2xl">
                            <div className="flex justify-between items-center p-3 bg-white/5 rounded-2xl">
                                <span className="text-xs font-bold text-slate-400">Telegram User ID</span>
                                <button type="button" onClick={() => setShowTelegramId(v => !v)} className="flex items-center gap-1.5 text-xs font-mono font-bold text-white">
                                    {showTelegramId ? requesterId : `${requesterId.slice(0, 4)}••••${requesterId.slice(-2)}`}
                                    {showTelegramId ? <EyeOff size={12} /> : <Eye size={12} />}
                                </button>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-white/5 rounded-2xl">
                                <span className="text-xs font-bold text-slate-400">Company</span>
                                <span className="text-xs font-bold text-emerald-400">AN-Industory Factory - Jigjiga</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-white/5 rounded-2xl">
                                <span className="text-xs font-bold text-slate-400">Active Account</span>
                                <span className="text-xs font-bold text-cyan-400">{activeAccount?.name || 'E-Birr Merchant'}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-white/5 rounded-2xl">
                                <span className="text-xs font-bold text-slate-400">Sync Status</span>
                                <span className="text-xs font-bold text-emerald-400">🟢 Online & Synced</span>
                            </div>
                        </div>

                        {/* Activity & approval intelligence */}
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                ['Dalabyada', profileData?.activity?.total || 0, 'text-cyan-400'],
                                ['La bixiyey', profileData?.activity?.paid || 0, 'text-emerald-400'],
                                ['Sugaya', profileData?.activity?.pending || 0, 'text-amber-400'],
                                ['Bishan', `${Number(profileData?.activity?.monthlyTotal || 0).toLocaleString()} ETB`, 'text-blue-400']
                            ].map(([label, value, color]) => (
                                <div key={String(label)} className="p-3.5 rounded-2xl bg-slate-950/80 border border-white/10">
                                    <p className="text-[9px] uppercase font-black text-slate-500">{label}</p>
                                    <p className={`text-sm font-black ${color}`}>{value}</p>
                                </div>
                            ))}
                        </div>

                        <div className="bg-slate-950/80 border border-white/10 rounded-3xl p-5 space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-black text-white flex items-center gap-2"><ShieldCheck size={15} className="text-emerald-400" /> Permissions & Approval</h3>
                                <span className="text-[9px] font-black text-emerald-300 bg-emerald-500/10 px-2 py-1 rounded-lg">DATABASE</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {Object.entries(profileData?.permissions || {}).filter(([key]) => key !== 'approvalLimit').map(([key, enabled]) => (
                                    <span key={key} className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${enabled ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/10 text-rose-300'}`}>{key}: {enabled ? 'ON' : 'OFF'}</span>
                                ))}
                            </div>
                            <p className="text-[11px] text-slate-300">Approval limit: <strong className="text-white">{profileData?.permissions?.approvalLimit == null ? 'Unlimited' : `${Number(profileData.permissions.approvalLimit).toLocaleString()} ETB`}</strong></p>
                        </div>

                        <div className="bg-slate-950/80 border border-white/10 rounded-3xl p-5 space-y-3">
                            <h3 className="text-xs font-black text-white flex items-center gap-2"><SlidersHorizontal size={15} className="text-cyan-400" /> Notification Preferences</h3>
                            {[
                                ['sound', 'Codka dalabka cusub'], ['vibration', 'Gariirka'],
                                ['approvals', 'Approval notifications'], ['receipts', 'Receipt confirmations']
                            ].map(([key, label]) => (
                                <label key={key} className="flex items-center justify-between p-2.5 bg-white/5 rounded-xl text-xs font-bold text-slate-300">
                                    {label}
                                    <input type="checkbox" checked={(profilePreferences as any)[key]} onChange={e => setProfilePreferences(p => ({ ...p, [key]: e.target.checked }))} className="accent-emerald-500 w-4 h-4" />
                                </label>
                            ))}
                            <div className="grid grid-cols-2 gap-2">
                                <select value={profilePreferences.defaultAccount} onChange={e => setProfilePreferences(p => ({ ...p, defaultAccount: e.target.value }))} className="p-2.5 rounded-xl bg-slate-900 border border-white/10 text-[10px] text-white">
                                    <option value="">Default account</option>{accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                </select>
                                <select value={profilePreferences.defaultCategory} onChange={e => setProfilePreferences(p => ({ ...p, defaultCategory: e.target.value }))} className="p-2.5 rounded-xl bg-slate-900 border border-white/10 text-[10px] text-white">
                                    <option value="">Default category</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <select value={profilePreferences.language} onChange={e => setProfilePreferences(p => ({ ...p, language: e.target.value }))} className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-[10px] text-white">
                                <option value="so">Af-Soomaali</option><option value="en">English</option>
                            </select>
                        </div>

                        <div className="bg-slate-950/80 border border-white/10 rounded-3xl p-5 space-y-3">
                            <h3 className="text-xs font-black text-white">Recent Activity</h3>
                            {(profileData?.recent || []).length ? profileData.recent.map((item: any) => (
                                <div key={item.id} className="flex justify-between gap-2 border-b border-white/5 pb-2 text-[10px]">
                                    <span className="text-slate-300 truncate">{item.description}</span>
                                    <span className="text-white font-black whitespace-nowrap">{item.amount.toLocaleString()} ETB</span>
                                </div>
                            )) : <p className="text-[10px] text-slate-500">Wax activity ah lama helin.</p>}
                        </div>

                        <div className="bg-slate-950/80 border border-white/10 rounded-3xl p-5 space-y-3">
                            <h3 className="text-xs font-black text-white flex items-center gap-2"><Lock size={14} className="text-purple-400" /> Security & Devices</h3>
                            <p className="text-[10px] text-slate-400">2FA: <span className={profileData?.twoFAEnabled ? 'text-emerald-400' : 'text-amber-400'}>{profileData?.twoFAEnabled ? 'Enabled' : 'Not enabled'}</span></p>
                            <p className="text-[10px] text-slate-400">Last active: <span className="text-white">{profileData?.lastActiveAt ? new Date(profileData.lastActiveAt).toLocaleString() : 'Current Telegram session'}</span></p>
                            {(profileData?.trustedDevices || []).map((device: any) => <p key={device.id} className="text-[9px] text-slate-400 flex items-center gap-1"><Smartphone size={10} /> {device.userAgent}</p>)}
                            <p className="text-[10px] text-slate-400">Profile completion: <span className="text-emerald-400 font-black">{[requesterName, requesterUsername, requesterId, profileData?.phone, profileData?.email].filter(Boolean).length * 20}%</span></p>
                        </div>

                        <div className="bg-slate-950/80 border border-white/10 rounded-3xl p-5 space-y-3">
                            <h3 className="text-xs font-black text-white">Saved Recipients ({[...savedTransportContacts, ...savedEquipmentContacts, ...savedConsultantContacts].length})</h3>
                            {[...savedTransportContacts, ...savedEquipmentContacts, ...savedConsultantContacts].slice(0, 5).map((contact, index) => (
                                <div key={`${contact.phone}-${index}`} className="flex items-center justify-between gap-2 text-[10px] text-slate-300">
                                    <button type="button" onClick={() => { setRecipientName(contact.name); setPaymentPhone(contact.phone); setActiveTab('NEW'); }} className="flex-1 flex justify-between text-left"><span>{contact.name}</span><span>{contact.phone}</span></button>
                                    <button type="button" onClick={() => removeSavedContact(contact.phone)} aria-label="Delete recipient" className="p-1 text-rose-400"><Trash2 size={11} /></button>
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <button type="button" onClick={exportPersonalPdf} className="py-3 rounded-xl bg-rose-500/15 border border-rose-400/20 text-rose-300 text-[10px] font-black flex items-center justify-center gap-1"><Download size={13} /> PDF</button>
                            <button type="button" onClick={exportPersonalExcel} className="py-3 rounded-xl bg-emerald-500/15 border border-emerald-400/20 text-emerald-300 text-[10px] font-black flex items-center justify-center gap-1"><FileSpreadsheet size={13} /> EXCEL</button>
                        </div>
                        <button type="button" onClick={() => (window as any).Telegram?.WebApp?.close?.()} className="w-full py-3 rounded-xl bg-rose-600/20 border border-rose-400/30 text-rose-300 text-xs font-black flex items-center justify-center gap-2"><LogOut size={14} /> Xidh Session-ka</button>
                    </div>
                ) : (
                    <>
                        {editingTx && (
                            <div className="mb-3 p-3 rounded-2xl bg-blue-500/10 border border-blue-400/30 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2 text-blue-300">
                                    <Pencil size={15} />
                                    <span className="text-xs font-black">Wax ka beddel transaction-ka</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => { setEditingTx(null); setActiveTab('TRANSACTIONS'); }}
                                    className="px-2.5 py-1.5 rounded-lg bg-white/10 text-[10px] font-black text-white"
                                >
                                    Kansal
                                </button>
                            </div>
                        )}
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
                    <form onSubmit={handleSubmit} className="bg-[var(--tg-theme-secondary-bg-color,rgba(255,255,255,0.02))] border border-white/10 shadow-lg rounded-3xl p-5 pb-28 flex flex-col gap-4 animate-fade-in">
                        
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
                                {selectedCategoryName === 'Bills' && (
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-black text-[var(--tg-theme-hint-color,#94a3b8)] uppercase tracking-wider flex items-center gap-1.5">
                                            <FileText size={11} className="text-[var(--tg-theme-button-color,#3b82f6)]" /> Nooca Biilka / Fee-ga
                                        </label>
                                        <select required value={billType} onChange={(e) => setBillType(e.target.value)}
                                            className="w-full p-3 bg-[var(--tg-theme-bg-color,rgba(0,0,0,0.2))] text-[var(--tg-theme-text-color,#ffffff)] border border-white/10 rounded-xl text-sm font-bold outline-none"
                                        >
                                            <option value="" className="bg-slate-950">Dooro nooca biilka...</option>
                                            <option value="WiFi / Internet" className="bg-slate-950">WiFi / Internet</option>
                                            <option value="Electricity" className="bg-slate-950">Koronto (Electricity)</option>
                                            <option value="Cloud / Hosting" className="bg-slate-950">Cloud / Hosting</option>
                                            <option value="Water" className="bg-slate-950">Biyo (Water)</option>
                                            <option value="Telephone / Mobile" className="bg-slate-950">Telephone / Mobile</option>
                                            <option value="Software Subscription" className="bg-slate-950">Software Subscription</option>
                                            <option value="Bank / Transfer Fee" className="bg-slate-950">Bank / Transfer Fee</option>
                                            <option value="Government Fee / Tax" className="bg-slate-950">Government Fee / Tax</option>
                                            <option value="Other Service Fee" className="bg-slate-950">Fee Kale</option>
                                        </select>
                                    </div>
                                )}
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
                        {!editingTx && <div className="flex gap-2 pt-1">
                            <button type="button" onClick={handleAddToBatch}
                                className="flex-1 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5"
                            >
                                <PlusCircle size={14} /> Ku dar Batch-ka
                            </button>
                        </div>}

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
                            ) : editingTx ? (
                                <>
                                    Keydi Isbeddelka
                                    <Pencil size={12} />
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

                {/* Account Transactions Drilldown Modal */}
                {showAccountModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-2xl animate-fade-in">
                        <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950/80 border border-emerald-400/40 rounded-3xl p-6 w-full max-w-md flex flex-col gap-4 shadow-[0_0_50px_rgba(16,185,129,0.3)] max-h-[85vh] overflow-y-auto relative">
                            <div className="flex justify-between items-center border-b border-white/10 pb-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 font-bold">
                                        💳
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-white uppercase">Account Transactions Ledger</h3>
                                        <p className="text-[10px] text-slate-400 font-bold">Deposits, Expenses & Running Balance</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowAccountModal(false)}
                                    className="w-8 h-8 rounded-full bg-white/10 border border-white/20 text-white flex items-center justify-center text-xs font-black active:scale-95 hover:bg-white/20"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Account Switcher Tabs */}
                            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                                {accounts.map(acc => (
                                    <button
                                        key={acc.id}
                                        type="button"
                                        onClick={() => setSelectedAccountForModal(acc)}
                                        className={`px-3 py-2 rounded-xl text-xs font-black transition-all border whitespace-nowrap ${
                                            (selectedAccountForModal?.id || activeAccount?.id || accounts[0]?.id) === acc.id
                                                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-emerald-400 shadow-[0_0_15px_#10b981]'
                                                : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                                        }`}
                                    >
                                        {acc.name} ({Number(acc.balance).toLocaleString()} ETB)
                                    </button>
                                ))}
                            </div>

                            {/* Summary Card */}
                            <div className="p-4 bg-slate-950/60 border border-emerald-500/30 rounded-2xl flex flex-col gap-1 shadow-inner">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Available Balance (Haraa)</span>
                                <span className="text-2xl font-black text-emerald-400">
                                    {Number((selectedAccountForModal || activeAccount)?.balance || 0).toLocaleString()} ETB
                                </span>
                            </div>

                            {/* Transaction Ledger Table / Cards */}
                            <div className="flex flex-col gap-2.5">
                                <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center justify-between">
                                    <span>Transaction History</span>
                                    <span className="text-[10px] text-slate-400 font-bold">{historyExpenses.length} Records</span>
                                </h4>

                                {historyExpenses.length === 0 ? (
                                    <p className="text-xs text-slate-400 font-bold p-4 text-center">Wax lacag bixin ah ama deposit ah oo laga helay koontadan ma jiraan.</p>
                                ) : (
                                    historyExpenses.map(t => (
                                        <div key={t.id} className="p-3.5 bg-white/5 border border-white/10 rounded-2xl flex justify-between items-center hover:bg-white/10 transition-all">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-[10px] font-bold text-slate-400">{new Date(t.createdAt).toLocaleDateString('so-SO')}</span>
                                                <span className="text-xs font-bold text-white">{t.description || t.category}</span>
                                                {t.requesterName && <span className="text-[9px] text-slate-400 font-bold">👤 {t.requesterName}</span>}
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-xs font-black text-rose-400">- {Number(t.amount).toLocaleString()} ETB</span>
                                                <span className="text-[9px] font-black uppercase text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 mt-1">Paid</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Transaction Details Modal (Matching Image 1 Right Phone) */}
                {selectedTransactionForDetails && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-2xl animate-fade-in">
                        <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950/80 border border-blue-400/40 rounded-3xl p-5 w-full max-w-md flex flex-col gap-4 shadow-[0_0_50px_rgba(59,130,246,0.3)] max-h-[90vh] overflow-y-auto relative">
                            <div className="flex justify-between items-center border-b border-white/10 pb-3">
                                <button
                                    type="button"
                                    onClick={() => setSelectedTransactionForDetails(null)}
                                    className="w-8 h-8 rounded-full bg-white/10 border border-white/20 text-white flex items-center justify-center active:scale-95"
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                <div className="flex flex-col items-center">
                                    <h3 className="text-xs font-black text-white uppercase tracking-wider">Transaction Details</h3>
                                    <span className="text-[10px] text-slate-400 font-bold">Expense Transaction</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        triggerHaptic('light');
                                        if (typeof navigator !== 'undefined' && navigator.share) {
                                            navigator.share({ title: 'Transaction Details', text: `Transaction ${selectedTransactionForDetails.id}` });
                                        }
                                    }}
                                    className="w-8 h-8 rounded-full bg-white/10 border border-white/20 text-white flex items-center justify-center active:scale-95"
                                >
                                    <Share2 size={16} />
                                </button>
                            </div>

                            {/* Status Header Badge Card */}
                            <div className="p-4 bg-gradient-to-r from-emerald-950/60 via-slate-950 to-slate-950 border border-emerald-400/50 rounded-2xl flex items-center gap-3 shadow-lg">
                                <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-400/60 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_#10b981]">
                                    <CheckCircle2 size={24} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Withdrawal / Payment Successful</span>
                                    <div className="flex items-baseline gap-1.5">
                                        <span className="text-2xl font-black text-emerald-400 tracking-tight">
                                            {Number(selectedTransactionForDetails.amount).toLocaleString()} ETB
                                        </span>
                                    </div>
                                    <span className="text-[9px] text-slate-400 font-bold">
                                        {new Date(selectedTransactionForDetails.createdAt).toLocaleString('so-SO')}
                                    </span>
                                </div>
                            </div>

                            {/* Details Key-Value List */}
                            <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-4 flex flex-col gap-2.5 backdrop-blur-xl">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-400 font-bold">Transaction ID</span>
                                    <span className="font-mono font-bold text-white text-[11px]">{selectedTransactionForDetails.id.substring(0, 18)}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs border-t border-white/5 pt-2">
                                    <span className="text-slate-400 font-bold">Type</span>
                                    <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-black text-[10px] uppercase border border-blue-500/30">
                                        Withdrawal
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-xs border-t border-white/5 pt-2">
                                    <span className="text-slate-400 font-bold">Amount</span>
                                    <span className="font-black text-white">{Number(selectedTransactionForDetails.amount).toLocaleString()} ETB</span>
                                </div>
                                <div className="flex justify-between items-center text-xs border-t border-white/5 pt-2">
                                    <span className="text-slate-400 font-bold">Payment Method</span>
                                    <span className="font-bold text-emerald-400">E-Birr Merchant</span>
                                </div>
                                <div className="flex justify-between items-center text-xs border-t border-white/5 pt-2">
                                    <span className="text-slate-400 font-bold">Category</span>
                                    <span className="font-bold text-white">{selectedTransactionForDetails.category}</span>
                                </div>
                                {selectedTransactionForDetails.description && (
                                    <div className="flex justify-between items-center text-xs border-t border-white/5 pt-2">
                                        <span className="text-slate-400 font-bold">Reference / Note</span>
                                        <span className="font-bold text-slate-200">{selectedTransactionForDetails.description}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center text-xs border-t border-white/5 pt-2">
                                    <span className="text-slate-400 font-bold">Status</span>
                                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-black text-[10px] uppercase border border-emerald-500/30">
                                        Completed
                                    </span>
                                </div>
                            </div>

                            {/* Receipt Attachment Card */}
                            {selectedTransactionForDetails.receiptUrl && (
                                <div className="bg-slate-950/80 border border-blue-500/30 rounded-2xl p-3 flex flex-col gap-2 backdrop-blur-xl">
                                    <span className="text-[10px] font-black text-white uppercase tracking-wider">Receipt</span>
                                    <div className="flex gap-2.5 items-center">
                                        <img
                                            src={selectedTransactionForDetails.receiptUrl}
                                            alt="Receipt"
                                            className="w-14 h-14 object-cover rounded-lg border border-white/20 shadow-md"
                                        />
                                        <div className="flex flex-col flex-1 gap-1">
                                            <span className="text-[10px] font-black text-slate-400 uppercase">Receipt URL</span>
                                            <a
                                                href={selectedTransactionForDetails.receiptUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-xs text-cyan-400 font-bold underline line-clamp-1 flex items-center gap-1"
                                            >
                                                {selectedTransactionForDetails.receiptUrl} <ExternalLink size={10} />
                                            </a>
                                            <a
                                                href={selectedTransactionForDetails.receiptUrl}
                                                download
                                                className="mt-1 px-2.5 py-1 bg-blue-600/30 hover:bg-blue-600/50 border border-blue-400/40 text-white rounded-lg text-[9px] font-black uppercase inline-flex w-fit items-center justify-center gap-1 transition-all"
                                            >
                                                <Download size={11} /> Rasiidka
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons: Edit & Delete */}
                            <div className="flex justify-center gap-3 mt-1">
                                <button
                                    type="button"
                                    title="Wax ka beddel"
                                    aria-label="Wax ka beddel transaction-ka"
                                    onClick={() => {
                                        triggerHaptic('medium');
                                        openTransactionInMainForm(selectedTransactionForDetails);
                                    }}
                                    className="w-10 h-10 bg-blue-600/30 hover:bg-blue-600/50 border border-blue-400/40 text-blue-300 rounded-xl flex items-center justify-center active:scale-95 transition-all shadow-md"
                                >
                                    <Pencil size={17} />
                                </button>
                                <button
                                    type="button"
                                    title="Tirtir"
                                    aria-label="Tirtir transaction-ka"
                                    onClick={async () => {
                                        triggerHaptic('warning');
                                        if (confirm('Ma hubtaa inaad tirtirto diiwaankan & fariinta Telegram-ka ku taallay?')) {
                                            setSubmitting(true);
                                            try {
                                                const res = await fetch(`/api/telegram/expense-actions?id=${selectedTransactionForDetails.id}`, {
                                                    method: 'DELETE'
                                                });
                                                const data = await res.json();
                                                if (res.ok) {
                                                     triggerHaptic('success');
                                                     setAlertModal({
                                                         isOpen: true,
                                                         title: 'Guul (Deleted)',
                                                         message: 'Diiwaankii & Fariintii Telegram-ka toos ayaa loo tirtiray!',
                                                         type: 'success'
                                                     });
                                                     setSelectedTransactionForDetails(null);
                                                     fetchHistory();
                                                 } else {
                                                     setAlertModal({
                                                         isOpen: true,
                                                         title: 'Cillad',
                                                         message: data.error || 'Waa la tirtiri waayay diiwaanka.',
                                                         type: 'error'
                                                     });
                                                 }
                                             } catch (e) {
                                                 setAlertModal({ isOpen: true, title: 'Cillad Server', message: 'Tirtiriddu waxay kala kulantay cillad server-ka.', type: 'error' });
                                             } finally {
                                                 setSubmitting(false);
                                             }
                                         }
                                     }}
                                     className="w-10 h-10 bg-rose-600/30 hover:bg-rose-600/50 border border-rose-400/40 text-rose-300 rounded-xl flex items-center justify-center active:scale-95 transition-all shadow-md"
                                 >
                                     <Trash2 size={17} />
                                 </button>
                            </div>

                            {/* Back Button */}
                            <button
                                type="button"
                                onClick={() => setSelectedTransactionForDetails(null)}
                                aria-label="Ku noqo transactions"
                                title="Ku noqo transactions"
                                className="self-center w-10 h-10 bg-white/10 hover:bg-white/20 border border-white/15 text-white rounded-xl flex items-center justify-center active:scale-95 transition-all mt-1"
                            >
                                <ChevronLeft size={18} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Edit Transaction Modal */}
                {showEditTxModal && editingTx && (
                    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-xl z-50 flex items-center justify-center p-4 animate-fade-in">
                        <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-blue-950/90 border border-blue-500/30 rounded-3xl p-6 w-full max-w-sm flex flex-col gap-4 shadow-2xl relative animate-in zoom-in-95 duration-200">
                            <div className="flex justify-between items-center pb-3 border-b border-white/10">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-400">
                                        <Pencil size={16} />
                                    </div>
                                    <h3 className="text-sm font-black text-white">Wax Ka Baddal Diiwaanka</h3>
                                </div>
                                <button type="button" onClick={() => setShowEditTxModal(false)} className="text-slate-400 hover:text-white">✕</button>
                            </div>

                            <div className="flex flex-col gap-3">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-black text-slate-400 uppercase">Lacagta (Amount ETB)</label>
                                    <input
                                        type="number"
                                        value={editAmount}
                                        onChange={(e) => setEditAmount(e.target.value)}
                                        className="p-3 bg-black/40 border border-white/10 rounded-xl text-emerald-400 font-extrabold text-base outline-none focus:border-blue-400"
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-black text-slate-400 uppercase">Sharaxaad / Reference</label>
                                    <textarea
                                        rows={3}
                                        value={editNote}
                                        onChange={(e) => setEditNote(e.target.value)}
                                        className="p-3 bg-black/40 border border-white/10 rounded-xl text-white font-bold text-xs outline-none focus:border-blue-400 resize-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={async () => {
                                        triggerHaptic('medium');
                                        setSubmitting(true);
                                        try {
                                            const res = await fetch('/api/telegram/expense-actions', {
                                                method: 'PUT',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                    id: editingTx.expenseId || editingTx.id,
                                                    amount: editAmount,
                                                    note: editNote
                                                })
                                            });
                                            const data = await res.json();
                                            if (res.ok) {
                                                triggerHaptic('success');
                                                setAlertModal({ isOpen: true, title: 'Guul (Updated)', message: 'Diiwaankii & Fariintii Telegram-ka waa la baddalay!', type: 'success' });
                                                setShowEditTxModal(false);
                                                setSelectedTransactionForDetails(null);
                                                fetchHistory();
                                            } else {
                                                setAlertModal({ isOpen: true, title: 'Cillad', message: data.error || 'Waa la baddali waayay.', type: 'error' });
                                            }
                                        } catch (e) {
                                            setAlertModal({ isOpen: true, title: 'Cillad Server', message: 'Waa la baddali waayay.', type: 'error' });
                                        } finally {
                                            setSubmitting(false);
                                        }
                                    }}
                                    disabled={submitting}
                                    className="py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-wider active:scale-95 transition-all shadow-lg flex items-center justify-center gap-1"
                                >
                                    {submitting ? <Loader2 className="animate-spin" size={14} /> : 'Keydi (Save)'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowEditTxModal(false)}
                                    className="py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-black text-xs uppercase tracking-wider active:scale-95 transition-all"
                                >
                                    Kansal (Cancel)
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Notification Modal / Slide-over */}
            {showNotificationModal && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-blue-950/90 border border-blue-500/30 rounded-3xl p-6 w-full max-w-sm flex flex-col gap-4 shadow-2xl relative animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center pb-3 border-b border-white/10">
                            <div className="flex items-center gap-2">
                                <div className="w-9 h-9 rounded-2xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                                    <Bell size={18} />
                                </div>
                                <h3 className="text-sm font-black text-white">Ogeysiisyada Live-ka ah</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => { triggerHaptic('light'); setShowNotificationModal(false); }}
                                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-slate-300 hover:text-white"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="flex flex-col gap-3 max-h-72 overflow-y-auto pr-1">
                            {/* Pending Approvals Summary */}
                            <div className="p-3.5 bg-white/5 border border-white/10 rounded-2xl flex flex-col gap-1.5">
                                <div className="flex justify-between items-center text-xs font-bold">
                                    <span className="text-amber-400">⏳ Codsiyada Sugaya Approval</span>
                                    <span className="text-white bg-amber-500/20 px-2 py-0.5 rounded-full text-[10px]">
                                        {historyExpenses.filter(e => !e.approved && Number(e.amount) >= 5000).length} Item(s)
                                    </span>
                                </div>
                                {historyExpenses.filter(e => !e.approved && Number(e.amount) >= 5000).length > 0 ? (
                                    historyExpenses.filter(e => !e.approved && Number(e.amount) >= 5000).map(e => (
                                        <p key={e.id} className="text-[11px] text-slate-300 font-bold">
                                            • {e.description || e.category}: <span className="text-amber-300">{Number(e.amount).toLocaleString()} ETB</span>
                                        </p>
                                    ))
                                ) : (
                                    <p className="text-[11px] text-slate-400 font-bold">✅ Dhammaan dalabyadu waa kuwa la ogolaaday.</p>
                                )}
                            </div>

                            {/* Account Status */}
                            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex justify-between items-center text-xs font-bold">
                                <div className="flex items-center gap-2 text-emerald-300">
                                    <CheckCircle2 size={16} />
                                    <span>E-Birr Merchant Account</span>
                                </div>
                                <span className="text-white font-black">
                                    {Number(activeAccount?.balance || 0).toLocaleString()} ETB
                                </span>
                            </div>

                            {/* Live Activity Feed */}
                            <div className="p-3.5 bg-white/5 border border-white/10 rounded-2xl flex flex-col gap-2">
                                <span className="text-xs font-bold text-slate-300">⚡ Dhacdooyinkii Ugu Dambeeyay</span>
                                {historyExpenses.slice(0, 3).map(exp => (
                                    <div key={exp.id} className="flex justify-between items-center text-[11px] font-bold border-b border-white/5 pb-1 last:border-0">
                                        <span className="text-slate-300 truncate max-w-[170px]">{exp.description || exp.category}</span>
                                        <span className={exp.isDeposit ? 'text-emerald-400' : 'text-slate-200'}>
                                            {exp.isDeposit ? '+' : ''}{Number(exp.amount).toLocaleString()} ETB
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                type="button"
                                onClick={() => { triggerHaptic('light'); setShowNotificationModal(false); }}
                                className="w-full py-3 px-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-black text-xs uppercase tracking-wider active:scale-95 transition-all"
                            >
                                Xidh (Close)
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

                {/* iOS 26 Glass Floating Bottom Dock Navigation */}
                <div className="fixed bottom-4 left-4 right-4 z-40 max-w-md mx-auto bg-slate-950/85 backdrop-blur-2xl border border-white/20 shadow-[0_0_40px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.3)] rounded-full px-2 py-1.5 grid grid-cols-5 items-center">
                    {/* 1. Dashboard */}
                    <button
                        type="button"
                        onClick={() => { triggerHaptic('light'); setActiveTab('DASHBOARD'); }}
                        className={`flex flex-col items-center justify-center text-center gap-0.5 py-1.5 rounded-full transition-all w-full ${
                            activeTab === 'DASHBOARD'
                                ? 'text-cyan-400 font-extrabold'
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        <Home size={18} className={activeTab === 'DASHBOARD' ? 'text-cyan-400 drop-shadow-[0_0_8px_#22d3ee]' : ''} />
                        <span className="text-[9px]">Dashboard</span>
                    </button>

                    {/* 2. Transactions */}
                    <button
                        type="button"
                        onClick={() => { triggerHaptic('light'); setActiveTab('TRANSACTIONS'); fetchHistory(); }}
                        className={`flex flex-col items-center justify-center text-center gap-0.5 py-1.5 rounded-full transition-all w-full ${
                            activeTab === 'TRANSACTIONS'
                                ? 'text-cyan-400 font-extrabold'
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        <Layers size={18} className={activeTab === 'TRANSACTIONS' ? 'text-cyan-400 drop-shadow-[0_0_8px_#22d3ee]' : ''} />
                        <span className="text-[9px]">Transactions</span>
                    </button>

                    {/* 3. Center Floating (+) 3D Emerald Watery Button */}
                    <button
                        type="button"
                        onClick={() => { triggerHaptic('medium'); setActiveTab('NEW'); }}
                        className="w-12 h-12 mx-auto rounded-full bg-gradient-to-tr from-emerald-600 via-emerald-400 to-teal-300 text-slate-950 flex items-center justify-center shadow-[0_0_25px_rgba(16,185,129,0.8),inset_0_2px_4px_rgba(255,255,255,0.9)] border-2 border-emerald-200 active:scale-95 transition-all -translate-y-3 relative overflow-hidden group"
                        title="Diiwaangeli Kharash/Mushahar"
                    >
                        <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-black/20 rounded-full pointer-events-none" />
                        <PlusCircle size={26} className="text-slate-950 stroke-[2.5] z-10 drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)]" />
                    </button>

                    {/* 4. Reports */}
                    <button
                        type="button"
                        onClick={() => { triggerHaptic('light'); setActiveTab('REPORTS'); fetchHistory(); }}
                        className={`flex flex-col items-center justify-center text-center gap-0.5 py-1.5 rounded-full transition-all w-full ${
                            activeTab === 'REPORTS'
                                ? 'text-cyan-400 font-extrabold'
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        <BarChart3 size={18} className={activeTab === 'REPORTS' ? 'text-cyan-400 drop-shadow-[0_0_8px_#22d3ee]' : ''} />
                        <span className="text-[9px]">Reports</span>
                    </button>

                    {/* 5. Profile */}
                    <button
                        type="button"
                        onClick={() => { triggerHaptic('light'); setActiveTab('PROFILE'); }}
                        className={`flex flex-col items-center justify-center text-center gap-0.5 py-1.5 rounded-full transition-all w-full ${
                            activeTab === 'PROFILE'
                                ? 'text-cyan-400 font-extrabold'
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        <User size={18} className={activeTab === 'PROFILE' ? 'text-cyan-400 drop-shadow-[0_0_8px_#22d3ee]' : ''} />
                        <span className="text-[9px]">Profile</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
