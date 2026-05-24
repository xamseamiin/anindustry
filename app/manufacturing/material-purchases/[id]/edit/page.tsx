'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Layout from '@/components/layouts/Layout';
import {
  ArrowLeft, Save, Package, Truck, Calendar, DollarSign, FileText,
  Loader2, CheckCircle, AlertCircle, User, Building, Clock, Tag
} from 'lucide-react';
import Toast from '@/components/common/Toast';

// --- Data Interfaces ---
interface Vendor {
  id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
}

interface ProductionOrder {
  id: string;
  orderNumber: string;
  productName: string;
  status: string;
}

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
}

interface MaterialPurchase {
  id: string;
  materialName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  vendorId: string;
  purchaseDate: string;
  invoiceNumber?: string;
  notes?: string;
  productionOrderId?: string;
  accountId?: string;
  createdAt: string;
  updatedAt: string;
  vendor?: Vendor;
  productionOrder?: ProductionOrder;
  account?: Account;
}

export default function EditMaterialPurchasePage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Data states
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [productionOrders, setProductionOrders] = useState<ProductionOrder[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);

  // Form states
  const [formData, setFormData] = useState({
    materialName: '',
    quantity: 1,
    unit: 'pcs',
    unitPrice: 0,
    totalPrice: 0,
    vendorId: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    invoiceNumber: '',
    notes: '',
    productionOrderId: '',
    accountId: ''
  });

  useEffect(() => {
    if (params.id) {
      fetchPurchase(params.id as string);
      fetchVendors();
      fetchProductionOrders();
      fetchAccounts();
    }
  }, [params.id]);

  const fetchPurchase = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/manufacturing/material-purchases/${id}`);
      if (response.ok) {
        const data = await response.json();
        const purchase = data.materialPurchase;
        setFormData({
          materialName: purchase.materialName,
          quantity: purchase.quantity,
          unit: purchase.unit,
          unitPrice: purchase.unitPrice,
          totalPrice: purchase.totalPrice,
          vendorId: purchase.vendorId,
          purchaseDate: purchase.purchaseDate.split('T')[0],
          invoiceNumber: purchase.invoiceNumber || '',
          notes: purchase.notes || '',
          productionOrderId: purchase.productionOrderId || '',
          accountId: purchase.accountId || ''
        });
      } else {
        setToastMessage({
          message: 'Failed to fetch purchase details',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error fetching purchase:', error);
      setToastMessage({
        message: 'Failed to fetch purchase details',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchVendors = async () => {
    try {
      const response = await fetch('/api/vendors');
      if (response.ok) {
        const data = await response.json();
        setVendors(data.vendors || []);
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
    }
  };

  const fetchProductionOrders = async () => {
    try {
      const response = await fetch('/api/manufacturing/production-orders');
      if (response.ok) {
        const data = await response.json();
        setProductionOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Error fetching production orders:', error);
    }
  };

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/projects/accounting/accounts');
      if (response.ok) {
        const data = await response.json();
        setAccounts(data.accounts || []);
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };

      // Auto-calculate total price
      if (field === 'quantity' || field === 'unitPrice') {
        updated.totalPrice = updated.quantity * updated.unitPrice;
      }

      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setToastMessage(null);

    // Validation
    if (!formData.materialName || !formData.quantity || !formData.unitPrice || !formData.vendorId || !formData.accountId) {
      setToastMessage({
        message: 'Please fill all required fields',
        type: 'error'
      });
      setSaving(false);
      return;
    }

    if (formData.quantity <= 0 || formData.unitPrice <= 0) {
      setToastMessage({
        message: 'Quantity and unit price must be greater than 0',
        type: 'error'
      });
      setSaving(false);
      return;
    }

    try {
      const payload = {
        ...formData,
        quantity: parseFloat(formData.quantity.toString()),
        unitPrice: parseFloat(formData.unitPrice.toString()),
        totalPrice: parseFloat(formData.totalPrice.toString()),
        productionOrderId: formData.productionOrderId || null
      };

      const response = await fetch(`/api/manufacturing/material-purchases/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setToastMessage({
          message: 'Purchase updated successfully!',
          type: 'success'
        });
        setTimeout(() => {
          router.push(`/manufacturing/material-purchases/${params.id}`);
        }, 1500);
      } else {
        const errorData = await response.json();
        setToastMessage({
          message: errorData.error || 'Failed to update purchase',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error updating purchase:', error);
      setToastMessage({
        message: 'Failed to update purchase',
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href={`/manufacturing/material-purchases/${params.id}`}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Edit Purchase</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Update material purchase information
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Material Information */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-6">
                  <Package className="text-orange-500" size={24} />
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Material Information</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Material Name *
                    </label>
                    <input
                      type="text"
                      value={formData.materialName}
                      onChange={(e) => handleInputChange('materialName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Enter material name"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Quantity *
                      </label>
                      <input
                        type="number"
                        value={formData.quantity}
                        onChange={(e) => handleInputChange('quantity', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="0"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Unit
                      </label>
                      <select
                        value={formData.unit}
                        onChange={(e) => handleInputChange('unit', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      >
                        <option value="pcs">pcs</option>
                        <option value="sq ft">sq ft</option>
                        <option value="liters">liters</option>
                        <option value="kg">kg</option>
                        <option value="meters">meters</option>
                        <option value="sets">sets</option>
                        <option value="boxes">boxes</option>
                        <option value="rolls">rolls</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Unit Price *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
                        <input
                          type="number"
                          value={formData.unitPrice}
                          onChange={(e) => handleInputChange('unitPrice', parseFloat(e.target.value) || 0)}
                          className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Total Price
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
                        <input
                          type="number"
                          value={formData.totalPrice}
                          readOnly
                          className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-gray-100"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vendor Information */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-6">
                  <Truck className="text-blue-500" size={24} />
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Vendor Information</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Vendor *
                    </label>
                    <select
                      value={formData.vendorId}
                      onChange={(e) => handleInputChange('vendorId', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select Vendor</option>
                      {vendors.map(vendor => (
                        <option key={vendor.id} value={vendor.id}>
                          {vendor.name} {vendor.contactPerson && `(${vendor.contactPerson})`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Purchase Date *
                    </label>
                    <input
                      type="date"
                      value={formData.purchaseDate}
                      onChange={(e) => handleInputChange('purchaseDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Payment Account *
                    </label>
                    <select
                      value={formData.accountId}
                      onChange={(e) => handleInputChange('accountId', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select Payment Account</option>
                      {accounts.map(account => (
                        <option key={account.id} value={account.id}>
                          {account.name} - {account.type} (Balance: {account.currency} {account.balance.toFixed(2)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Invoice Number
                    </label>
                    <input
                      type="text"
                      value={formData.invoiceNumber}
                      onChange={(e) => handleInputChange('invoiceNumber', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Invoice number"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Production Order */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-6">
                  <Building className="text-green-500" size={24} />
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Production Order</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Production Order
                    </label>
                    <select
                      value={formData.productionOrderId}
                      onChange={(e) => handleInputChange('productionOrderId', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="">Select Production Order (Optional)</option>
                      {productionOrders.map(order => (
                        <option key={order.id} value={order.id}>
                          {order.orderNumber} - {order.productName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-6">
                  <FileText className="text-purple-500" size={24} />
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Notes</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Additional Notes
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Any additional notes about this purchase"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Link
              href={`/manufacturing/material-purchases/${params.id}`}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white px-6 py-2 rounded-lg transition-colors"
            >
              {saving ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save size={20} />
                  Update Purchase
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Toast Message */}
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
