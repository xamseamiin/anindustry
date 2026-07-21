'use client';

import React, { useState, useEffect } from 'react';
import Script from 'next/script';
import { 
    Loader2, CheckCircle2, DollarSign, Wallet, 
    FileText, User, Tag, Truck, Settings, ShoppingBag, 
    Award, ArrowRight, Layers, Factory, Package,
    Hash, Banknote, Calendar, ClipboardList, Wrench, Phone,
    Mic, MicOff, PlusCircle, Trash2
} from 'lucide-react';

// Safe localStorage helpers for iOS WebView where localStorage can throw SecurityError
const safeGetItem = (key: string): string | null => {
    try { return localStorage.getItem(key); } catch { return null; }
};
const safeSetItem = (key: string, value: string): void => {
    try { localStorage.setItem(key, value); } catch { /* silently fail */ }
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

    const [batchItems, setBatchItems] = useState<BatchItem[]>([]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = safeGetItem('telegram_mini_app_batch_items');
            if (saved) {
                try {
                    setBatchItems(JSON.parse(saved));
                } catch(e) {}
            }
        }
    }, []);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            safeSetItem('telegram_mini_app_batch_items', JSON.stringify(batchItems));
        }
    }, [batchItems]);

    const totalBatchAmount = batchItems.reduce((sum, item) => sum + item.amount, 0);

    const handleAddToBatch = () => {
        triggerHaptic('light');

        if (!selectedCategoryKey) {
            triggerHaptic('error');
            alert('Fadlan dooro nooca codsiga (Category).');
            return;
        }

        const isSalaryKey = selectedCategoryKey === 'SALARY';
        const isRawMaterialKey = selectedCategoryKey === 'RAW_MATERIAL';

        if (isSalaryKey && !selectedEmployeeId) {
            triggerHaptic('error');
            alert('Fadlan dooro shaqaalaha.');
            return;
        }

        if (paymentPhone && !validatePhoneNumber(paymentPhone)) {
            triggerHaptic('error');
            alert('Fadlan geli lambar telefoon oo sax ah.');
            return;
        }

        let itemAmount = 0;
        if (isRawMaterialKey) {
            itemAmount = calculatedTotal;
            if (itemAmount <= 0) {
                triggerHaptic('error');
                alert('Fadlan geli tirada iyo qiimaha alaabta.');
                return;
            }
        } else {
            itemAmount = parseFloat(amount) || 0;
            if (itemAmount <= 0) {
                triggerHaptic('error');
                alert('Fadlan geli lacagta (Amount).');
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
                // Load saved contacts from localStorage
                setSavedTransportContacts(JSON.parse(safeGetItem('saved_transport_contacts') || '[]'));
                setSavedEquipmentContacts(JSON.parse(safeGetItem('saved_equipment_contacts') || '[]'));
                setSavedConsultantContacts(JSON.parse(safeGetItem('saved_consultant_contacts') || '[]'));
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

    // Auto-fill payment phone when employee is selected
    useEffect(() => {
        if (selectedEmployeeId && selectedCategoryKey === 'SALARY') {
            const emp = employees.find(e => e.id === selectedEmployeeId);
            if (emp?.phone) {
                setPaymentPhone(emp.phone);
            }
        }
    }, [selectedEmployeeId, employees, selectedCategoryKey]);

    // Parse the main dropdown value to set the respective state variables
    const handleCategoryChange = (val: string) => {
        triggerHaptic('selection');
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
        setPaymentPhone('');
        setRecipientName('');
        setShowSavedContacts(false);

        if (val.startsWith('EXPENSE_')) {
            const [_, id, name] = val.split('_');
            setSelectedCategoryId(id);
            setSelectedCategoryName(name);
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
            const contacts = JSON.parse(safeGetItem(storageKey) || '[]');
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
        if (batchItems.length > 0) {
            let processed = 0;
            let failed = 0;

            for (const item of batchItems) {
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
                    const queue = JSON.parse(safeGetItem('offline_submissions') || '[]');
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
            const queue = JSON.parse(safeGetItem('offline_submissions') || '[]');
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
                alert(data.error || 'Dalabku wuu fashilmay.');
            }
        } catch (err) {
            triggerHaptic('error');
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
                                    <div className="flex flex-col gap-1.5">
                                        <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl flex justify-between items-center text-xs">
                                            <span className="font-bold text-[var(--tg-theme-hint-color,#94a3b8)]">Total Cost:</span>
                                            <span className="font-black text-[var(--tg-theme-button-color,#3b82f6)]">{calculatedTotal.toLocaleString()} ETB</span>
                                        </div>
                                        {isOverLimit && activeAccount && (
                                            <p className="text-[10px] text-red-400 font-bold">⚠️ Digniin: Total-ku wuxuu ka badan yahay haraaga koontada (Haraa: {activeAccount.balance.toLocaleString()} ETB)</p>
                                        )}
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
                                    className={`w-full p-3 bg-[var(--tg-theme-bg-color,rgba(0,0,0,0.2))] text-[var(--tg-theme-text-color,#ffffff)] border rounded-lg text-sm font-black focus:border-[var(--tg-theme-button-color,#3b82f6)] outline-none ${isOverLimit ? 'border-red-500/50' : 'border-white/10'}`}
                                />
                                {isOverLimit && activeAccount && (
                                    <p className="text-[10px] text-red-400 font-bold mt-1">⚠️ Digniin: Lacagtu waxay ka badan tahay haraaga koontada (Haraa: {activeAccount.balance.toLocaleString()} ETB)</p>
                                )}
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

                        {/* Recipient Name - shown for non-salary types */}
                        {!isSalary && (
                            <div className="flex flex-col gap-1.5 animate-fade-in">
                                <label className="text-xs font-black text-[var(--tg-theme-hint-color,#94a3b8)] uppercase tracking-wider flex items-center gap-1.5">
                                    <User size={11} className="text-[var(--tg-theme-button-color,#3b82f6)]" /> Qofka Loo Dirayo (Recipient)
                                </label>
                                {/* Show saved contacts dropdown based on Category */}
                                {isExpense && (
                                    (() => {
                                        let contactsList: {name: string; phone: string}[] = [];
                                        if (selectedCategoryName === 'Transport & Fuel' && transportType === 'Kirada Gaariga (Car Rental)') {
                                            contactsList = savedTransportContacts;
                                        } else if (selectedCategoryName === 'Equipment Rental') {
                                            contactsList = savedEquipmentContacts;
                                        } else if (selectedCategoryName === 'Consultancy & Service') {
                                            contactsList = savedConsultantContacts;
                                        }

                                        if (contactsList.length === 0) return null;

                                        return (
                                            <div className="flex flex-col gap-1.5 mb-1">
                                                <button type="button" onClick={() => setShowSavedContacts(!showSavedContacts)}
                                                    className="text-xs font-bold text-[var(--tg-theme-button-color,#3b82f6)] text-left hover:opacity-80"
                                                >
                                                    {showSavedContacts ? '✕ Xir' : `📋 Dadkii hore (${contactsList.length})`}
                                                </button>
                                                {showSavedContacts && (
                                                    <div className="flex flex-col gap-1 bg-white/[0.02] border border-white/5 rounded-lg p-2 max-h-32 overflow-y-auto">
                                                        {contactsList.map((c, i) => (
                                                            <button key={i} type="button"
                                                                onClick={() => {
                                                                    triggerHaptic('light');
                                                                    setRecipientName(c.name);
                                                                    setPaymentPhone(c.phone);
                                                                    setShowSavedContacts(false);
                                                                }}
                                                                className="text-left p-2 rounded-lg hover:bg-white/5 text-xs font-bold flex justify-between items-center transition-all"
                                                            >
                                                                <span>{c.name}</span>
                                                                <span className="text-[var(--tg-theme-hint-color,#94a3b8)]">{c.phone}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()
                                )}
                                <input type="text" placeholder="Magaca qofka lacagta loo dirayo..." value={recipientName} onChange={(e) => setRecipientName(e.target.value)}
                                    className="w-full p-3 bg-[var(--tg-theme-bg-color,rgba(0,0,0,0.2))] text-[var(--tg-theme-text-color,#ffffff)] border border-white/10 rounded-lg text-sm font-bold focus:border-[var(--tg-theme-button-color,#3b82f6)] outline-none"
                                />
                            </div>
                        )}

                        {/* Payment Phone Number */}
                        <div className="flex flex-col gap-1.5 animate-fade-in">
                            <label className="text-xs font-black text-[var(--tg-theme-hint-color,#94a3b8)] uppercase tracking-wider flex items-center gap-1.5">
                                <Phone size={11} className="text-[var(--tg-theme-button-color,#3b82f6)]" /> Lambarka Lacag-bixinta
                            </label>
                            <input type="tel" placeholder="09xxxxxxxx" value={paymentPhone} onChange={(e) => setPaymentPhone(e.target.value)}
                                className="w-full p-3 bg-[var(--tg-theme-bg-color,rgba(0,0,0,0.2))] text-[var(--tg-theme-text-color,#ffffff)] border border-white/10 rounded-lg text-sm font-bold focus:border-[var(--tg-theme-button-color,#3b82f6)] outline-none"
                            />
                            {isSalary && selectedEmployee?.phone && (
                                <p className="text-[10px] text-emerald-400 font-bold">✓ Lambarka shaqaalaha: {selectedEmployee.phone}</p>
                            )}
                        </div>

                        {/* Description/Note */}
                        <div className="flex flex-col gap-1.5">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-black text-[var(--tg-theme-hint-color,#94a3b8)] uppercase tracking-wider flex items-center gap-1.5">
                                    <FileText size={11} className="text-[var(--tg-theme-button-color,#3b82f6)]" /> Faahfaahin / Note (Sharaxaad)
                                </label>
                                {recognitionObj && (
                                    <button type="button" onClick={toggleListening}
                                        className={`flex items-center gap-1 text-[10px] font-black uppercase px-2 py-1 rounded-full border transition-all ${isListening ? 'bg-red-500/20 text-red-400 border-red-500/30 animate-pulse' : 'bg-white/5 text-[var(--tg-theme-hint-color,#94a3b8)] border-white/10'}`}
                                    >
                                        {isListening ? (
                                            <>
                                                <MicOff size={10} />
                                                <span>Dhegeysanaya...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Mic size={10} />
                                                <span>Ku hadal (Somali)</span>
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                            <textarea rows={2} placeholder={isListening ? 'Dhegeysanaya codkaaga, fadlan hadal...' : isSalary ? 'Sharaxaadda mushaharka...' : isRawMaterial ? 'Sharaxaadda alaabta...' : 'Sharaxaadda kharashka...'}
                                value={note} onChange={(e) => setNote(e.target.value)}
                                className="w-full p-2.5 bg-[var(--tg-theme-bg-color,rgba(0,0,0,0.2))] text-[var(--tg-theme-text-color,#ffffff)] border border-white/10 rounded-lg text-sm font-bold outline-none resize-none"
                            />
                        </div>

                        {/* Add to Batch Button */}
                        <button type="button" onClick={handleAddToBatch}
                            className="w-full py-3 bg-white/5 hover:bg-white/10 border border-emerald-500/30 text-emerald-400 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 active:scale-[0.98] mt-1"
                        >
                            <PlusCircle size={14} className="text-emerald-400" />
                            <span>➕ Ku Dar Dalab Kale (Add to Batch List)</span>
                        </button>

                        {/* Batch Preview Card */}
                        {batchItems.length > 0 && (
                            <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-2xl flex flex-col gap-3 animate-fade-in mt-1">
                                <div className="flex justify-between items-center pb-2 border-b border-white/10">
                                    <div className="flex items-center gap-2">
                                        <Layers size={14} className="text-blue-400" />
                                        <span className="text-xs font-black uppercase tracking-wider text-blue-400">
                                            Dalabaadka la Ururiyay ({batchItems.length})
                                        </span>
                                    </div>
                                    <button type="button" onClick={handleClearBatch} className="text-[10px] text-red-400 font-bold hover:underline">
                                        Nadiifi All (Clear)
                                    </button>
                                </div>

                                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                                    {batchItems.map((item, idx) => (
                                        <div key={item.id} className="p-2.5 bg-black/20 border border-white/5 rounded-xl flex justify-between items-center text-xs">
                                            <div className="flex flex-col text-left">
                                                <span className="font-bold text-white text-xs">{idx + 1}. {item.categoryName}</span>
                                                <span className="text-[10px] text-[var(--tg-theme-hint-color,#94a3b8)]">
                                                    {item.recipientName ? `👤 ${item.recipientName} ` : ''}
                                                    {item.employeeName ? `👤 ${item.employeeName} ` : ''}
                                                    {item.note ? `• ${item.note}` : ''}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <span className="font-black text-emerald-400 text-xs">{item.amount.toLocaleString()} ETB</span>
                                                <button type="button" onClick={() => handleRemoveFromBatch(item.id)}
                                                    className="p-1 hover:bg-red-500/20 text-red-400 rounded-lg transition-all"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex justify-between items-center pt-2 border-t border-white/10 text-xs">
                                    <span className="font-bold text-[var(--tg-theme-hint-color,#94a3b8)]">Total-ka Wada Jirka ah:</span>
                                    <span className="font-black text-emerald-400 text-sm">{totalBatchAmount.toLocaleString()} ETB</span>
                                </div>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button type="submit" disabled={submitting || !selectedAccountId}
                            className="w-full py-3.5 bg-[var(--tg-theme-button-color,#2563eb)] text-[var(--tg-theme-button-text-color,#ffffff)] rounded-xl font-black text-sm uppercase tracking-widest hover:opacity-90 active:scale-[0.99] disabled:opacity-40 transition-all flex items-center justify-center gap-2 mt-2"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="animate-spin" size={14} />
                                    Diiwaangelinta waa socotaa...
                                </>
                            ) : batchItems.length > 0 ? (
                                <>
                                    🚀 Wada Dir Dhammaan ({batchItems.length} Dalab - {totalBatchAmount.toLocaleString()} ETB)
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
