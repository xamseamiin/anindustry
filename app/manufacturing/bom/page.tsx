'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
    Search, Plus, Filter, Save, Trash2, Edit2, ChevronDown,
    ChevronRight, Box, Layers, Wallet, Calculator, ArrowRight, Loader2,
    FlaskConical, Beaker, Zap, Activity, Info, AlertCircle, X
} from 'lucide-react';
import Toast from '@/components/common/Toast';

export default function BOMPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const urlProductId = searchParams.get('productId');

    const [selectedProductId, setSelectedProductId] = useState<string | null>(urlProductId);
    const [products, setProducts] = useState<any[]>([]);
    const [bomItems, setBomItems] = useState<any[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [loadingBOM, setLoadingBOM] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const [productSearch, setProductSearch] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [newItem, setNewItem] = useState({
        materialName: '',
        quantity: 1,
        unit: 'pcs',
        costPerUnit: 0
    });
    
    // Calculator State
    const [showCalculator, setShowCalculator] = useState(false);
    const [calcInputs, setCalcInputs] = useState({ totalMaterial: '', totalYield: '' });

    useEffect(() => {
        fetchProducts();
    }, []);

    useEffect(() => {
        if (selectedProductId) {
            router.push(`/manufacturing/bom?productId=${selectedProductId}`);
            fetchBOM(selectedProductId);
        } else {
            setBomItems([]);
        }
    }, [selectedProductId]);

    const fetchProducts = async () => {
        setLoadingProducts(true);
        try {
            const res = await fetch('/api/manufacturing/products');
            if (res.ok) {
                const data = await res.json();
                setProducts(data.products || []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingProducts(false);
        }
    };

    const fetchBOM = async (id: string) => {
        setLoadingBOM(true);
        try {
            const res = await fetch(`/api/manufacturing/bom?productId=${id}`);
            if (res.ok) {
                const data = await res.json();
                setBomItems(data.bom || []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingBOM(false);
        }
    };

    const handleAddItem = async () => {
        if (!selectedProductId) return;
        if (!newItem.materialName) {
            setToast({ message: 'Geli magaca alaabta.', type: 'error' });
            return;
        }

        try {
            const res = await fetch('/api/manufacturing/bom', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId: selectedProductId,
                    ...newItem
                })
            });

            if (res.ok) {
                setToast({ message: 'Alaabtii waa lagu daray recipe-ka!', type: 'success' });
                setShowAddForm(false);
                setNewItem({ materialName: '', quantity: 1, unit: 'pcs', costPerUnit: 0 });
                fetchBOM(selectedProductId);
            } else {
                setToast({ message: 'Failed to add item', type: 'error' });
            }
        } catch (error) {
            setToast({ message: 'Error adding item', type: 'error' });
        }
    };

    const handleDeleteItem = async (id: string) => {
        if (!confirm('Ma hubtaa inaad ka saarto alaabtan recipe-ka?')) return;
        try {
            await fetch(`/api/manufacturing/bom/${id}`, { method: 'DELETE' });
            fetchBOM(selectedProductId!);
            setToast({ message: 'Item removed', type: 'success' });
        } catch (e) {
            setToast({ message: 'Error deleting item', type: 'error' });
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(productSearch.toLowerCase()))
    );

    const checkSelectedProduct = products.find(p => p.id === selectedProductId);

    const totalMaterialCost = bomItems.reduce((acc, item) => acc + parseFloat(item.totalCost), 0);
    const laborCost = 0; 
    const overhead = 0; 
    const finalCost = totalMaterialCost + laborCost + overhead;

    return (
        <div className="flex flex-col lg:flex-row h-screen gap-6 p-4 bg-slate-50/50 overflow-hidden">

            {/* LEFT PANEL: Production Catalog */}
            <div className="w-full lg:w-1/3 bg-white/60 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white flex flex-col overflow-hidden">
                <div className="p-8 border-b border-slate-100 bg-white/40">
                    <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                        <Box className="text-blue-600" size={28} />
                        Production SKU
                    </h2>
                    <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Select product to edit recipe</p>
                    
                    <div className="relative mt-6">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search bottles (1L, 0.6L)..."
                            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-100 rounded-2xl text-sm font-black text-slate-700 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all shadow-inner"
                            value={productSearch}
                            onChange={(e) => setProductSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {loadingProducts ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4 opacity-40">
                            <Loader2 className="animate-spin text-blue-500" size={32} />
                            <p className="text-[10px] font-black uppercase tracking-widest">Loading Catalog...</p>
                        </div>
                    ) : filteredProducts.map(p => (
                        <div
                            key={p.id}
                            onClick={() => setSelectedProductId(p.id)}
                            className={`p-5 rounded-[1.5rem] cursor-pointer transition-all border group relative overflow-hidden ${selectedProductId === p.id
                                ? 'bg-slate-900 border-slate-900 shadow-xl scale-[1.02]'
                                : 'bg-white/40 border-white hover:border-blue-200 hover:bg-white/80 shadow-sm'}`}
                        >
                            {selectedProductId === p.id && (
                                <div className="absolute right-[-10%] top-[-20%] w-24 h-24 bg-blue-500/10 rounded-full blur-2xl" />
                            )}
                            <div className="flex justify-between items-center relative z-10">
                                <div>
                                    <h3 className={`font-black text-sm tracking-tight ${selectedProductId === p.id ? 'text-white' : 'text-slate-900'}`}>
                                        {p.name}
                                    </h3>
                                    <p className={`text-[10px] font-bold mt-1 uppercase tracking-widest ${selectedProductId === p.id ? 'text-slate-400' : 'text-slate-400'}`}>
                                        {p.category || 'Bottled Water'}
                                    </p>
                                </div>
                                <ChevronRight size={18} className={`transition-transform group-hover:translate-x-1 ${selectedProductId === p.id ? 'text-blue-400' : 'text-slate-300'}`} />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-6 bg-slate-50/50 border-t border-slate-100">
                    <Link href="/manufacturing/products/add" className="w-full py-4 bg-white border border-slate-200 text-slate-900 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all shadow-sm">
                        <Plus size={16} /> New Product Type
                    </Link>
                </div>
            </div>

            {/* RIGHT PANEL: Recipe Editor */}
            <div className="flex-1 flex flex-col gap-6 overflow-hidden">

                {selectedProductId && checkSelectedProduct ? (
                    <>
                        {/* BOM Editor */}
                        <div className="bg-white/60 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white flex-1 flex flex-col overflow-hidden">
                            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white/40">
                                <div className="flex items-center gap-5">
                                    <div className="p-4 bg-purple-500/10 text-purple-600 rounded-2xl shadow-inner">
                                        <FlaskConical size={32} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                                            Manufacturing Recipe
                                        </h2>
                                        <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Defining inputs for <span className="text-purple-600">{checkSelectedProduct.name}</span></p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowAddForm(!showAddForm)}
                                    className="px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20"
                                >
                                    {showAddForm ? <X size={16} /> : <Plus size={16} />}
                                    {showAddForm ? 'Cancel' : 'Add Ingredient'}
                                </button>
                            </div>

                            {/* Add Item Form Inline */}
                            {showAddForm && (
                                <div className="p-8 bg-slate-50/80 border-b border-slate-100 grid grid-cols-1 md:grid-cols-5 gap-6 items-end animate-in fade-in slide-in-from-top-4 duration-300">
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Raw Material Name</label>
                                        <input
                                            autoFocus
                                            type="text"
                                            className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-black text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 shadow-inner"
                                            placeholder="e.g. Preform 1L, Fur, Bac"
                                            value={newItem.materialName}
                                            onChange={e => setNewItem({ ...newItem, materialName: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Qty per Bottle</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                step="0.000001"
                                                className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-black text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 shadow-inner"
                                                value={newItem.quantity}
                                                onChange={e => setNewItem({ ...newItem, quantity: parseFloat(e.target.value) })}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowCalculator(true);
                                                    setCalcInputs({ totalMaterial: '', totalYield: '' });
                                                }}
                                                className="p-4 bg-white border border-slate-200 text-[#3498DB] hover:bg-blue-500/10 rounded-2xl transition-colors shadow-sm"
                                                title="Smart Calculator"
                                            >
                                                <Calculator size={20} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unit Cost</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-black text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 shadow-inner"
                                            value={newItem.costPerUnit}
                                            onChange={e => setNewItem({ ...newItem, costPerUnit: parseFloat(e.target.value) })}
                                        />
                                    </div>
                                    <button onClick={handleAddItem} className="bg-blue-600 text-white p-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20">
                                        Add to Recipe
                                    </button>
                                </div>
                            )}

                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-50/50 text-[10px] uppercase text-slate-400 font-black tracking-[0.2em] border-b border-slate-100 sticky top-0 z-20">
                                        <tr>
                                            <th className="p-6 pl-10">Ingredient / Component</th>
                                            <th className="p-6">Unit Consump.</th>
                                            <th className="p-6">Est. Unit Cost</th>
                                            <th className="p-6 text-right">Weighted Total</th>
                                            <th className="p-6 w-20 text-center pr-10">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {loadingBOM ? (
                                            <tr><td colSpan={5} className="p-20 text-center"><Loader2 className="animate-spin inline text-blue-500" size={32} /></td></tr>
                                        ) : bomItems.length > 0 ? bomItems.map((item: any) => (
                                            <tr key={item.id} className="group hover:bg-blue-50/30 transition-all duration-300">
                                                <td className="p-6 pl-10 font-black text-sm text-slate-900">{item.materialName}</td>
                                                <td className="p-6">
                                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-100 rounded-xl shadow-sm">
                                                        <span className="font-black text-slate-900 text-xs">{item.quantity}</span>
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.unit}</span>
                                                    </div>
                                                </td>
                                                <td className="p-6 text-sm font-bold text-slate-500">{parseFloat(item.costPerUnit).toFixed(2)} <span className="text-[10px] text-slate-300">ETB</span></td>
                                                <td className="p-6 text-sm font-black text-slate-900 text-right tracking-tight">{parseFloat(item.totalCost).toFixed(2)} <span className="text-[10px] text-slate-400 ml-1">ETB</span></td>
                                                <td className="p-6 text-center pr-10">
                                                    <button onClick={() => handleDeleteItem(item.id)} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                                                        <Trash2 size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={5} className="p-20 text-center">
                                                    <div className="flex flex-col items-center gap-4 text-slate-300">
                                                        <Beaker size={48} className="opacity-20" />
                                                        <p className="text-[10px] font-black uppercase tracking-[0.2em]">No ingredients defined in recipe</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Costing Summary Card */}
                        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden group">
                            <div className="absolute right-[-5%] top-[-20%] w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] group-hover:scale-125 transition-transform duration-1000" />
                            
                            <div className="flex items-center gap-6 relative z-10">
                                <div className="p-5 rounded-2xl bg-white/10 backdrop-blur-md shadow-inner text-blue-400">
                                    <Calculator size={40} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-white tracking-tight">Financial Blueprint</h3>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Automated Cost Calculation</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-12 relative z-10">
                                <div className="text-right hidden md:block">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ingredient Total</p>
                                    <p className="font-black text-xl text-slate-300 mt-1">{totalMaterialCost.toFixed(2)} <span className="text-xs">ETB</span></p>
                                </div>
                                <div className="w-px h-12 bg-white/10 hidden md:block" />
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Est. Production Cost</p>
                                    <p className="font-black text-5xl tracking-tighter text-white mt-1">
                                        {finalCost.toFixed(2)} <span className="text-sm text-slate-500 font-bold ml-1">ETB / Unit</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-300 bg-white/30 backdrop-blur-xl rounded-[3rem] border-2 border-dashed border-white shadow-2xl">
                        <div className="p-8 bg-white/40 rounded-full mb-6 shadow-inner animate-pulse">
                            <Box size={64} className="opacity-20 text-blue-500" />
                        </div>
                        <h3 className="text-xl font-black text-slate-400 uppercase tracking-[0.2em]">Select SKU from Catalog</h3>
                        <p className="text-sm font-medium mt-2">Choose a product to view its manufacturing DNA.</p>
                    </div>
                )}

            </div>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            
            {/* Smart Calculator Modal */}
            {showCalculator && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-md p-6 shadow-2xl border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-blue-500/10 text-[#3498DB] rounded-xl"><Calculator size={20} /></div>
                            <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">Xisaabiye Farsamo (Calculator)</h3>
                        </div>
                        <p className="text-xs font-semibold text-gray-500 mb-6 leading-relaxed">
                            Halkan geli wadarta guud ee alaabta (tusaale 50kg) iyo tirada xabado ee ay soo saartay (tusaale 46200). System-ka ayaa kuu xisaabinaya inta ay qaadato hal xabo.
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
                                        setNewItem({ ...newItem, quantity: qty });
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
        </div>
    );
}
