'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import Toast from '@/components/common/Toast';

export default function EditProductionOrderPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [formData, setFormData] = useState({
    status: '',
    priority: '',
    quantity: 0,
    startDate: '',
    dueDate: '',
    notes: ''
  });
  const [orderInfo, setOrderInfo] = useState<any>(null); // Read-only info like Product Name

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/manufacturing/production-orders/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          const order = data.order;
          setOrderInfo(order);
          setFormData({
            status: order.status,
            priority: order.priority,
            quantity: order.quantity,
            startDate: order.startDate ? new Date(order.startDate).toISOString().split('T')[0] : '',
            dueDate: order.dueDate ? new Date(order.dueDate).toISOString().split('T')[0] : '',
            notes: order.notes || ''
          });
        } else {
          setToast({ message: 'Order not found', type: 'error' });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/manufacturing/production-orders/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setToast({ message: 'Order updated successfully', type: 'success' });
        setTimeout(() => router.push(`/manufacturing/production-orders/${params.id}`), 1000);
      } else {
        setToast({ message: 'Failed to update order', type: 'error' });
      }
    } catch (e) {
      setToast({ message: 'Error updating order', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this order? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/manufacturing/production-orders/${params.id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        router.push('/manufacturing/production-orders');
      } else {
        setToast({ message: 'Failed to delete order', type: 'error' });
      }
    } catch (e) {
      setToast({ message: 'Error deleting order', type: 'error' });
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="flex flex-col gap-6 p-2 lg:p-4 min-h-screen pb-20">
      <div className="flex items-center gap-4">
        <Link href={`/manufacturing/production-orders/${params.id}`} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Edit Order #{orderInfo?.orderNumber}</h1>
          <p className="text-sm font-medium text-gray-500">Update production details</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto w-full">
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 lg:p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-8">

          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-800 dark:text-blue-200 text-sm font-medium border border-blue-100 dark:border-blue-900">
            <span className="font-bold">Product:</span> {orderInfo?.productName} <br />
            <span className="font-bold">Customer:</span> {orderInfo?.customer?.name || 'internal'}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Quantity</label>
              <input
                type="number"
                value={formData.quantity}
                onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Priority</label>
              <select
                value={formData.priority}
                onChange={e => setFormData({ ...formData, priority: e.target.value })}
                className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Start Date</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Due Date</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Status</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {['PLANNED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED'].map(s => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setFormData({ ...formData, status: s })}
                  className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${formData.status === s
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
                >
                  {s}
                </button>
              ))}
            </div>
            {formData.status === 'COMPLETED' && (
              <div className="mt-2 text-xs text-green-600 flex items-center gap-1">
                <CheckCircle size={12} /> Marking as COMPLETED will update inventory stocks.
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none h-24"
            />
          </div>

          <div className="pt-4 flex gap-4 border-t border-gray-100 dark:border-gray-700">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
              Save Changes
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="px-6 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-bold transition flex items-center gap-2"
            >
              <Trash2 size={18} /> Delete
            </button>
          </div>

        </form>
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
