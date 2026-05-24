'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Package, Edit3, Save, Trash2, X, Loader2, AlertTriangle,
  MapPin, Ruler, Calculator, Tag, Hash, DollarSign, Layers, Box,
  CheckCircle, Boxes, Activity
} from 'lucide-react';
import Toast from '@/components/common/Toast';

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  description: string | null;
  unit: string;
  inStock: number;
  minStock: number;
  purchasePrice: number;
  sellingPrice: number;
  capacity: number | null;
  yieldPerMeter: number | null;
  location: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function InventoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [item, setItem] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Edit form state
  const [form, setForm] = useState<any>({});

  const fetchItem = useCallback(async () => {
    try {
      const res = await fetch(`/api/manufacturing/inventory/${id}`);
      if (res.ok) {
        const data = await res.json();
        setItem(data.item);
        setForm({ ...data.item });
      } else {
        setToast({ message: 'Item not found', type: 'error' });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchItem(); }, [fetchItem]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/manufacturing/inventory/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        const data = await res.json();
        setItem(data.item);
        setForm({ ...data.item });
        setEditing(false);
        setToast({ message: 'Waa la cusboonaysiiyay!', type: 'success' });
      } else {
        const err = await res.json();
        setToast({ message: err.message || 'Cilad', type: 'error' });
      }
    } catch (e) {
      setToast({ message: 'Cilad ayaa dhacday', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/manufacturing/inventory/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setToast({ message: 'Waa la tirtiray!', type: 'success' });
        setTimeout(() => router.push('/manufacturing/inventory'), 1000);
      } else {
        setToast({ message: 'Cilad tirtiridda', type: 'error' });
      }
    } catch (e) {
      setToast({ message: 'Cilad', type: 'error' });
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const updateForm = (key: string, value: any) => {
    setForm((prev: any) => ({ ...prev, [key]: value }));
  };

  const inputClass = "w-full px-4 py-3 border border-slate-200/60 bg-white/50 rounded-xl text-sm font-black text-slate-900 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all";
  const labelClass = "block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2";

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <Loader2 className="animate-spin text-sky-500" size={48} />
        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Loading Item...</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6">
        <AlertTriangle size={64} className="text-rose-400" />
        <h2 className="text-2xl font-black text-slate-900">Item Not Found</h2>
        <Link href="/manufacturing/inventory" className="text-sky-600 font-black text-sm hover:underline">← Back to Inventory</Link>
      </div>
    );
  }

  const totalValue = item.inStock * item.purchasePrice;
  const stockStatus = item.inStock === 0 ? 'Critical' : item.inStock <= item.minStock ? 'Low' : 'Good';
  const stockPercent = item.minStock > 0 ? Math.min(100, (item.inStock / (item.minStock * 3)) * 100) : 100;

  return (
    <div className="flex flex-col gap-8 p-4 lg:p-8 max-w-[1400px] mx-auto min-h-screen pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <Link href="/manufacturing/inventory" className="p-3 bg-white rounded-xl shadow-sm border border-slate-200 text-slate-500 hover:text-sky-600 transition-all hover:scale-105 active:scale-95">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <p className="text-[10px] font-black text-sky-600 uppercase tracking-widest mb-1">Raw Material Detail</p>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <Package className="text-sky-600" size={32} />
              {editing ? (
                <input value={form.name} onChange={(e) => updateForm('name', e.target.value)} className="text-3xl font-black text-slate-900 bg-transparent border-b-2 border-sky-400 outline-none pb-1 w-full max-w-md" />
              ) : item.name}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {editing ? (
            <>
              <button onClick={() => { setEditing(false); setForm({ ...item }); }} className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-600 transition-colors flex items-center gap-2 border border-slate-200/60">
                <X size={16} /> Ka Noqo
              </button>
              <button onClick={handleSave} disabled={saving} className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-sky-600 hover:from-emerald-500 hover:to-sky-500 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-sky-600/20 disabled:opacity-50 active:scale-95 transition-all">
                {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                {saving ? 'Kaydinaya...' : 'Kaydi'}
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setEditing(true)} className="px-5 py-3 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-600 text-[10px] font-black uppercase tracking-wider flex items-center gap-2 border border-sky-200/40 transition-colors">
                <Edit3 size={16} /> Wax Ka Beddel
              </button>
              <button onClick={() => setShowDeleteModal(true)} className="px-5 py-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-[10px] font-black uppercase tracking-wider flex items-center gap-2 border border-rose-200/40 transition-colors">
                <Trash2 size={16} /> Tirtir
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white/70 backdrop-blur-xl p-6 rounded-2xl border border-sky-100 shadow-sm flex items-center gap-5 group hover:shadow-md transition-all">
          <div className="p-3.5 bg-sky-500/10 text-sky-600 rounded-xl group-hover:scale-110 transition-transform">
            <Boxes size={28} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">In Stock</p>
            <p className="text-2xl font-black text-slate-900 leading-none mt-1.5">
              {editing ? (
                <input type="number" value={form.inStock} onChange={(e) => updateForm('inStock', e.target.value)} className="text-2xl font-black text-slate-900 bg-transparent border-b-2 border-sky-400 outline-none w-32" />
              ) : item.inStock.toLocaleString()} <span className="text-xs text-slate-400 font-bold">{item.unit}</span>
            </p>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-xl p-6 rounded-2xl border border-emerald-100 shadow-sm flex items-center gap-5 group hover:shadow-md transition-all">
          <div className="p-3.5 bg-emerald-500/10 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform">
            <DollarSign size={28} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Purchase Price</p>
            <p className="text-2xl font-black text-slate-900 leading-none mt-1.5">
              {editing ? (
                <input type="number" value={form.purchasePrice} onChange={(e) => updateForm('purchasePrice', e.target.value)} className="text-2xl font-black text-slate-900 bg-transparent border-b-2 border-emerald-400 outline-none w-32" />
              ) : item.purchasePrice.toLocaleString()} <span className="text-xs text-slate-400 font-bold">ETB</span>
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl shadow-lg flex items-center gap-5 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-24 h-24 bg-sky-500/10 rounded-full blur-2xl" />
          <div className="p-3.5 bg-white/10 text-sky-400 rounded-xl">
            <Activity size={28} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Value</p>
            <p className="text-2xl font-black text-white leading-none mt-1.5">{totalValue.toLocaleString()} <span className="text-xs text-slate-500 font-bold">ETB</span></p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Item Details */}
          <div className="bg-white/70 backdrop-blur-xl p-8 rounded-2xl border border-slate-200/50 shadow-lg">
            <div className="flex items-center gap-3 pb-5 mb-6 border-b border-slate-100">
              <div className="p-2 bg-sky-500/10 text-sky-600 rounded-xl"><Tag size={20} /></div>
              <h3 className="text-xl font-black text-slate-900">Faahfaahinta Alaabta</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>Magaca (Name)</label>
                {editing ? (
                  <input value={form.name} onChange={(e) => updateForm('name', e.target.value)} className={inputClass} />
                ) : (
                  <p className="text-sm font-black text-slate-900">{item.name}</p>
                )}
              </div>
              <div>
                <label className={labelClass}>SKU Code</label>
                {editing ? (
                  <input value={form.sku || ''} onChange={(e) => updateForm('sku', e.target.value)} className={inputClass} />
                ) : (
                  <p className="text-sm font-bold text-slate-600">{item.sku || 'N/A'}</p>
                )}
              </div>
              <div>
                <label className={labelClass}>Qaybta (Category)</label>
                {editing ? (
                  <select value={form.category} onChange={(e) => updateForm('category', e.target.value)} className={inputClass}>
                    <option>Raw Material</option>
                    <option>Packaging</option>
                    <option>Finished Goods</option>
                    <option>Chemical</option>
                    <option>Other</option>
                  </select>
                ) : (
                  <span className="px-3 py-1.5 rounded-lg bg-sky-50 text-sky-700 text-xs font-black">{item.category}</span>
                )}
              </div>
              <div>
                <label className={labelClass}>Halbeegga (Unit)</label>
                {editing ? (
                  <select value={form.unit} onChange={(e) => updateForm('unit', e.target.value)} className={inputClass}>
                    <option>KG</option>
                    <option>Liter</option>
                    <option>Meter</option>
                    <option>Piece</option>
                    <option>Roll</option>
                    <option>Box</option>
                    <option>Bag</option>
                  </select>
                ) : (
                  <p className="text-sm font-bold text-slate-600">{item.unit}</p>
                )}
              </div>
              <div>
                <label className={labelClass}>Goobta (Location)</label>
                {editing ? (
                  <input value={form.location || ''} onChange={(e) => updateForm('location', e.target.value)} className={inputClass} placeholder="e.g. Warehouse A" />
                ) : (
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
                    <MapPin size={14} className="text-slate-400" /> {item.location || 'Not specified'}
                  </div>
                )}
              </div>
              <div>
                <label className={labelClass}>Min Stock Alert</label>
                {editing ? (
                  <input type="number" value={form.minStock} onChange={(e) => updateForm('minStock', e.target.value)} className={inputClass} />
                ) : (
                  <p className="text-sm font-bold text-slate-600">{item.minStock} {item.unit}</p>
                )}
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Sharaxaad (Description)</label>
                {editing ? (
                  <textarea value={form.description || ''} onChange={(e) => updateForm('description', e.target.value)} rows={3} className={inputClass} placeholder="Description..." />
                ) : (
                  <p className="text-sm text-slate-500 font-medium">{item.description || 'No description'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Specs Card */}
          <div className="bg-white/70 backdrop-blur-xl p-8 rounded-2xl border border-slate-200/50 shadow-lg">
            <div className="flex items-center gap-3 pb-5 mb-6 border-b border-slate-100">
              <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-xl"><Calculator size={20} /></div>
              <h3 className="text-xl font-black text-slate-900">Production Specs</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-5 bg-slate-50/80 rounded-xl border border-slate-100">
                <label className={labelClass}>Bag Capacity</label>
                {editing ? (
                  <input type="number" value={form.capacity || ''} onChange={(e) => updateForm('capacity', e.target.value)} className={inputClass} placeholder="e.g. 150" />
                ) : (
                  <p className="text-2xl font-black text-slate-900">{item.capacity || 'N/A'}</p>
                )}
                <p className="text-[10px] text-slate-400 font-bold mt-1">Pieces per bag</p>
              </div>
              <div className="p-5 bg-slate-50/80 rounded-xl border border-slate-100">
                <label className={labelClass}>Yield Per Meter</label>
                {editing ? (
                  <input type="number" step="any" value={form.yieldPerMeter || ''} onChange={(e) => updateForm('yieldPerMeter', e.target.value)} className={inputClass} placeholder="e.g. 5.2" />
                ) : (
                  <p className="text-2xl font-black text-slate-900">{item.yieldPerMeter || 'N/A'}</p>
                )}
                <p className="text-[10px] text-slate-400 font-bold mt-1">pcs/meter</p>
              </div>
              <div className="p-5 bg-slate-50/80 rounded-xl border border-slate-100">
                <label className={labelClass}>Selling Price</label>
                {editing ? (
                  <input type="number" step="any" value={form.sellingPrice || ''} onChange={(e) => updateForm('sellingPrice', e.target.value)} className={inputClass} />
                ) : (
                  <p className="text-2xl font-black text-emerald-600">{item.sellingPrice?.toLocaleString() || '0'} <span className="text-xs text-slate-400">ETB</span></p>
                )}
                <p className="text-[10px] text-slate-400 font-bold mt-1">Per {item.unit}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Stock Status */}
          <div className="bg-white/70 backdrop-blur-xl p-8 rounded-2xl border border-slate-200/50 shadow-lg">
            <div className="flex items-center gap-3 pb-5 mb-6 border-b border-slate-100">
              <div className={`p-2 rounded-xl ${stockStatus === 'Good' ? 'bg-emerald-500/10 text-emerald-600' : stockStatus === 'Low' ? 'bg-amber-500/10 text-amber-600' : 'bg-rose-500/10 text-rose-600'}`}>
                {stockStatus === 'Good' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
              </div>
              <h3 className="text-xl font-black text-slate-900">Xaaladda Stock-ka</h3>
            </div>

            <div className="text-center mb-6">
              <span className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider ${
                stockStatus === 'Good' ? 'bg-emerald-100 text-emerald-700' :
                stockStatus === 'Low' ? 'bg-amber-100 text-amber-700' :
                'bg-rose-100 text-rose-700'
              }`}>
                {stockStatus === 'Good' ? '✓ Ku Filan' : stockStatus === 'Low' ? '⚠ Hooseeya' : '✕ Aad u Hooseeya'}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">
                <span>Stock Level</span>
                <span>{Math.round(stockPercent)}%</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    stockStatus === 'Good' ? 'bg-gradient-to-r from-emerald-500 to-sky-500' :
                    stockStatus === 'Low' ? 'bg-gradient-to-r from-amber-400 to-amber-500' :
                    'bg-gradient-to-r from-rose-400 to-rose-500'
                  }`}
                  style={{ width: `${stockPercent}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="p-4 bg-sky-50/60 rounded-xl text-center border border-sky-100">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Current</p>
                <p className="text-lg font-black text-sky-600 mt-1">{item.inStock.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-rose-50/60 rounded-xl text-center border border-rose-100">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Min Required</p>
                <p className="text-lg font-black text-rose-600 mt-1">{item.minStock.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Quick Info */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-2xl shadow-lg text-white relative overflow-hidden">
            <div className="absolute right-0 top-0 w-32 h-32 bg-sky-500/10 rounded-full blur-3xl" />
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-6">Quick Info</h3>
            <div className="space-y-4 relative z-10">
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Category</span>
                <span className="text-xs font-black text-sky-400">{item.category}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Unit</span>
                <span className="text-xs font-black text-white">{item.unit}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Value/Unit</span>
                <span className="text-xs font-black text-emerald-400">{item.purchasePrice.toLocaleString()} ETB</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Value</span>
                <span className="text-sm font-black text-sky-400">{totalValue.toLocaleString()} ETB</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-400/30 backdrop-blur-xl z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md p-8 bg-white/80 backdrop-blur-2xl rounded-2xl border border-white/60 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-rose-500/10 text-rose-600 rounded-xl">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Ma hubtaa inaad tirtirto?</h3>
                <p className="text-slate-500 font-bold text-xs">{item.name} — waa la tirtiri doonaa</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 mb-6">
              Tani dib looma celin karto. Dhammaan xogta ku xiran materialkan waa la tirtiri doonaa.
            </p>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200/40">
              <button onClick={() => setShowDeleteModal(false)} className="px-5 py-2.5 rounded-xl bg-slate-100/80 hover:bg-slate-200/80 text-[10px] font-black uppercase tracking-wider text-slate-600 transition-colors border border-slate-200/40">
                Ka Noqo
              </button>
              <button onClick={handleDelete} disabled={deleting} className="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-2 disabled:opacity-50 transition-all active:scale-95">
                {deleting ? <Loader2 className="animate-spin" size={14} /> : <Trash2 size={14} />}
                {deleting ? 'Tirtirayaa...' : 'Haa, Tirtir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
