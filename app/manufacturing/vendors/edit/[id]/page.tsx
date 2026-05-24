'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft, Save, Loader2, User, Building, Phone, Mail, MapPin, 
  Package, FileText, Edit2, AlertCircle, RefreshCcw
} from 'lucide-react';
import Toast from '@/components/common/Toast';

export default function EditVendorPage() {
  const router = useRouter();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    type: 'Material',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    productsServices: '',
    notes: ''
  });

  useEffect(() => {
    const fetchVendor = async () => {
      try {
        const res = await fetch(`/api/manufacturing/vendors/${id}`);
        if (res.ok) {
          const data = await res.json();
          const v = data.vendor;
          setFormData({
            name: v.name || '',
            type: v.type || 'Material',
            contactPerson: v.contactPerson || '',
            phone: v.phone || '',
            email: v.email || '',
            address: v.address || '',
            productsServices: v.productsServices || '',
            notes: v.notes || ''
          });
        }
      } catch (e) {
        setToast({ message: 'Error loading vendor', type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchVendor();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`/api/manufacturing/vendors/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setToast({ message: 'Vendor updated successfully!', type: 'success' });
        setTimeout(() => router.push(`/manufacturing/vendors/${id}`), 1500);
      } else {
        setToast({ message: 'Failed to update vendor', type: 'error' });
      }
    } catch (e) {
      setToast({ message: 'Connection error', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = "w-full p-4 bg-white/60 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/40 transition-all";

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4">
      <Loader2 size={40} className="animate-spin text-blue-500" />
      <p className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">Fetching Vendor Data...</p>
    </div>
  );

  return (
    <div className="flex flex-col gap-8 p-4 lg:p-8 max-w-5xl mx-auto min-h-screen pb-20">
      {/* Header */}
      <div className="flex items-center gap-6">
        <button onClick={() => router.back()} className="p-3 bg-white rounded-2xl shadow-sm border border-slate-200 text-slate-500 hover:text-blue-600 transition-all">
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Edit2 className="text-blue-600" size={32} />
            Edit Partner
          </h1>
          <p className="text-slate-500 font-medium">Updating information for <span className="text-blue-600 font-bold">{formData.name}</span></p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/60 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white shadow-2xl space-y-8">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="p-2 bg-blue-500/10 text-blue-600 rounded-xl"><Building size={20} /></div>
              <h3 className="text-xl font-black text-slate-900">Partner Credentials</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Company Name</label>
                <input
                  type="text"
                  className={inputClass}
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                <select
                  className={inputClass}
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                >
                  <option value="Material">Material Supplier</option>
                  <option value="Service">Service Provider</option>
                  <option value="Labor">Labor</option>
                  <option value="Transport">Transport</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Offerings</label>
              <textarea
                className={`${inputClass} min-h-[120px] resize-none`}
                value={formData.productsServices}
                onChange={(e) => setFormData({...formData, productsServices: e.target.value})}
              />
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white shadow-2xl space-y-8">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-xl"><User size={20} /></div>
              <h3 className="text-xl font-black text-slate-900">Communication</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact Person</label>
                <input
                  type="text"
                  className={inputClass}
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({...formData, contactPerson: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone</label>
                <input
                  type="tel"
                  className={inputClass}
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white/60 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white shadow-2xl space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 text-purple-600 rounded-xl"><MapPin size={20} /></div>
              <h3 className="text-xl font-black text-slate-900">Location</h3>
            </div>
            <textarea
              className={`${inputClass} min-h-[100px] resize-none`}
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
            />
          </div>

          <div className="bg-slate-900 p-8 rounded-[3rem] shadow-2xl text-white space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-xl"><FileText size={20} /></div>
              <h3 className="text-xl font-black">Admin Notes</h3>
            </div>
            <textarea
              className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white outline-none focus:bg-white/10 transition-all min-h-[150px] resize-none"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-blue-600/30 transition-all flex items-center justify-center gap-3"
            >
              {submitting ? <Loader2 className="animate-spin" /> : <RefreshCcw size={20} />}
              {submitting ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </form>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
