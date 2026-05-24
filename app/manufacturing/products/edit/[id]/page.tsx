// app/manufacturing/products/edit/[id]/page.tsx - Edit Product Page
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Layout from '@/components/layouts/Layout';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import Toast from '@/components/common/Toast';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    unit: '',
    standardCost: '',
    sellingPrice: '',
  });

  const categories = ['Water Containers', 'Juice Containers', 'Other'];
  const units = ['Litre', 'Piece', 'Box', 'Carton', 'Bottle'];

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      setPageLoading(true);
      const response = await fetch(`/api/manufacturing/products/${productId}`);
      if (!response.ok) throw new Error('Failed to fetch product');
      const product = await response.json();
      setFormData({
        name: product.name || '',
        description: product.description || '',
        category: product.category || '',
        unit: product.unit || '',
        standardCost: product.standardCost?.toString() || '',
        sellingPrice: product.sellingPrice?.toString() || '',
      });
    } catch (error: any) {
      setToastMessage({ message: error.message || 'Cilad ayaa dhacday marka alaabta la soo gelinayay.', type: 'error' });
    } finally {
      setPageLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setToastMessage(null);

    try {
      const response = await fetch(`/api/manufacturing/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          category: formData.category,
          unit: formData.unit,
          standardCost: parseFloat(formData.standardCost) || 0,
          sellingPrice: parseFloat(formData.sellingPrice) || 0,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update product');
      }

      setToastMessage({ message: 'Alaabta si guul leh ayaa loo cusboonaysiiyay!', type: 'success' });
      setTimeout(() => {
        router.push('/manufacturing/products');
      }, 1500);
    } catch (error: any) {
      setToastMessage({ message: error.message || 'Cilad ayaa dhacday.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-screen">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/manufacturing/products" className="p-2 hover:bg-lightGray dark:hover:bg-gray-700 rounded-lg transition">
              <ArrowLeft size={24} className="text-darkGray dark:text-gray-100" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-darkGray dark:text-gray-100">Wax ka Beddel Alaabta</h1>
              <p className="text-mediumGray dark:text-gray-400 mt-1">Cusboonaysii macluumaadka alaabta</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-lightGray dark:border-gray-700">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Product Name */}
            <div>
              <label className="block text-sm font-semibold text-darkGray dark:text-gray-100 mb-2">
                Magaca Alaabta <span className="text-redError">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Tusaale: Biyo 1 Litir"
                className="w-full px-4 py-3 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-secondary"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-darkGray dark:text-gray-100 mb-2">
                Sharaxaad
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Sharaxaad kooban oo ku saabsan alaabta..."
                rows={3}
                className="w-full px-4 py-3 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-secondary"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Category */}
              <div>
                <label className="block text-sm font-semibold text-darkGray dark:text-gray-100 mb-2">
                  Qaybta <span className="text-redError">*</span>
                </label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-secondary"
                >
                  <option value="">Dooro qaybta...</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Unit */}
              <div>
                <label className="block text-sm font-semibold text-darkGray dark:text-gray-100 mb-2">
                  Halbeegga <span className="text-redError">*</span>
                </label>
                <select
                  required
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="w-full px-4 py-3 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-secondary"
                >
                  <option value="">Dooro halbeegga...</option>
                  {units.map(unit => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Standard Cost */}
              <div>
                <label className="block text-sm font-semibold text-darkGray dark:text-gray-100 mb-2">
                  Kharashka Caadiga ah (ETB)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.standardCost}
                  onChange={(e) => setFormData({ ...formData, standardCost: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-4 py-3 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-secondary"
                />
              </div>

              {/* Selling Price */}
              <div>
                <label className="block text-sm font-semibold text-darkGray dark:text-gray-100 mb-2">
                  Qiimaha Iibka (ETB) <span className="text-redError">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={formData.sellingPrice}
                  onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-4 py-3 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-secondary"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex space-x-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-secondary text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-600 transition flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    <span>Waa la kaydiyayaa...</span>
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    <span>Cusboonaysii</span>
                  </>
                )}
              </button>
              <Link
                href="/manufacturing/products"
                className="px-6 py-3 border border-lightGray dark:border-gray-700 rounded-lg font-semibold text-darkGray dark:text-gray-100 hover:bg-lightGray dark:hover:bg-gray-700 transition"
              >
                Jooji
              </Link>
            </div>
          </form>
        </div>
      </div>

      {toastMessage && (
        <Toast
          message={toastMessage.message}
          type={toastMessage.type}
          onClose={() => setToastMessage(null)}
        />
      )}
    </Layout>
  );
}

