'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
    ArrowLeft, Save, Loader2, ShoppingCart, Calendar, FileText, 
    CheckSquare, Search, BadgeDollarSign, Package, User, Hash,
    Info, Plus, X, Trash2, Calculator, Zap, ChevronDown, Truck
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

export default function RecordPurchasePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [vendors, setVendors] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [items, setItems] = useState<PurchaseItem[]>([
    { id: Math.random().toString(), inventoryItemId: '', materialName: '', quantity: 0, unit: 'pcs', unitPrice: 0, totalPrice: 0 }
  ]);

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

  const fetchVendors = () => {
    fetch('/api/manufacturing/vendors')
      .then(res => res.json())
      .then(data => setVendors(data.vendors || []))
      .catch(err => console.error(err));
  };

  const fetchInventory = () => {
    fetch('/api/manufacturing/inventory')
      .then(res => res.json())
      .then(data => setInventory(data.items || []))
      .catch(err => console.error(err));
  };

  const fetchAccounts = () => {
    fetch('/api/manufacturing/accounting/accounts')
      .then(res => res.json())
      .then(data => {
          setAccounts(data.accounts || []);
          if (data.accounts?.length > 0) {
              setFormData(f => ({ ...f, accountId: data.accounts[0].id }));
          }
      })
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchVendors();
    fetchInventory();
    fetchAccounts();
  }, []);

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
            // Reverse calculate Unit Price
            if (updatedItem.quantity > 0) {
                updatedItem.unitPrice = updatedItem.totalPrice / updatedItem.quantity;
            }
        } else if (field === 'unit' && value === 'meters' && (updatedItem.yieldPerMeter ?? 0) > 0) {
            // If switched to meters and has yield, we might want a different logic 
            // but for now let's keep it simple.
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
    
    // quantity = pieces * yieldPerMeter
    const kgNeeded = pieces * yieldPerMeter;
    handleItemChange(id, 'quantity', Number(kgNeeded.toFixed(2)));
    setToast({ message: `${pieces} xabo waxay u baahan yihiin ${kgNeeded.toFixed(2)} Kg/Mitir.`, type: 'success' });
  };

  const autoCalculatePackaging = () => {
    // Find total bottles produced (Preforms/Caps)
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

    // Identify the bag being purchased
    const bagIndex = items.findIndex(i => i.materialName.toLowerCase().includes('bac') || i.materialName.toLowerCase().includes('bag'));
    
    if (bagIndex === -1) {
        setToast({ message: 'Fadlan safka ku dar Bacda (Packing Bag) marka hore.', type: 'error' });
        return;
    }

    const bagItem = items[bagIndex];
    const cap = bagItem.capacity || 150; // Use bag's specific capacity (50, 100, 150)
    
    let requiredQty = Math.ceil(bottleQty / cap);

    // If unit is meters, use yieldPerMeter
    if (bagItem.unit === 'meters' && bagItem.yieldPerMeter && bagItem.yieldPerMeter > 0) {
        requiredQty = Math.ceil(requiredQty / bagItem.yieldPerMeter);
    }

    handleItemChange(bagItem.id, 'quantity', requiredQty);
    setToast({ message: `Bacadaha xisaabtoodu waa: ${requiredQty} (Xabadii waxay qaadaysaa ${cap}).`, type: 'success' });
  };

  const grandTotal = items.reduce((sum, item) => sum + item.totalPrice, 0) + formData.transportCost + formData.taxAmount + formData.otherCosts;

  const handleCreateVendor = async () => {
    if (!newVendorData.name) return;
    setCreatingVendor(true);
    try {
      const res = await fetch('/api/manufacturing/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newVendorData)
      });
      if (res.ok) {
        setToast({ message: 'Iibiyihii waa lagu daray!', type: 'success' });
        fetchVendors();
        setShowVendorModal(false);
      }
    } catch (e) { console.error(e); } finally { setCreatingVendor(false); }
  };

  const handleCreateMaterial = async () => {
    if (!newMaterialData.name) return;
    setCreatingMaterial(true);
    try {
      const res = await fetch('/api/manufacturing/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMaterialData)
      });
      if (res.ok) {
        setToast({ message: 'Material cusub ayaa lagu daray!', type: 'success' });
        fetchInventory();
        setShowMaterialModal(false);
      }
    } catch (e) { console.error(e); } finally { setCreatingMaterial(false); }
  };

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

      const res = await fetch('/api/manufacturing/material-purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          items: validItems
        })
      });

      if (!res.ok) throw new Error('Cilad ayaa dhacday');

      setToast({ message: 'Dhamaan iibkii waa la xareeyay!', type: 'success' });
      setTimeout(() => router.push('/manufacturing/material-purchases'), 1500);
    } catch (error) { setToast({ message: 'Cilad ayaa dhacday.', type: 'error' }); } finally { setLoading(false); }
  };

  const inputClass = "w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-black text-slate-700 outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500/40 transition-all";

  return (
    <div className="flex flex-col gap-8 p-4 lg:p-8 max-w-[1450px] mx-auto min-h-screen pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
            <Link href="/manufacturing/material-purchases" className="p-3 bg-white rounded-lg shadow-sm border border-slate-200 text-slate-500 hover:text-sky-600 transition-all hover:scale-105 active:scale-95">
                <ArrowLeft size={24} />
            </Link>
            <div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                    <ShoppingCart className="text-sky-600" size={32} />
                    Procurement Hub
                </h1>
                <p className="text-slate-500 font-medium text-sm">Precision ordering for factory components.</p>
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
        {/* Left: Materials Table */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white/70 backdrop-blur-xl p-6 rounded-xl border border-slate-200/50 shadow-lg space-y-8">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-sky-500/10 text-sky-600 rounded-xl"><Package size={20} /></div>
                    <h3 className="text-xl font-black text-slate-900">Purchase Manifest</h3>
                </div>
                <div className="flex gap-3">
                    <button type="button" onClick={() => setShowMaterialModal(true)} className="px-4 py-2 bg-white border border-slate-200 text-slate-500 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all">
                        + New Inventory
                    </button>
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
                                            className={`${inputClass} appearance-none pr-10`}
                                            value={item.inventoryItemId}
                                            onChange={(e) => handleItemChange(item.id, 'inventoryItemId', e.target.value)}
                                            required
                                        >
                                            <option value="">Select Material...</option>
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
                                        className="w-5 h-5 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                                        checked={!item.excludeLandedCost}
                                        onChange={(e) => handleItemChange(item.id, 'excludeLandedCost', !e.target.checked)}
                                        title="Include in Transport/Tax split"
                                    />
                                </td>
                                <td className="px-2 text-right">
                                    <input
                                        type="number"
                                        className={`${inputClass} text-right font-black !bg-emerald-50/50 !border-emerald-100 !text-emerald-700`}
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
                <div className="p-2 bg-sky-500/10 text-sky-600 rounded-lg"><Hash size={20} /></div>
                <h3 className="text-xl font-black text-slate-900">Order Context</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                    <div className="flex justify-between items-center px-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Supplier / Vendor *</label>
                        <button type="button" onClick={() => setShowVendorModal(true)} className="text-[10px] font-black text-emerald-600 hover:underline">+ New</button>
                    </div>
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

        {/* Right Column: Totals */}
        <div className="space-y-6">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl shadow-lg text-white space-y-6 relative overflow-hidden group">
                <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-sky-500/10 rounded-full blur-3xl" />
                <div className="flex items-center gap-3 relative z-10">
                    <div className="p-2 bg-white/10 text-sky-400 rounded-lg"><BadgeDollarSign size={20} /></div>
                    <h3 className="text-xl font-black">Consolidated Cost</h3>
                </div>

                <div className="space-y-4 relative z-10">
                    {/* Landed Costs Section */}
                    <div className="p-4 bg-slate-800 rounded-xl border border-slate-700/50 space-y-4 mb-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Truck size={14} className="text-sky-400" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kharashyada Dheeraadka ah (Landed Costs)</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <div>
                                <label className="text-[9px] font-bold text-slate-500 uppercase">Gaadiid</label>
                                <input type="number" className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-black text-white focus:ring-2 focus:ring-sky-500/50 outline-none" value={formData.transportCost} onChange={(e) => setFormData({...formData, transportCost: parseFloat(e.target.value) || 0})} />
                            </div>
                            <div>
                                <label className="text-[9px] font-bold text-slate-500 uppercase">Canshuur</label>
                                <input type="number" className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-black text-white focus:ring-2 focus:ring-sky-500/50 outline-none" value={formData.taxAmount} onChange={(e) => setFormData({...formData, taxAmount: parseFloat(e.target.value) || 0})} />
                            </div>
                            <div>
                                <label className="text-[9px] font-bold text-slate-500 uppercase">Xamaal/Kale</label>
                                <input type="number" className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-black text-white focus:ring-2 focus:ring-sky-500/50 outline-none" value={formData.otherCosts} onChange={(e) => setFormData({...formData, otherCosts: parseFloat(e.target.value) || 0})} />
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
                            <span className="text-4xl font-black tracking-tighter text-sky-400">
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
                                    className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-sm font-black text-white focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
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

                <button type="submit" disabled={loading} className="w-full py-4 bg-gradient-to-r from-emerald-600 to-sky-600 hover:from-emerald-500 hover:to-sky-500 disabled:from-slate-700 disabled:to-slate-700 text-white rounded-lg font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-sky-600/20 transition-all flex items-center justify-center gap-3 relative z-10 active:scale-95">
                    {loading ? <Loader2 className="animate-spin" /> : <Zap size={20} />}
                    {loading ? 'Processing...' : 'Authorize Procurement'}
                </button>
            </div>
        </div>
      </form>

      {/* New Material Modal */}
      {showMaterialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-8 w-full max-w-md space-y-8 animate-in zoom-in-95 duration-300">
                <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Add to Inventory</h3>
                    <button onClick={() => setShowMaterialModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400"><X size={20} /></button>
                </div>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Material Name</label>
                        <input type="text" className={inputClass} value={newMaterialData.name} onChange={(e) => setNewMaterialData({...newMaterialData, name: e.target.value})} placeholder="e.g. Packing Bag 50pcs" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bag Capacity</label>
                            <select className={inputClass} value={newMaterialData.capacity} onChange={(e) => setNewMaterialData({...newMaterialData, capacity: parseInt(e.target.value)})}>
                                <option value="50">50 items</option>
                                <option value="100">100 items</option>
                                <option value="150">150 items</option>
                                <option value="0">N/A</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Meters to Pcs</label>
                            <input type="number" className={inputClass} value={newMaterialData.yieldPerMeter} onChange={(e) => setNewMaterialData({...newMaterialData, yieldPerMeter: parseFloat(e.target.value) || 0})} placeholder="Yield/m" />
                        </div>
                    </div>
                    <button onClick={handleCreateMaterial} disabled={creatingMaterial} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3">
                        {creatingMaterial ? <Loader2 className="animate-spin" /> : <Save size={18} />} Save to Inventory
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* New Vendor Modal (Same as before) */}
      {showVendorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-8 w-full max-w-md space-y-8 animate-in zoom-in-95 duration-300">
                <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Onboard Partner</h3>
                    <button onClick={() => setShowVendorModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400"><X size={20} /></button>
                </div>
                <div className="space-y-6">
                    <input type="text" placeholder="Company Name" className={inputClass} value={newVendorData.name} onChange={(e) => setNewVendorData({...newVendorData, name: e.target.value})} />
                    <button onClick={handleCreateVendor} disabled={creatingVendor} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3">
                        {creatingVendor ? <Loader2 className="animate-spin" /> : <Save size={18} />} Confirm Partner
                    </button>
                </div>
            </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}