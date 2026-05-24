'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
    ArrowLeft, 
    Settings as SettingsIcon, 
    Building, 
    Bell, 
    Shield, 
    Paintbrush, 
    Users, 
    Plus, 
    Trash2, 
    Edit, 
    Coins, 
    Calendar, 
    Mail, 
    User, 
    Loader2, 
    Percent, 
    Check, 
    Info,
    X
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const localTranslations = {
    so: {
        title: "Dejinta",
        subtitle: "Maamul shirkadaada iyo doorashooyinka nidaamka.",
        companyProfile: "Faahfaahinta Shirkadda",
        shareholders: "Saamilayda",
        notifications: "Ogeysiisyada",
        security: "Amniga",
        appearance: "Muuqaalka",
        saveChanges: "Kaydi Isbeddellada",
        // Shareholders tab
        shTitle: "Maamulka Saamilayda",
        shSubtitle: "Ku dar, wax ka beddel, tirtir oo maamul saamilayda shirkadda iyo saamiga ay ku leeyihiin.",
        addShareholder: "Ku Dar Saamilay",
        totalShareholders: "Wadarta Saamilayda",
        allocatedShares: "Saamiyada La Bixiyey",
        availableShares: "Saamiyada Dhiman",
        profitSplit: "Qaybsiga Faa'iidada (ETB)",
        name: "Magaca Dhammaystiran",
        email: "Iimaylka",
        percentage: "Saamiga (%)",
        profitAmount: "Faa'iido Qaybsiga",
        joinedDate: "Taariikhda Bixinta",
        actions: "Ficillada",
        loading: "Soo gelinaya saamilayda...",
        noShareholders: "Ma jiraan saamilay la helay.",
        addModalTitle: "Diiwaangeli Saamilay Cusub",
        editModalTitle: "Wax ka beddel Saamilay",
        cancel: "Ka noqo",
        submitAdd: "Diiwaangeli",
        submitEdit: "Kaydi Isbeddelka",
        deleteConfirmTitle: "Ma xaqiijinaysaa tirtiridda?",
        deleteConfirmText: "Ma hubtaa inaad tirtirto saamilaygan? Ficilkan dib looma soo celin karo.",
        delete: "Tirtir",
        successAdd: "Saamilayda si guul leh ayaa loo diiwaangeliyey!",
        successEdit: "Saamilayda si guul leh ayaa loo cusboonaysiiyey!",
        successDelete: "Saamilayda si guul leh ayaa loo tirtiray!",
        validationError: "Fadlan buuxi dhammaan meelaha muhiimka ah.",
        shareError: "Saamigu ma dhaafi karo saamiyada hadda dhiman."
    },
    en: {
        title: "Settings",
        subtitle: "Manage your company and application preferences.",
        companyProfile: "Company Profile",
        shareholders: "Shareholders",
        notifications: "Notifications",
        security: "Security",
        appearance: "Appearance",
        saveChanges: "Save Changes",
        // Shareholders tab
        shTitle: "Shareholders Management",
        shSubtitle: "Add, edit, delete, and view company shareholders and their share percentages.",
        addShareholder: "Add Shareholder",
        totalShareholders: "Total Shareholders",
        allocatedShares: "Allocated Shares",
        availableShares: "Available Shares",
        profitSplit: "Profit Split Payout (ETB)",
        name: "Full Name",
        email: "Email Address",
        percentage: "Share Percentage (%)",
        profitAmount: "Profit Split Amount",
        joinedDate: "Joined Date",
        actions: "Actions",
        loading: "Loading shareholders...",
        noShareholders: "No shareholders found.",
        addModalTitle: "Register New Shareholder",
        editModalTitle: "Edit Shareholder Details",
        cancel: "Cancel",
        submitAdd: "Register",
        submitEdit: "Save Changes",
        deleteConfirmTitle: "Confirm Deletion",
        deleteConfirmText: "Are you sure you want to delete this shareholder? This action cannot be undone.",
        delete: "Delete",
        successAdd: "Shareholder registered successfully!",
        successEdit: "Shareholder updated successfully!",
        successDelete: "Shareholder deleted successfully!",
        validationError: "Please fill out all required fields.",
        shareError: "Share percentage cannot exceed the remaining available shares."
    }
};

export default function SettingsPage() {
    const { language } = useLanguage();
    const tLocal = localTranslations[language as 'so' | 'en'] || localTranslations.so;
    
    const [activeTab, setActiveTab] = useState<'profile' | 'shareholders' | 'notifications' | 'security' | 'appearance'>('profile');
    
    // Shareholders State
    const [shareholders, setShareholders] = useState<any[]>([]);
    const [loadingShareholders, setLoadingShareholders] = useState(false);
    
    // Modals
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedShareholder, setSelectedShareholder] = useState<any>(null);
    
    // Form fields
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [sharePercentage, setSharePercentage] = useState('');
    const [profitSplit, setProfitSplit] = useState('');
    const [joinedDate, setJoinedDate] = useState('');
    
    // Status Feedback
    const [formError, setFormError] = useState('');
    const [formSuccess, setFormSuccess] = useState('');
    const [saving, setSaving] = useState(false);

    // Fetch shareholders
    const fetchShareholders = async () => {
        setLoadingShareholders(true);
        try {
            const res = await fetch('/api/manufacturing/shareholders');
            if (res.ok) {
                const data = await res.json();
                setShareholders(data.shareholders || []);
            }
        } catch (e) {
            console.error('Error fetching shareholders:', e);
        } finally {
            setLoadingShareholders(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'shareholders') {
            fetchShareholders();
        }
    }, [activeTab]);

    // Open add modal
    const openAddModal = () => {
        setName('');
        setEmail('');
        setSharePercentage('');
        setProfitSplit('');
        setJoinedDate(new Date().toISOString().split('T')[0]);
        setFormError('');
        setFormSuccess('');
        setShowAddModal(true);
    };

    // Open edit modal
    const openEditModal = (sh: any) => {
        setSelectedShareholder(sh);
        setName(sh.name);
        setEmail(sh.email);
        setSharePercentage(sh.sharePercentage.toString());
        setProfitSplit(sh.profitSplit.toString());
        setJoinedDate(new Date(sh.joinedDate).toISOString().split('T')[0]);
        setFormError('');
        setFormSuccess('');
        setShowEditModal(true);
    };

    // Open delete confirmation
    const openDeleteModal = (sh: any) => {
        setSelectedShareholder(sh);
        setFormError('');
        setFormSuccess('');
        setShowDeleteModal(true);
    };

    // Add Shareholder
    const handleAddShareholder = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');
        setFormSuccess('');

        if (!name.trim() || !email.trim() || !sharePercentage) {
            setFormError(tLocal.validationError);
            return;
        }

        const percentageVal = parseFloat(sharePercentage);
        const profitVal = parseFloat(profitSplit) || 0;

        if (isNaN(percentageVal) || percentageVal <= 0) {
            setFormError(tLocal.shareError);
            return;
        }

        setSaving(true);
        try {
            const res = await fetch('/api/manufacturing/shareholders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    email,
                    sharePercentage: percentageVal,
                    profitSplit: profitVal,
                    joinedDate: joinedDate ? new Date(joinedDate) : new Date()
                })
            });

            const data = await res.json();
            if (res.ok) {
                setFormSuccess(tLocal.successAdd);
                fetchShareholders();
                setTimeout(() => {
                    setShowAddModal(false);
                }, 1200);
            } else {
                setFormError(data.message || tLocal.validationError);
            }
        } catch (err) {
            console.error(err);
            setFormError('Cilad ayaa dhacday.');
        } finally {
            setSaving(false);
        }
    };

    // Edit Shareholder
    const handleEditShareholder = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');
        setFormSuccess('');

        if (!name.trim() || !email.trim() || !sharePercentage) {
            setFormError(tLocal.validationError);
            return;
        }

        const percentageVal = parseFloat(sharePercentage);
        const profitVal = parseFloat(profitSplit) || 0;

        setSaving(true);
        try {
            const res = await fetch(`/api/manufacturing/shareholders/${selectedShareholder.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    email,
                    sharePercentage: percentageVal,
                    profitSplit: profitVal,
                    joinedDate: joinedDate ? new Date(joinedDate) : new Date()
                })
            });

            const data = await res.json();
            if (res.ok) {
                setFormSuccess(tLocal.successEdit);
                fetchShareholders();
                setTimeout(() => {
                    setShowEditModal(false);
                }, 1200);
            } else {
                setFormError(data.message || tLocal.validationError);
            }
        } catch (err) {
            console.error(err);
            setFormError('Cilad ayaa dhacday.');
        } finally {
            setSaving(false);
        }
    };

    // Delete Shareholder
    const handleDeleteShareholder = async () => {
        setSaving(true);
        setFormError('');
        setFormSuccess('');

        try {
            const res = await fetch(`/api/manufacturing/shareholders/${selectedShareholder.id}`, {
                method: 'DELETE'
            });

            const data = await res.json();
            if (res.ok) {
                setFormSuccess(tLocal.successDelete);
                fetchShareholders();
                setTimeout(() => {
                    setShowDeleteModal(false);
                }, 1200);
            } else {
                setFormError(data.message || 'Ma tirtiri kartid saamilayda.');
            }
        } catch (err) {
            console.error(err);
            setFormError('Cilad ayaa dhacday.');
        } finally {
            setSaving(false);
        }
    };

    // Real-time analytics
    const totalAllocatedShares = shareholders.reduce((sum, s) => sum + s.sharePercentage, 0);
    const totalProfitPayout = shareholders.reduce((sum, s) => sum + parseFloat(s.profitSplit || 0), 0);
    const remainingAvailableShares = Math.max(0, 100 - totalAllocatedShares);

    return (
        <div className="flex flex-col gap-6 p-4 lg:p-6 min-h-screen pb-20 bg-slate-50/50 dark:bg-slate-900/10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/manufacturing" className="p-2.5 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-emerald-500 transition-all">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                            <SettingsIcon className="text-emerald-500" size={32} />
                            {tLocal.title}
                        </h1>
                        <p className="text-sm text-slate-500 font-medium">{tLocal.subtitle}</p>
                    </div>
                </div>
            </div>

            {/* Main Content Layout */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-4">
                {/* Settings Sidebar Menu */}
                <div className="md:col-span-1 space-y-2 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-4 rounded-3xl border border-white dark:border-slate-800 shadow-xl h-fit">
                    <button 
                        onClick={() => setActiveTab('profile')}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-sm transition-all ${
                            activeTab === 'profile' 
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' 
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                    >
                        <Building size={18} /> {tLocal.companyProfile}
                    </button>
                    <button 
                        onClick={() => setActiveTab('shareholders')}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-sm transition-all ${
                            activeTab === 'shareholders' 
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' 
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                    >
                        <Users size={18} /> {tLocal.shareholders}
                    </button>
                    <button 
                        onClick={() => setActiveTab('notifications')}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-sm transition-all ${
                            activeTab === 'notifications' 
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' 
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                    >
                        <Bell size={18} /> {tLocal.notifications}
                    </button>
                    <button 
                        onClick={() => setActiveTab('security')}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-sm transition-all ${
                            activeTab === 'security' 
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' 
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                    >
                        <Shield size={18} /> {tLocal.security}
                    </button>
                    <button 
                        onClick={() => setActiveTab('appearance')}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-sm transition-all ${
                            activeTab === 'appearance' 
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' 
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                    >
                        <Paintbrush size={18} /> {tLocal.appearance}
                    </button>
                </div>

                {/* Settings Content Area */}
                <div className="md:col-span-3 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-6 md:p-8 rounded-3xl border border-white dark:border-slate-800 shadow-xl min-h-[500px]">
                    
                    {/* TAB: Company Profile */}
                    {activeTab === 'profile' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">{tLocal.companyProfile}</h2>
                            <div className="space-y-6 max-w-2xl">
                                <div>
                                    <label className="block text-[11px] font-black uppercase text-slate-400 dark:text-slate-500 mb-2 tracking-widest">Company Name</label>
                                    <input 
                                        type="text" 
                                        className="w-full p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                                        defaultValue="AN Industory"
                                    />
                                </div>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[11px] font-black uppercase text-slate-400 dark:text-slate-500 mb-2 tracking-widest">Industry</label>
                                        <input 
                                            type="text" 
                                            className="w-full p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                                            defaultValue="Manufacturing"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-black uppercase text-slate-400 dark:text-slate-500 mb-2 tracking-widest">Currency</label>
                                        <input 
                                            type="text" 
                                            className="w-full p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                                            defaultValue="USD"
                                        />
                                    </div>
                                </div>

                                <button className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all mt-4">
                                    {tLocal.saveChanges}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* TAB: Shareholders (CRUD) */}
                    {activeTab === 'shareholders' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 dark:text-white">{tLocal.shTitle}</h2>
                                    <p className="text-xs text-slate-500 font-bold mt-1">{tLocal.shSubtitle}</p>
                                </div>
                                <button 
                                    onClick={openAddModal}
                                    className="btn-primary py-2.5 px-4 flex items-center gap-2 text-xs bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-md transition-all shrink-0"
                                >
                                    <Plus size={16} /> {tLocal.addShareholder}
                                </button>
                            </div>

                            {/* Analytics Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="p-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">{tLocal.totalShareholders}</p>
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                                        <Users className="text-emerald-500" size={22} />
                                        {shareholders.length}
                                    </h3>
                                </div>
                                <div className="p-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">{tLocal.allocatedShares}</p>
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                                        <Percent className="text-blue-500" size={22} />
                                        {totalAllocatedShares}%
                                    </h3>
                                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
                                        <div 
                                            className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                                            style={{ width: `${totalAllocatedShares}%` }}
                                        />
                                    </div>
                                </div>
                                <div className="p-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">{tLocal.profitSplit}</p>
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                                        <Coins className="text-orange-500" size={22} />
                                        {totalProfitPayout.toLocaleString()} ETB
                                    </h3>
                                </div>
                            </div>

                            {/* Shareholders Table */}
                            {loadingShareholders ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-4">
                                    <Loader2 className="animate-spin text-emerald-500" size={36} />
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{tLocal.loading}</p>
                                </div>
                            ) : shareholders.length > 0 ? (
                                <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-2xl">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-400">
                                                <th className="p-4 pl-6">{tLocal.name}</th>
                                                <th className="p-4">{tLocal.email}</th>
                                                <th className="p-4">{tLocal.percentage}</th>
                                                <th className="p-4">{tLocal.profitAmount}</th>
                                                <th className="p-4">{tLocal.joinedDate}</th>
                                                <th className="p-4 pr-6 text-right">{tLocal.actions}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                            {shareholders.map((sh) => {
                                                const initials = sh.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
                                                return (
                                                    <tr key={sh.id} className="hover:bg-slate-50/20 dark:hover:bg-slate-800/10 transition-colors">
                                                        <td className="p-4 pl-6 flex items-center gap-3">
                                                            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-xs font-black shrink-0">
                                                                {initials}
                                                            </div>
                                                            <span className="text-xs font-black text-slate-900 dark:text-white">{sh.name}</span>
                                                        </td>
                                                        <td className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400">
                                                            {sh.email}
                                                        </td>
                                                        <td className="p-4 text-xs font-black text-slate-950 dark:text-white">
                                                            {sh.sharePercentage}%
                                                        </td>
                                                        <td className="p-4 text-xs font-black text-emerald-600">
                                                            {parseFloat(sh.profitSplit).toLocaleString()} ETB
                                                        </td>
                                                        <td className="p-4 text-xs font-bold text-slate-400">
                                                            {new Date(sh.joinedDate).toLocaleDateString()}
                                                        </td>
                                                        <td className="p-4 pr-6 text-right">
                                                            <div className="flex justify-end gap-2">
                                                                <button 
                                                                    onClick={() => openEditModal(sh)}
                                                                    title={tLocal.submitEdit}
                                                                    className="p-2 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-slate-800 text-slate-400 rounded-lg transition-colors"
                                                                >
                                                                    <Edit size={14} />
                                                                </button>
                                                                <button 
                                                                    onClick={() => openDeleteModal(sh)}
                                                                    title={tLocal.delete}
                                                                    className="p-2 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-slate-800 text-slate-400 rounded-lg transition-colors"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-20 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                                    <Users size={48} className="mx-auto text-slate-300 mb-3" />
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-wider">{tLocal.noShareholders}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Placeholder tabs for high aesthetics */}
                    {(activeTab === 'notifications' || activeTab === 'security' || activeTab === 'appearance') && (
                        <div className="space-y-6 animate-fade-in">
                            <h2 className="text-xl font-black text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-4 capitalize">{activeTab} Preferences</h2>
                            <div className="p-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                                <Info size={40} className="mx-auto text-slate-300 mb-3" />
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Astaantani waa la diyaarinayaa dhowaan</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL: Add Shareholder */}
            {showAddModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl p-6 md:p-8 shadow-2xl relative border border-slate-200 dark:border-slate-800 animate-scale-in">
                        <button 
                            onClick={() => setShowAddModal(false)}
                            className="absolute right-4 top-4 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 transition-colors"
                        >
                            <X size={20} />
                        </button>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 border-b border-slate-100 dark:border-slate-800 pb-4 flex items-center gap-2">
                            <Users size={22} className="text-emerald-500" />
                            {tLocal.addModalTitle}
                        </h3>
                        <form onSubmit={handleAddShareholder} className="space-y-4">
                            {formError && (
                                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold flex items-center gap-2 animate-shake">
                                    <Info size={16} />
                                    <span>{formError}</span>
                                </div>
                            )}
                            {formSuccess && (
                                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-bold flex items-center gap-2">
                                    <Check size={16} />
                                    <span>{formSuccess}</span>
                                </div>
                            )}

                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-wider">{tLocal.name}</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input 
                                        type="text" 
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-slate-900 dark:text-white"
                                        placeholder="Hamse Amiin"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-wider">{tLocal.email}</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input 
                                        type="email" 
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-slate-900 dark:text-white"
                                        placeholder="hamse@an-industory.com"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-wider">{tLocal.percentage}</label>
                                    <input 
                                        type="number" 
                                        step="any"
                                        value={sharePercentage}
                                        onChange={(e) => setSharePercentage(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-slate-900 dark:text-white"
                                        placeholder="Tusaale: 25"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5 tracking-wider">{tLocal.profitAmount} (ETB)</label>
                                    <input 
                                        type="number" 
                                        step="any"
                                        value={profitSplit}
                                        onChange={(e) => setProfitSplit(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-slate-900 dark:text-white"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-wider">{tLocal.joinedDate}</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input 
                                        type="date" 
                                        value={joinedDate}
                                        onChange={(e) => setJoinedDate(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-slate-900 dark:text-white"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-6">
                                <button 
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-all"
                                >
                                    {tLocal.cancel}
                                </button>
                                <button 
                                    type="submit"
                                    disabled={saving}
                                    className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-55"
                                >
                                    {saving ? <Loader2 className="animate-spin" size={14} /> : null}
                                    {tLocal.submitAdd}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: Edit Shareholder */}
            {showEditModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl p-6 md:p-8 shadow-2xl relative border border-slate-200 dark:border-slate-800 animate-scale-in">
                        <button 
                            onClick={() => setShowEditModal(false)}
                            className="absolute right-4 top-4 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 transition-colors"
                        >
                            <X size={20} />
                        </button>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 border-b border-slate-100 dark:border-slate-800 pb-4 flex items-center gap-2">
                            <Edit size={22} className="text-emerald-500" />
                            {tLocal.editModalTitle}
                        </h3>
                        <form onSubmit={handleEditShareholder} className="space-y-4">
                            {formError && (
                                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold flex items-center gap-2 animate-shake">
                                    <Info size={16} />
                                    <span>{formError}</span>
                                </div>
                            )}
                            {formSuccess && (
                                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-bold flex items-center gap-2">
                                    <Check size={16} />
                                    <span>{formSuccess}</span>
                                </div>
                            )}

                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-wider">{tLocal.name}</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input 
                                        type="text" 
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-slate-900 dark:text-white"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-wider">{tLocal.email}</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input 
                                        type="email" 
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-slate-900 dark:text-white"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-wider">{tLocal.percentage}</label>
                                    <input 
                                        type="number" 
                                        step="any"
                                        value={sharePercentage}
                                        onChange={(e) => setSharePercentage(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-slate-900 dark:text-white"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5 tracking-wider">{tLocal.profitAmount} (ETB)</label>
                                    <input 
                                        type="number" 
                                        step="any"
                                        value={profitSplit}
                                        onChange={(e) => setProfitSplit(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-slate-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-wider">{tLocal.joinedDate}</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input 
                                        type="date" 
                                        value={joinedDate}
                                        onChange={(e) => setJoinedDate(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-slate-900 dark:text-white"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-6">
                                <button 
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-all"
                                >
                                    {tLocal.cancel}
                                </button>
                                <button 
                                    type="submit"
                                    disabled={saving}
                                    className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-55"
                                >
                                    {saving ? <Loader2 className="animate-spin" size={14} /> : null}
                                    {tLocal.submitEdit}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: Delete Confirmation */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 md:p-8 shadow-2xl relative border border-slate-200 dark:border-slate-800 animate-scale-in">
                        <button 
                            onClick={() => setShowDeleteModal(false)}
                            className="absolute right-4 top-4 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 transition-colors"
                        >
                            <X size={20} />
                        </button>
                        <h3 className="text-xl font-black text-rose-600 mb-4 flex items-center gap-2">
                            <Trash2 size={22} />
                            {tLocal.deleteConfirmTitle}
                        </h3>
                        
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                            {tLocal.deleteConfirmText}
                            <br />
                            <span className="text-slate-900 dark:text-white font-black mt-2 block">
                                Saamilayda: {selectedShareholder?.name} ({selectedShareholder?.sharePercentage}%)
                            </span>
                        </p>

                        {formError && (
                            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold flex items-center gap-2 mb-4">
                                <Info size={16} />
                                <span>{formError}</span>
                            </div>
                        )}
                        {formSuccess && (
                            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-bold flex items-center gap-2 mb-4">
                                <Check size={16} />
                                <span>{formSuccess}</span>
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <button 
                                type="button"
                                onClick={() => setShowDeleteModal(false)}
                                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-all"
                            >
                                {tLocal.cancel}
                            </button>
                            <button 
                                onClick={handleDeleteShareholder}
                                disabled={saving}
                                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-55"
                            >
                                {saving ? <Loader2 className="animate-spin" size={14} /> : null}
                                {tLocal.delete}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
