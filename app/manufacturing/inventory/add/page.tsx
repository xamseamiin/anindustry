'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2, Package, Grip, Calculator, Ruler, DollarSign, Globe } from 'lucide-react';
import Toast from '@/components/common/Toast';
import { useLanguage } from '@/contexts/LanguageContext';

// Premium Multilingual Translations Dictionary
const t = {
    so: {
        title: "Diiwaangeli Alaab Cusub",
        subtitle: "Ku dar alaab cusub ama baakejin nidaamka wershadda.",
        generalInfo: "Macluumaadka Guud",
        name: "Magaca Alaabta *",
        namePlaceholder: "t.s. Caagga (Resin), Biyo-Sifeeye, Sonkor 50kg, iwm",
        category: "Qeybta (Category)",
        unit: "Halbeegga Tirada (Unit)",
        smartSpecs: "Faahfaahinta Smart-ka ah",
        bagCapacity: "Awoodda Bacda (Tirada Bacdii ku jirta)",
        capacityHelper: "Waxaa loo isticmaalaa xisaabinta tirada bacaha ee loo baahan yahay marka wax la iibsanayo.",
        yieldPerMeter: "Cadadka halkii Mitir (Yield Per Meter)",
        yieldPerMeterPlaceholder: "Halkii mitir inta xabo laga helaa?",
        stockValue: "Tirada & Qiimaha (Stock & Value)",
        initialStock: "Tirada Hore",
        minStock: "Tirada Digniinta",
        costPrice: "Qiimaha Kharashka (ETB)",
        sellingPrice: "Qiimaha Iibka (ETB)",
        confirmRegistration: "Xaqiiji Diiwaangelinta",
        cancel: "Ka Noqo",
        rawMaterial: "Alaab Ceyriin (Raw Material)",
        packaging: "Baakejin (Packaging)",
        finishedGoods: "Alaab Dhamaatay (Finished Goods)",
        other: "Wax Kale (Other)",
        nameRequired: "Fadlan magaca geli.",
        successMessage: "Alaabta si guul leh ayaa lagu daray!",
        errorMessage: "Cilad ayaa dhacday.",
        pcs: "Xabo (pcs)",
        kg: "Kiilo (kg)",
        l: "Litir (l)",
        meters: "Mitir (m)",
        box: "Kartoon (box)",
        roll: "Duub (roll)",
        xabo: "Xabo"
    },
    en: {
        title: "Register Component",
        subtitle: "Adding new component or packaging to the factory ecosystem.",
        generalInfo: "General Information",
        name: "Material/Product Name *",
        namePlaceholder: "e.g. Plastic Resin, Purifier, Sugar 50kg, etc.",
        category: "Category",
        unit: "Unit of Measure",
        smartSpecs: "Smart Specifications",
        bagCapacity: "Bag Capacity (Items per Bag)",
        capacityHelper: "Used for auto-calculating required bags in purchases.",
        yieldPerMeter: "Yield Per Meter (For Rolls)",
        yieldPerMeterPlaceholder: "How many pieces per meter?",
        stockValue: "Stock & Value",
        initialStock: "Initial Stock",
        minStock: "Min. Stock Alert",
        costPrice: "Cost Price (ETB)",
        sellingPrice: "Selling Price (ETB)",
        confirmRegistration: "Confirm Registration",
        cancel: "Cancel",
        rawMaterial: "Raw Material",
        packaging: "Packaging",
        finishedGoods: "Finished Goods",
        other: "Other",
        nameRequired: "Please enter the name.",
        successMessage: "Material added successfully!",
        errorMessage: "An error occurred.",
        pcs: "Pieces (pcs)",
        kg: "Kilograms (kg)",
        l: "Liters (l)",
        meters: "Meters (m)",
        box: "Box",
        roll: "Roll",
        xabo: "pcs"
    }
};

export default function AddInventoryItemPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const { language } = useLanguage();

    const [formData, setFormData] = useState({
        name: '',
        sku: '', // Kept in state but hidden in UI (backend will auto-generate)
        category: 'Raw Material',
        unit: 'pcs',
        inStock: 0,
        minStock: 10,
        purchasePrice: 0,
        sellingPrice: 0,
        location: '',
        description: '',
        capacity: 150,
        yieldPerMeter: 0
    });
    
    // Calculator State
    const [showCalculator, setShowCalculator] = useState(false);
    const [calcInputs, setCalcInputs] = useState({ totalMaterial: '', totalYield: '' });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (!formData.name) {
            setToast({ message: t[language].nameRequired, type: 'error' });
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/manufacturing/inventory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!response.ok) throw new Error('Failed to create item');

            setToast({ message: t[language].successMessage, type: 'success' });
            setTimeout(() => router.push('/manufacturing/inventory'), 1000);

        } catch (error) {
            setToast({ message: t[language].errorMessage, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => {
            const updated = { ...prev, [field]: value };
            
            // Clean up unrelated parameters depending on selected category to ensure clean data
            if (field === 'category') {
                if (value === 'Raw Material') {
                    updated.sellingPrice = 0;
                    updated.capacity = 0;
                    // yieldPerMeter is allowed for Raw Material now
                    updated.inStock = 0; // Audit lock to 0!
                } else if (value === 'Packaging') {
                    updated.sellingPrice = 0;
                    updated.capacity = 150; // Default capacity to 150
                    updated.inStock = 0; // Audit lock to 0!
                } else if (value === 'Finished Goods') {
                    updated.capacity = 0;
                    updated.yieldPerMeter = 0;
                } else {
                    updated.sellingPrice = 0;
                    updated.capacity = 0;
                    updated.yieldPerMeter = 0;
                    updated.inStock = 0;
                }
            }
            return updated;
        });
    };

    const isRaw = formData.category === 'Raw Material';
    const isPackaging = formData.category === 'Packaging';
    const isFinished = formData.category === 'Finished Goods';

    const inputClass = "w-full pl-10 pr-4 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/40 outline-none transition-all font-bold text-slate-700";

    return (
        <div className="flex flex-col gap-8 p-0 min-h-screen pb-20 w-full">
            {/* Header */}
            <div className="flex items-center justify-between gap-6 flex-wrap">
                <div className="flex items-center gap-6">
                    <Link href="/manufacturing/inventory" className="p-3 bg-white rounded-2xl shadow-sm border border-slate-200 text-slate-500 hover:text-blue-600 transition-all hover:scale-105 active:scale-95">
                        <ArrowLeft size={24} />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">{t[language].title}</h1>
                        <p className="text-sm font-medium text-slate-500">{t[language].subtitle}</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white/60 backdrop-blur-xl p-8 lg:p-10 rounded-[2.5rem] border border-white shadow-2xl space-y-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -z-10" />
                
                {/* Basic Info */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                        <div className="p-2 bg-blue-500/10 text-blue-600 rounded-xl"><Package size={20} /></div>
                        <h3 className="text-xl font-black text-slate-900">{t[language].generalInfo}</h3>
                    </div>

                    <div className="grid grid-cols-1 gap-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t[language].name}</label>
                            <div className="relative">
                                <Package className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    placeholder={t[language].namePlaceholder}
                                    className={inputClass}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t[language].category}</label>
                            <div className="relative">
                                <Grip className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <select
                                    value={formData.category}
                                    onChange={(e) => handleInputChange('category', e.target.value)}
                                    className={`${inputClass} appearance-none`}
                                >
                                    <option value="Raw Material">{t[language].rawMaterial}</option>
                                    <option value="Packaging">{t[language].packaging}</option>
                                    <option value="Other">{t[language].other}</option>
                                </select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t[language].unit}</label>
                            <select
                                value={formData.unit}
                                onChange={(e) => handleInputChange('unit', e.target.value)}
                                className={inputClass.replace('pl-10', 'pl-4')}
                            >
                                <option value="pcs">{t[language].pcs}</option>
                                <option value="kg">{t[language].kg}</option>
                                <option value="l">{t[language].l}</option>
                                <option value="meters">{t[language].meters}</option>
                                <option value="box">{t[language].box}</option>
                                <option value="roll">{t[language].roll}</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Smart Specifications (Shown for Packaging and Raw Material) */}
                {(isPackaging || isRaw) && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                            <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-xl"><Calculator size={20} /></div>
                            <h3 className="text-xl font-black text-slate-900">{t[language].smartSpecs}</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t[language].bagCapacity}</label>
                                
                                {/* Gorgeous Clickable Visual Cards (50, 100, 150 items) */}
                                <div className="grid grid-cols-3 gap-4">
                                    {[50, 100, 150].map((cap) => (
                                        <button
                                            key={cap}
                                            type="button"
                                            onClick={() => handleInputChange('capacity', cap)}
                                            className={`py-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-1 font-black ${
                                                formData.capacity === cap
                                                    ? 'border-blue-600 bg-blue-50/50 text-blue-600 shadow-lg shadow-blue-500/10'
                                                    : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300 hover:bg-slate-100'
                                            }`}
                                        >
                                            <span className="text-xl">{cap}</span>
                                            <span className="text-[10px] uppercase tracking-wider">{t[language].xabo}</span>
                                        </button>
                                    ))}
                                </div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase mt-1 ml-1">{t[language].capacityHelper}</p>
                            </div>

                            <div className="space-y-2 flex flex-col justify-end">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Isticmaalka Hal Xabo (Consumption/Unit)</label>
                                <div className="flex items-center gap-2">
                                    <div className="relative flex-1">
                                        <Ruler className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            type="number"
                                            step="0.000001"
                                            value={formData.yieldPerMeter || ''}
                                            onChange={(e) => handleInputChange('yieldPerMeter', parseFloat(e.target.value) || 0)}
                                            placeholder="Tusaale: 0.00108"
                                            className={inputClass}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowCalculator(true);
                                            setCalcInputs({ totalMaterial: '', totalYield: '' });
                                        }}
                                        className="p-3.5 bg-white border border-slate-200 text-[#3498DB] hover:bg-blue-500/10 rounded-2xl transition-colors shadow-sm"
                                        title="Smart Calculator"
                                    >
                                        <Calculator size={20} />
                                    </button>
                                </div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase mt-1 ml-1">Xisaabta ay hal xabo qaadato (örn: 0.00108)</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Stock & Value */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                        <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl"><DollarSign size={20} /></div>
                        <h3 className="text-xl font-black text-slate-900">{t[language].stockValue}</h3>
                    </div>

                    <div className={`grid grid-cols-1 gap-6 ${isFinished ? 'md:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-3'}`}>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t[language].initialStock}</label>
                            {isRaw || isPackaging ? (
                                <div className="space-y-1">
                                    <input
                                        type="text"
                                        disabled
                                        value="0"
                                        className="w-full pl-4 pr-4 py-3.5 rounded-2xl border border-slate-200 bg-slate-100/60 font-black text-slate-400"
                                    />
                                    <p className="text-[8px] font-black text-blue-600 dark:text-blue-500 uppercase tracking-wider mt-1.5 ml-1 bg-blue-50 dark:bg-blue-950/40 p-1.5 rounded-lg border border-blue-100/40">
                                        {language === 'so' 
                                            ? "⚠️ Tirada stock-ga waxaa lagu kordhiyaa Procurement (Purchases) oo kaliya." 
                                            : "⚠️ Stock count is managed strictly via Procurement Purchase Orders."}
                                    </p>
                                </div>
                            ) : (
                                <input
                                    type="number"
                                    value={formData.inStock}
                                    onChange={(e) => handleInputChange('inStock', parseFloat(e.target.value) || 0)}
                                    className={inputClass.replace('pl-10', 'pl-4')}
                                />
                            )}
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t[language].minStock}</label>
                            <input
                                type="number"
                                value={formData.minStock}
                                onChange={(e) => handleInputChange('minStock', parseFloat(e.target.value) || 0)}
                                className={inputClass.replace('pl-10', 'pl-4')}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t[language].costPrice}</label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.purchasePrice}
                                onChange={(e) => handleInputChange('purchasePrice', parseFloat(e.target.value) || 0)}
                                className={inputClass.replace('pl-10', 'pl-4')}
                            />
                        </div>
                        
                        {/* Only show Selling Price for Finished Goods */}
                        {isFinished && (
                            <div className="space-y-2 animate-fade-in">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t[language].sellingPrice}</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.sellingPrice}
                                    onChange={(e) => handleInputChange('sellingPrice', parseFloat(e.target.value) || 0)}
                                    className={inputClass.replace('pl-10', 'pl-4')}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Form Actions */}
                <div className="pt-8 flex gap-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 py-5 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                        {t[language].confirmRegistration}
                    </button>
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-10 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                    >
                        {t[language].cancel}
                    </button>
                </div>
            </form>

            {/* Smart Calculator Modal */}
            {showCalculator && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-md p-6 shadow-2xl border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-blue-500/10 text-[#3498DB] rounded-xl"><Calculator size={20} /></div>
                            <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">Xisaabiye Farsamo (Calculator)</h3>
                        </div>
                        <p className="text-xs font-semibold text-gray-500 mb-6 leading-relaxed">
                            Halkan geli wadarta guud ee alaabta (tusaale 50kg) iyo tirada xabado ee ay soo saartay (tusaale 46200). System-ka ayaa kuu xisaabinaya inta ay qaadato hal xabo oo wuxuu ku keydin doonaa alaabtan.
                        </p>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2.5">Total Material Used (Wadarta Qalabka)</label>
                                <input 
                                    type="number" 
                                    step="any"
                                    placeholder="Tusaale: 50"
                                    value={calcInputs.totalMaterial}
                                    onChange={e => setCalcInputs({ ...calcInputs, totalMaterial: e.target.value })}
                                    className="w-full text-sm font-black p-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 outline-none focus:ring-4 focus:ring-blue-500/10"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2.5">Total Yield (Tirada Ka Soo Baxday)</label>
                                <input 
                                    type="number" 
                                    step="any"
                                    placeholder="Tusaale: 46200"
                                    value={calcInputs.totalYield}
                                    onChange={e => setCalcInputs({ ...calcInputs, totalYield: e.target.value })}
                                    className="w-full text-sm font-black p-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 outline-none focus:ring-4 focus:ring-blue-500/10"
                                />
                            </div>
                        </div>
                        
                        {calcInputs.totalMaterial && calcInputs.totalYield && Number(calcInputs.totalYield) > 0 && (
                            <div className="mt-6 p-4 bg-[#3498DB]/10 rounded-2xl text-center border border-[#3498DB]/20">
                                <p className="text-[10px] font-black text-[#3498DB] uppercase tracking-widest mb-1">Hal Xabo waxay qaadanaysaa:</p>
                                <p className="text-xl font-black text-gray-900 dark:text-white">
                                    {(Number(calcInputs.totalMaterial) / Number(calcInputs.totalYield)).toLocaleString(undefined, { maximumFractionDigits: 8 })}
                                </p>
                            </div>
                        )}

                        <div className="flex gap-3 mt-6">
                            <button 
                                type="button" 
                                onClick={() => setShowCalculator(false)}
                                className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-2xl text-[10px] text-gray-500 dark:text-gray-300 font-black uppercase tracking-widest transition-colors"
                            >
                                Jooji (Cancel)
                            </button>
                            <button 
                                type="button" 
                                onClick={() => {
                                    const qty = Number(calcInputs.totalMaterial) / Number(calcInputs.totalYield);
                                    if (qty > 0) {
                                        handleInputChange('yieldPerMeter', qty);
                                    }
                                    setShowCalculator(false);
                                }}
                                className="flex-1 py-4 bg-[#3498DB] hover:bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/30 transition-all active:scale-95 disabled:opacity-50"
                                disabled={!(calcInputs.totalMaterial && calcInputs.totalYield && Number(calcInputs.totalYield) > 0)}
                            >
                                Isticmaal (Apply)
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}
