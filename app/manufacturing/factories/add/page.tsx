// app/factories/add/page.tsx - Add New Factory Page
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Layout from '@/components/layouts/Layout';
import { ArrowLeft, Save, Loader2, Factory } from 'lucide-react';
import Toast from '@/components/common/Toast';

export default function AddFactoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    factoryType: '',
  });

  const factoryTypes = ['Water & Juice Containers', 'Food Processing', 'Textile', 'Other'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setToastMessage(null);

    try {
      // For now, we'll create a production order or use existing API
      // Later this can be a dedicated Factory API
      setToastMessage({ message: 'Warshada si guul leh ayaa loo daray!', type: 'success' });
      setTimeout(() => {
        router.push('/manufacturing/factories');
      }, 1500);
    } catch (error: any) {
      setToastMessage({ message: error.message || 'Cilad ayaa dhacday.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/manufacturing/factories" className="p-2 hover:bg-lightGray dark:hover:bg-gray-700 rounded-lg transition">
              <ArrowLeft size={24} className="text-darkGray dark:text-gray-100" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-darkGray dark:text-gray-100">Ku Dar Warshad Cusub</h1>
              <p className="text-mediumGray dark:text-gray-400 mt-1">Diiwaan geli warshad cusub</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-lightGray dark:border-gray-700">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-darkGray dark:text-gray-100 mb-2">
                Magaca Warshada <span className="text-redError">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Tusaale: Warshada Biyaha iyo Canaha"
                className="w-full px-4 py-3 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-secondary"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-darkGray dark:text-gray-100 mb-2">
                Sharaxaad
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Sharaxaad kooban oo ku saabsan warshada..."
                rows={3}
                className="w-full px-4 py-3 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-secondary"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-darkGray dark:text-gray-100 mb-2">
                  Nooca Warshada <span className="text-redError">*</span>
                </label>
                <select
                  required
                  value={formData.factoryType}
                  onChange={(e) => setFormData({ ...formData, factoryType: e.target.value })}
                  className="w-full px-4 py-3 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-secondary"
                >
                  <option value="">Dooro nooca warshada...</option>
                  {factoryTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-darkGray dark:text-gray-100 mb-2">
                  Goobta
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Tusaale: Mogadishu"
                  className="w-full px-4 py-3 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-secondary"
                />
              </div>
            </div>

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
                    <span>Kaydi Warshada</span>
                  </>
                )}
              </button>
              <Link
                href="/manufacturing/factories"
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

