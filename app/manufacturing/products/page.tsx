'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus, Search, Box, Tag, Layers, MoreVertical, Loader2, Edit, Trash2, LayoutGrid
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function FactoryProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/manufacturing/products?search=${searchTerm}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch (e) {
      console.error("Failed to fetch products", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(fetchProducts, 300);
    return () => clearTimeout(timeout);
  }, [searchTerm]);

  return (
    <div className="flex flex-col gap-6 p-2 lg:p-4 min-h-screen pb-20">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <Box className="text-purple-500" /> Product Catalog
          </h1>
          <p className="text-sm text-gray-500 font-medium">Manage finished goods and bill of materials templates.</p>
        </div>
        <Link href="/manufacturing/products/add" className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-purple-500/30 flex items-center gap-2 transition-all hover:-translate-y-0.5">
          <Plus size={18} /> Add New Product
        </Link>
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col min-h-[400px]">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search products..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-purple-500 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-x-auto">
          {loading && products.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-gray-400 gap-2">
              <Loader2 className="animate-spin" /> Loading products...
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col h-64 items-center justify-center text-gray-400 gap-4">
              <Box size={48} className="opacity-20" />
              <p>No products found.</p>
              <Link href="/manufacturing/products/add" className="text-purple-500 hover:underline font-bold text-sm">Create first product</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {products.map((product) => (
                <div key={product.id} className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-5 border border-gray-100 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-900 transition-all group relative">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white text-lg">{product.name}</h3>
                      <span className="text-xs font-bold uppercase text-gray-400 tracking-wider flex items-center gap-1 mt-1">
                        <Tag size={12} /> {product.category}
                      </span>
                    </div>
                    <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                      <Box size={24} className="text-purple-500" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300 mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                    <div>
                      <p className="text-xs text-gray-400">Selling Price</p>
                      <p className="font-bold text-gray-900 dark:text-white">{parseFloat(product.sellingPrice).toFixed(2)} ETB</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Std Cost</p>
                      <p className="font-medium">{parseFloat(product.standardCost).toFixed(2)} ETB</p>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Link href={`/manufacturing/bom?productId=${product.id}`} className="flex-1 py-2 text-center bg-white dark:bg-gray-800 text-purple-600 font-bold text-xs rounded-lg border border-purple-100 hover:bg-purple-50 transition-colors flex items-center justify-center gap-1">
                      <Layers size={14} /> Recipe (BOM)
                    </Link>
                    <Link href={`/manufacturing/products/${product.id}/edit`} className="p-2 text-gray-400 hover:text-gray-900 bg-white dark:bg-gray-800 rounded-lg border border-transparent hover:border-gray-200">
                      <Edit size={16} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
