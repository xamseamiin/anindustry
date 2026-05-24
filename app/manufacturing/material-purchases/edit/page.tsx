'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
    ArrowLeft, Save, Loader2, ShoppingCart, Calendar, FileText, 
    CheckSquare, Search, BadgeDollarSign, Package, User, Hash,
    Info, Plus, X, Trash2, Calculator, Zap, ChevronDown, Truck, Edit
} from 'lucide-react';
import Toast from '@/components/common/Toast';
import { Wallet } from 'lucide-react';

interface PurchaseItem {
    id: string;
    inventoryItemId: string;
    materialName: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    totalPrice: number;
    capacity?: number;
    yieldPerMeter?: number;
    excludeLandedCost?: boolean;
}

function EditPurchaseContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchStr = searchParams?.get('search') || '';

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [vendors, setVendors] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [oldPurchaseIds, setOldPurchaseIds] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    vendorId: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    invoiceNumber: '',
    notes: '',
    updateInventory: true,
    paidAmount: 0,
    accountId: '',
    transportCost: 0,
    taxAmount: 0,
    otherCosts: 0
  });

  const [showVendorModal, setShowVendorModal] = useState(false);
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [newVendorData, setNewVendorData] = useState({ name: '', type: 'Material' });
  const [newMaterialData, setNewMaterialData] = useState({ name: '', category: 'Raw Material', unit: 'pcs', capacity: 150, yieldPerMeter: 0 });
  
  const [creatingVendor, setCreatingVendor] = useState(false);
  const [creatingMaterial, setCreatingMaterial] = useState(false);

  useEffect(() => {
    fetchVendors();
    fetchInventory();
    fetchAccounts();
    if (searchStr) {
        fetchBatch();
    } else {
        setFetching(false);
    }
  }, [searchStr]);

  const fetchVendors = () => fetch('/api/manufacturing/vendors').then(res => res.json()).then(data => setVendors(data.vendors || []));
  const fetchInventory = () => fetch('/api/manufacturing/inventory').then(res => res.json()).then(data => setInventory(data.items || []));
  const fetchAccounts = () => fetch('/api/manufacturing/accounting/accounts').then(res => res.json()).then(data => setAccounts(data.accounts || []));

  const fetchBatch = async () => {
    try {
        const res = await fetch(`/api/manufacturing/material-purchases/batch?search=${searchStr}`);
        if (res.ok) {
            const data = await res.json();
            const b = data.batch;
            setOldPurchaseIds(b.oldPurchaseIds);
            setFormData({
                vendorId: b.vendorId,
                purchaseDate: b.purchaseDate,
                invoiceNumber: b.invoiceNumber,
                notes: b.notes,
                updateInventory: true,
                paidAmount: b.paidAmount,
                accountId: b.accountId || '',
                transportCost: b.transportCost,
                taxAmount: b.taxAmount,
                otherCosts: b.otherCosts
            });
            
            // Map items
            const mappedItems = b.items.map((i: any) => ({
                id: i.id,
                inventoryItemId: '', // Will be mapped down below if matched
                materialName: i.materialName,
                quantity: i.quantity,
                unit: i.unit,
                unitPrice: i.unitPrice,
                totalPrice: i.totalPrice,
                excludeLandedCost: i.excludeLandedCost
            }));
            setItems(mappedItems);
        } else {
            setToast({ message: 'Lama helin dalabkan.', type: 'error' });
        }
    } catch (e) {
        console.error(e);
    } finally {
        setFetching(false);
    }
  };

  // Once inventory is loaded, try to match inventoryItemId for fetched items
  useEffect(() => {
    if (items.length > 0 && inventory.length > 0) {
        setItems(prev => prev.map(item => {
            if (!item.inventoryItemId) {
                const inv = inventory.find(i => i.name === item.materialName);
                if (inv) {
                    return { ...item, inventoryItemId: inv.id, capacity: inv.capacity, yieldPerMeter: inv.yieldPerMeter };
                }
            }
            return item;
        }));
    }
  }, [inventory, fetching]);

  const handleAddItem = () => {
    setItems([...items, { id: Math.random().toString(), inventoryItemId: '', materialName: '', quantity: 0, unit: 'pcs', unitPrice: 0, totalPrice: 0 }]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length === 1) return;
    setItems(items.filter(item => item.id !== id));
  };

  const handleItemChange = (id: string, field: keyof PurchaseItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        let updatedItem = { ...item, [field]: value };
        
        // Handle Inventory Selection
        if (field === 'inventoryItemId') {
            const selected = inventory.find(i => i.id === value);
            if (selected) {
                updatedItem.materialName = selected.name;
                updatedItem.unit = selected.unit;
                updatedItem.capacity = selected.capacity;
                updatedItem.yieldPerMeter = selected.yieldPerMeter;
                updatedItem.unitPrice = selected.purchasePrice;
            }
        }

        // Calculation Logic
        if (field === 'quantity' || field === 'unitPrice') {
            updatedItem.totalPrice = updatedItem.quantity * updatedItem.unitPrice;
        } else if (field === 'totalPrice') {
            if (updatedItem.quantity > 0) {
                updatedItem.unitPrice = updatedItem.totalPrice / updatedItem.quantity;
            }
        }

        return updatedItem;
      }
      return item;
    }));
  };

  const calculateRowFromPieces = (id: string, yieldPerMeter: number) => {
    const piecesStr = window.prompt("Geli tirada xabado (pieces) aad rabto inaad samayso:");
    if (!piecesStr) return;
    const pieces = parseFloat(piecesStr);
    if (isNaN(pieces) || pieces <= 0) return;
    
    const kgNeeded = pieces * yieldPerMeter;
    handleItemChange(id, 'quantity', Number(kgNeeded.toFixed(2)));
    setToast({ message: `${pieces} xabo waxay u baahan yihiin ${kgNeeded.toFixed(2)} Kg/Mitir.`, type: 'success' });
  };

  const autoCalculatePackaging = () => {
    const bottleQty = items.reduce((max, item) => {
        const name = item.materialName.toLowerCase();
        if (name.includes('preform') || name.includes('cap') || name.includes('fur') || name.includes('caag')) {
            return Math.max(max, item.quantity);
        }
        return max;
    }, 0);

    if (bottleQty === 0) {
        setToast({ message: 'Fadlan geli tirada Caagadaha ama Furarka marka hore.', type: 'error' });
        return;
    }

    const bagIndex = items.findIndex(i => i.materialName.toLowerCase().includes('bac') || i.materialName.toLowerCase().includes('bag'));
    if (bagIndex === -1) {
        setToast({ message: 'Fadlan safka ku dar Bacda (Packing Bag) marka hore.', type: 'error' });
        return;
    }

    const bagItem = items[bagIndex];
    const cap = bagItem.capacity || 150; 
    let requiredQty = Math.ceil(bottleQty / cap);

    if (bagItem.unit === 'meters' && bagItem.yieldPerMeter && bagItem.yieldPerMeter > 0) {
        requiredQty = Math.ceil(requiredQty / bagItem.yieldPerMeter);
    }

    handleItemChange(bagItem.id, 'quantity', requiredQty);
    setToast({ message: `Bacadaha xisaabtoodu waa: ${requiredQty} (Xabadii waxay qaadaysaa ${cap}).`, type: 'success' });
  };

  const grandTotal = items.reduce((sum, item) => sum + item.totalPrice, 0) + formData.transportCost + formData.taxAmount + formData.otherCosts;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.vendorId) {
      setToast({ message: 'Fadlan dooro suplayer-ka.', type: 'error' });
      setLoading(false);
      return;
    }

    try {
      const validItems = items.filter(i => i.materialName && i.quantity > 0);
      if (validItems.length === 0) {
        setToast({ message: 'Fadlan dooro ugu yaraan hal shey.', type: 'error' });
        setLoading(false);
        return;
      }

      const res = await fetch('/api/manufacturing/material-purchases/edit-batch', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldPurchaseIds,
          ...formData,
          items: validItems
        })
      });

      if (!res.ok) throw new Error('Cilad ayaa dhacday');

      setToast({ message: 'Dalabkii waa la saxay!', type: 'success' });
      setTimeout(() => router.push('/manufacturing/material-purchases'), 1500);
    } catch (error) { setToast({ message: 'Cilad ayaa dhacday.', type: 'error' }); } finally { setLoading(false); }
  };

  const inputClass = "w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-black text-slate-700 outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500/40 transition-all";

  if (fetching) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-sky-500" size={32} /></div>;

  return (
    <div className="flex flex-col gap-8 p-4 lg:p-8 max-w-[1450px] mx-auto min-h-screen pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
            <Link href="/manufacturing/material-purchases" className="p-3 bg-white rounded-lg shadow-sm border border-slate-200 text-slate-500 hover:text-sky-600 transition-all hover:scale-105 active:scale-95">
                <ArrowLeft size={24} />
            </Link>
            <div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                    <Edit className="text-amber-500" size={32} />
                    Edit Purchase Batch
                </h1>
                <p className="text-slate-500 font-medium text-sm">Dib u sax dalabkii hore oo ku dar ama ka jar alaab/kharash.</p>
            </div>
        </div>

        <button 
            type="button"
            onClick={autoCalculatePackaging}
            className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-sky-600 text-white rounded-lg font-black text-xs uppercase tracking-widest flex items-center gap-3 shadow-lg shadow-sky-600/20 hover:shadow-xl transition-all active:scale-95"
        >
            <Calculator size={18} />
            Smart Auto-Calculate
        </button>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white/70 backdrop-blur-xl p-6 rounded-xl border border-slate-200/50 shadow-lg space-y-8">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl"><Package size={20} /></div>
                    <h3 className="text-xl font-black text-slate-900">Purchase Manifest</h3>
                </div>
                <div className="flex gap-3">
                    <button type="button" onClick={handleAddItem} className="p-2 bg-gradient-to-r from-emerald-600 to-sky-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all">
                        <Plus size={20} />
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full border-separate border-spacing-y-4">
                    <thead>
                        <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                            <th className="px-4 text-left">Component / Inventory</th>
                            <th className="px-4 text-left w-36">Quantity</th>
                            <th className="px-4 text-left w-24">Unit</th>
                            <th className="px-4 text-left w-40">Unit Price</th>
                            <th className="px-4 text-center w-24">Landed Cost</th>
                            <th className="px-4 text-right w-48">Batch Total</th>
                            <th className="px-4 w-12"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, index) => (
                            <tr key={item.id} className="group animate-in fade-in slide-in-from-left duration-300">
                                <td className="px-2">
                                    <div className="relative group/sel">
                                        <select
                                            className={`${inputClass} appearance-none pr-10 ${!item.inventoryItemId ? 'border-amber-400 bg-amber-50' : ''}`}
                                            value={item.inventoryItemId}
                                            onChange={(e) => handleItemChange(item.id, 'inventoryItemId', e.target.value)}
                                            required
                                        >
                                            {item.inventoryItemId ? <option value="">Select Material...</option> : <option value="">{item.materialName} (Missing from Inv)</option>}
                                            {inventory.map(i => <option key={i.id} value={i.id}>{i.name} ({i.capacity ? `${i.capacity}pcs` : i.unit})</option>)}
                                        </select>
                                        <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    </div>
                                </td>
                                <td className="px-2">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            className={inputClass}
                                            value={item.quantity}
                                            onChange={(e) => handleItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                                        />
                                        {item.yieldPerMeter && item.yieldPerMeter > 0 ? (
                                            <button 
                                                type="button" 
                                                onClick={() => calculateRowFromPieces(item.id, item.yieldPerMeter!)}
                                                className="p-3 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl transition-all"
                                                title="Xisaabi inta kg/Mitir adigoo gelinaya Tirada Xabo (Pieces)"
                                            >
                                                <Calculator size={18} />
                                            </button>
                                        ) : null}
                                    </div>
                                </td>
                                <td className="px-2">
                                    <select
                                        className={inputClass}
                                        value={item.unit}
                                        onChange={(e) => handleItemChange(item.id, 'unit', e.target.value)}
                                    >
                                        <option value="pcs">pcs</option>
                                        <option value="kg">kg</option>
                                        <option value="l">l</option>
                                        <option value="meters">meters</option>
                                        <option value="box">box</option>
                                    </select>
                                </td>
                                <td className="px-2">
                                    <input
                                        type="number"
                                        className={inputClass}
                                        value={item.unitPrice}
                                        onChange={(e) => handleItemChange(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                                    />
                                </td>
                                <td className="px-2 text-center">
                                    <input
                                        type="checkbox"
                                        className="w-5 h-5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                                        checked={!item.excludeLandedCost}
                                        onChange={(e) => handleItemChange(item.id, 'excludeLandedCost', !e.target.checked)}
                                        title="Include in Transport/Tax split"
                                    />
                                </td>
                                <td className="px-2 text-right">
                                    <input
                                        type="number"
                                        className={`${inputClass} text-right font-black !bg-amber-50/50 !border-amber-100 !text-amber-700`}
                                        value={item.totalPrice}
                                        onChange={(e) => handleItemChange(item.id, 'totalPrice', parseFloat(e.target.value) || 0)}
                                    />
                                </td>
                                <td className="px-2 text-center">
                                    <button 
                                        type="button" 
                                        onClick={() => handleRemoveItem(item.id)}
                                        className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-xl p-6 rounded-xl border border-slate-200/50 shadow-lg space-y-8">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="p-2 bg-amber-500/10 text-amber-600 rounded-lg"><Hash size={20} /></div>
                <h3 className="text-xl font-black text-slate-900">Order Context</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Supplier / Vendor *</label>
                    <select className={inputClass} value={formData.vendorId} onChange={(e) => setFormData({...formData, vendorId: e.target.value})} required>
                        <option value="">Select Partner...</option>
                        {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Purchase Date</label>
                    <input type="date" className={inputClass} value={formData.purchaseDate} onChange={(e) => setFormData({...formData, purchaseDate: e.target.value})} />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Invoice / Ref #</label>
                    <input type="text" placeholder="REF-XXX" className={inputClass} value={formData.invoiceNumber} onChange={(e) => setFormData({...formData, invoiceNumber: e.target.value})} />
                </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl shadow-lg text-white space-y-6 relative overflow-hidden group">
                <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-amber-500/10 rounded-full blur-3xl" />
                <div className="flex items-center gap-3 relative z-10">
                    <div className="p-2 bg-white/10 text-amber-400 rounded-lg"><BadgeDollarSign size={20} /></div>
                    <h3 className="text-xl font-black">Consolidated Cost</h3>
                </div>

                <div className="space-y-4 relative z-10">
                    <div className="p-4 bg-slate-800 rounded-xl border border-slate-700/50 space-y-4 mb-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Truck size={14} className="text-amber-400" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kharashyada Dheeraadka ah (Landed Costs)</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <div>
                                <label className="text-[9px] font-bold text-slate-500 uppercase">Gaadiid</label>
                                <input type="number" className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-black text-white focus:ring-2 focus:ring-amber-500/50 outline-none" value={formData.transportCost} onChange={(e) => setFormData({...formData, transportCost: parseFloat(e.target.value) || 0})} />
                            </div>
                            <div>
                                <label className="text-[9px] font-bold text-slate-500 uppercase">Canshuur</label>
                                <input type="number" className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-black text-white focus:ring-2 focus:ring-amber-500/50 outline-none" value={formData.taxAmount} onChange={(e) => setFormData({...formData, taxAmount: parseFloat(e.target.value) || 0})} />
                            </div>
                            <div>
                                <label className="text-[9px] font-bold text-slate-500 uppercase">Xamaal/Kale</label>
                                <input type="number" className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-black text-white focus:ring-2 focus:ring-amber-500/50 outline-none" value={formData.otherCosts} onChange={(e) => setFormData({...formData, otherCosts: parseFloat(e.target.value) || 0})} />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between items-center opacity-60">
                        <span className="text-[10px] font-black uppercase tracking-widest">Items Selected</span>
                        <span className="text-sm font-black font-mono">{items.length} SKUs</span>
                    </div>
                    <div className="flex flex-col pt-4 border-t border-white/10 space-y-4">
                        <div>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1 block">Grand Total Payable</span>
                            <span className="text-4xl font-black tracking-tighter text-amber-400">
                                {grandTotal.toLocaleString()} <span className="text-sm text-slate-500 font-bold ml-1">ETB</span>
                            </span>
                        </div>
                        
                        <div className="p-4 bg-slate-800 rounded-xl border border-slate-700/50 space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Wallet size={12} /> Paid Amount (Bixis)
                                </label>
                                <input 
                                    type="number" 
                                    className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-sm font-black text-white focus:ring-2 focus:ring-amber-500/50 outline-none transition-all"
                                    value={formData.paidAmount}
                                    onChange={(e) => setFormData({...formData, paidAmount: parseFloat(e.target.value) || 0})}
                                />
                            </div>
                            
                            {formData.paidAmount > 0 && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Paid From (Koontada)</label>
                                    <select 
                                        className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-sm font-black text-white outline-none"
                                        value={formData.accountId}
                                        onChange={(e) => setFormData({...formData, accountId: e.target.value})}
                                    >
                                        <option value="">Select Account...</option>
                                        {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                    </select>
                                </div>
                            )}

                            {grandTotal - formData.paidAmount > 0 && (
                                <div className="pt-2 border-t border-slate-700 flex justify-between items-center">
                                    <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Debt Remaining</span>
                                    <span className="text-sm font-black text-rose-400">
                                        {(grandTotal - formData.paidAmount).toLocaleString()} ETB
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <button type="submit" disabled={loading} className="w-full py-4 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:from-slate-700 disabled:to-slate-700 text-white rounded-lg font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-amber-600/20 transition-all flex items-center justify-center gap-3 relative z-10 active:scale-95">
                    {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                    {loading ? 'Processing...' : 'Save Updated Batch'}
                </button>
            </div>
        </div>
      </form>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default function EditPurchasePage() {
    return (
        <Suspense fallback={<div className="p-12 flex justify-center"><Loader2 className="animate-spin text-sky-500" size={32} /></div>}>
            <EditPurchaseContent />
        </Suspense>
    );
}
