// app/manufacturing/products/add/page.tsx - AN-Industory Interactive Recipe & Catalog Builder
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Save, Loader2, Package, Tag, FileText, Layers, Ruler, DollarSign, Plus, Trash2, HelpCircle, Calculator
} from 'lucide-react';
import Toast from '@/components/common/Toast';

interface BomItem {
  id: number;
  materialName: string;
  quantity: number;
  unit: string;
  costPerUnit: number;
}

export default function AddProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Finished Goods',
    unit: 'pcs',
    standardCost: '0.00',
    sellingPrice: '',
  });

  const [materials, setMaterials] = useState<any[]>([]);
  const [bom, setBom] = useState<BomItem[]>([]);
  
  // Calculator State
  const [calculatorRowId, setCalculatorRowId] = useState<number | null>(null);
  const [calcInputs, setCalcInputs] = useState({ totalMaterial: '', totalYield: '' });

  const categories = ['Finished Goods', 'Work in Progress', 'Packaging'];
  const units = ['pcs', 'kg', 'liters', 'packs', 'cartons'];

  // 1. Fetch live raw materials from inventory on mount
  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const res = await fetch('/api/manufacturing/inventory');
        if (res.ok) {
          const data = await res.json();
          // Filter to show raw materials/packaging (anything that isn't already a finished good)
          const rawMaterials = (data.items || []).filter((item: any) => item.category !== 'Finished Goods');
          setMaterials(rawMaterials);
        }
      } catch (e) {
        console.error('Error loading raw stock:', e);
      }
    };
    fetchInventory();
  }, []);

  // 2. Recalculate standard cost in real-time when BOM items change
  useEffect(() => {
    const totalCost = bom.reduce((sum, item) => {
      return sum + (Number(item.quantity) * Number(item.costPerUnit));
    }, 0);
    setFormData(prev => ({ ...prev, standardCost: totalCost.toFixed(2) }));
  }, [bom]);

  // BOM Handlers
  const addBomRow = () => {
    setBom([...bom, { id: Date.now(), materialName: '', quantity: 1, unit: 'pcs', costPerUnit: 0 }]);
  };

  const removeBomRow = (id: number) => {
    setBom(bom.filter(row => row.id !== id));
  };

  const handleBomChange = (id: number, field: keyof BomItem, value: any) => {
    setBom(bom.map(row => {
      if (row.id === id) {
        if (field === 'materialName') {
          // Find matching material from inventory list to pull unit and purchase price
          const match = materials.find(m => m.name === value);
          
          let defaultQuantity = match && match.yieldPerMeter ? Number(match.yieldPerMeter) : row.quantity;
          
          // Auto-calculate specifically for 'bac' based on user's exact roll yield (50kg = 46200 bottles)
          if (value.toLowerCase() === 'bac' || value.toLowerCase().includes('bac')) {
            defaultQuantity = 50 / 46200; // 0.00108225...
          }

          return {
            ...row,
            materialName: value,
            unit: match ? match.unit : 'pcs',
            costPerUnit: match ? Number(match.purchasePrice) : 0,
            quantity: defaultQuantity
          };
        }
        return { ...row, [field]: value };
      }
      return row;
    }));
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.name) {
      setToast({ message: 'Shayga magaciisa waa qasab (Product name is required)', type: 'error' });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/manufacturing/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          category: formData.category,
          unit: formData.unit,
          standardCost: parseFloat(formData.standardCost) || 0,
          sellingPrice: parseFloat(formData.sellingPrice) || 0,
          bom: bom.map(item => ({
            materialName: item.materialName,
            quantity: Number(item.quantity),
            unit: item.unit,
            costPerUnit: Number(item.costPerUnit)
          }))
        })
      });

      if (response.ok) {
        setToast({ message: 'Alaabta iyo Karinteeda (BOM) waa la kaydiyey!', type: 'success' });
        setTimeout(() => router.push('/manufacturing/products'), 1500);
      } else {
        const errorData = await response.json();
        setToast({ message: errorData.message || 'Cilad ayaa dhacday!', type: 'error' });
      }
    } catch (err: any) {
      console.error(err);
      setToast({ message: 'Cilad dhinaca xiriirka ah ayaa dhacday.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-8 min-h-screen pb-24 relative z-10">
      {/* Background Glassy Ambient Blobs */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[45%] h-[45%] bg-blue-500/10 rounded-full blur-[130px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[45%] h-[45%] bg-emerald-500/10 rounded-full blur-[130px] animate-pulse" style={{ animationDelay: '3s' }} />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/manufacturing/products" className="p-3 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-2xl border border-white/40 dark:border-gray-700/40 shadow-xl text-gray-500 hover:text-[#3498DB] transition-all">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Add New Product</h1>
            <p className="text-[10px] font-black text-[#3498DB] uppercase tracking-[0.2em]">AN-Industory Catalog Engine</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Workspace */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Basic Information */}
          <div className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-3xl p-8 rounded-3xl border border-white/50 dark:border-gray-700/50 shadow-2xl">
            <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest mb-6 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-500/10 text-[#3498DB]"><Package size={16} /></div>
              Basic Information
            </h3>

            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2.5">Product Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Caagad Biyo ah 1.5L"
                  className="w-full text-sm font-semibold p-4 rounded-2xl border border-white/40 dark:border-gray-700/40 bg-white/60 dark:bg-gray-900/60 backdrop-blur-md outline-none focus:ring-4 focus:ring-blue-500/10 transition-all shadow-inner"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2.5">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Xogta farsamo ama tafaasiisha ku saabsan alaabtan..."
                  rows={3}
                  className="w-full text-sm font-semibold p-4 rounded-2xl border border-white/40 dark:border-gray-700/40 bg-white/60 dark:bg-gray-900/60 backdrop-blur-md outline-none focus:ring-4 focus:ring-blue-500/10 transition-all shadow-inner resize-none"
                />
              </div>
            </div>
          </div>

          {/* Dynamic Recipe (BOM) Builder Section */}
          <div className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-3xl p-8 rounded-3xl border border-white/50 dark:border-gray-700/50 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500"><Layers size={16} /></div>
                Bill of Materials (BOM) / Recipe
              </h3>
              <button
                type="button"
                onClick={addBomRow}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg shadow-purple-600/20 active:scale-95"
              >
                <Plus size={14} /> Add Ingredient
              </button>
            </div>

            {bom.length === 0 ? (
              <div className="p-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl flex flex-col items-center justify-center text-center gap-3 bg-white/10">
                <Layers size={36} className="text-gray-400 animate-pulse" />
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Madan yahay: Halkan ku dar maaddooyinka soosaarka.</p>
                <button
                  type="button"
                  onClick={addBomRow}
                  className="text-xs font-black text-purple-600 hover:underline uppercase tracking-widest"
                >
                  ➕ Click to add first material
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[9px] font-black uppercase text-gray-400 border-b border-gray-100 dark:border-gray-700 pb-3">
                      <th className="pb-3 pl-3">Material Name</th>
                      <th className="pb-3 text-center w-24">Qty Needed</th>
                      <th className="pb-3 text-center w-20">Unit</th>
                      <th className="pb-3 text-right w-28">Cost per Unit</th>
                      <th className="pb-3 text-right w-28 pr-3">Total Cost</th>
                      <th className="pb-3 w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100/50 dark:divide-gray-700/50">
                    {bom.map((row) => (
                      <tr key={row.id} className="group hover:bg-white/40 dark:hover:bg-gray-900/40 transition-colors">
                        {/* Select Material from Inventory */}
                        <td className="py-4 pl-3">
                          <select
                            required
                            value={row.materialName}
                            onChange={(e) => handleBomChange(row.id, 'materialName', e.target.value)}
                            className="w-full bg-transparent outline-none font-bold text-xs text-gray-900 dark:text-white border-b border-transparent focus:border-purple-500 py-1"
                          >
                            <option value="">Choose material...</option>
                            {materials.map(m => (
                              <option key={m.id} value={m.name}>
                                {m.name} (Stock: {m.inStock} {m.unit})
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Quantity input */}
                        <td className="py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <input
                              type="number"
                              step="any"
                              min="0.000001"
                              value={row.quantity}
                              onChange={(e) => handleBomChange(row.id, 'quantity', parseFloat(e.target.value) || 0)}
                              className="w-24 p-2 bg-white/50 dark:bg-gray-900/50 rounded-xl text-center outline-none font-black text-gray-900 dark:text-white text-xs shadow-inner"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setCalculatorRowId(row.id);
                                setCalcInputs({ totalMaterial: '', totalYield: '' });
                              }}
                              className="p-2 text-[#3498DB] hover:bg-blue-500/10 rounded-lg transition-colors shadow-sm bg-white dark:bg-gray-800"
                              title="Smart Calculator"
                            >
                              <Calculator size={14} />
                            </button>
                          </div>
                        </td>

                        {/* Unit label */}
                        <td className="py-4 text-center text-xs font-bold text-gray-400">
                          {row.unit}
                        </td>

                        {/* Cost per unit */}
                        <td className="py-4 text-right text-xs font-bold text-gray-900 dark:text-white pr-2">
                          {row.costPerUnit.toLocaleString()} <span className="text-[9px] text-gray-400">ETB</span>
                        </td>

                        {/* Row Total Cost */}
                        <td className="py-4 text-right text-xs font-black text-purple-600 dark:text-purple-400 pr-3">
                          {(row.quantity * row.costPerUnit).toLocaleString()} <span className="text-[9px] text-gray-400">ETB</span>
                        </td>

                        {/* Delete row button */}
                        <td className="py-4 text-center">
                          <button
                            type="button"
                            onClick={() => removeBomRow(row.id)}
                            className="text-gray-300 hover:text-rose-500 transition-colors p-2"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - Pricing & Classification */}
        <div className="space-y-8">
          
          {/* Classification */}
          <div className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-3xl p-8 rounded-3xl border border-white/50 dark:border-gray-700/50 shadow-2xl">
            <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest mb-6 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500"><Tag size={16} /></div>
              Classification
            </h3>

            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2.5">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-white/60 dark:bg-gray-900/60 p-4 rounded-2xl border border-white/40 dark:border-gray-700/40 outline-none text-gray-900 dark:text-white text-xs font-bold shadow-inner"
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2.5">Unit of Measure</label>
                <select
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="w-full bg-white/60 dark:bg-gray-900/60 p-4 rounded-2xl border border-white/40 dark:border-gray-700/40 outline-none text-gray-900 dark:text-white text-xs font-bold shadow-inner"
                >
                  {units.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Pricing & Costing */}
          <div className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-3xl p-8 rounded-3xl border border-white/50 dark:border-gray-700/50 shadow-2xl">
            <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest mb-6 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-green-500/10 text-green-600"><DollarSign size={16} /></div>
              Pricing & Costing
            </h3>

            <div className="space-y-6">
              {/* Dynamic Standard Cost */}
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2.5 flex items-center gap-2">
                  Standard Cost
                  <span className="text-[8px] bg-purple-500/10 text-purple-600 px-2 py-0.5 rounded-full font-black">Derived from BOM</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">ETB</span>
                  <input
                    type="text"
                    readOnly
                    value={formData.standardCost}
                    className="w-full text-base font-black pl-12 p-4 rounded-2xl border border-white/40 dark:border-gray-700/40 bg-purple-500/5 text-purple-600 outline-none shadow-inner"
                  />
                </div>
              </div>

              {/* Selling Price */}
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2.5">Selling Price <span className="text-red-500">*</span></label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">ETB</span>
                  <input
                    type="number"
                    required
                    step="any"
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                    placeholder="0.00"
                    className="w-full text-base font-black pl-12 p-4 rounded-2xl border border-white/40 dark:border-gray-700/40 bg-white/60 dark:bg-gray-900/60 backdrop-blur-md outline-none focus:ring-4 focus:ring-blue-500/10 transition-all shadow-inner"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-3xl p-6 rounded-3xl border border-white/50 dark:border-gray-700/50 shadow-2xl">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-[#3498DB] hover:bg-blue-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-blue-500/30 flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              Save Product & Recipe
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="w-full py-4 mt-3 bg-white/60 dark:bg-gray-700/60 text-gray-600 dark:text-gray-300 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-100 transition-colors shadow-inner"
            >
              Cancel
            </button>
          </div>
        </div>
      </form>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Smart Calculator Modal */}
      {calculatorRowId !== null && (
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
                onClick={() => setCalculatorRowId(null)}
                className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-2xl text-[10px] text-gray-500 dark:text-gray-300 font-black uppercase tracking-widest transition-colors"
              >
                Jooji (Cancel)
              </button>
              <button 
                type="button" 
                onClick={() => {
                  const qty = Number(calcInputs.totalMaterial) / Number(calcInputs.totalYield);
                  if (qty > 0) {
                    handleBomChange(calculatorRowId, 'quantity', qty);
                  }
                  setCalculatorRowId(null);
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
