// app/factories/[id]/page.tsx - Factory Details Page (Similar to Project Details)
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Layout from '@/components/layouts/Layout';
import {
  ArrowLeft, DollarSign, Package, Factory, FileText, Plus, Edit, Trash2, CheckCircle, Clock, Loader2,
  Calendar, Info, Tag, Wallet, BarChart2, AlertTriangle, Download, List, LayoutGrid, TrendingUp, Users
} from 'lucide-react';
import Toast from '@/components/common/Toast';

interface FactoryData {
  id: string;
  name: string;
  description?: string;
  location?: string;
  factoryType: string;
  status: 'Active' | 'Inactive' | 'Maintenance';
  totalProduction: number;
  totalSales: number;
  totalRevenue: number;
  createdAt: string;
  updatedAt: string;
  productionOrders: Array<{
    id: string;
    orderNumber: string;
    productName: string;
    quantity: number;
    status: string;
    createdAt: string;
  }>;
  sales: Array<{
    id: string;
    description: string;
    amount: number;
    transactionDate: string;
  }>;
}

const FactoryStatusBadge: React.FC<{ status: FactoryData['status'] }> = ({ status }) => {
  let props: { icon: React.ReactNode; className: string; text: string } = { icon: <Info size={14} />, className: 'bg-gray-500/10 text-gray-500', text: status };
  switch (status) {
    case 'Active': props = { icon: <Clock size={14} />, className: 'bg-primary/10 text-primary', text: 'Firfircoon' }; break;
    case 'Inactive': props = { icon: <Info size={14} />, className: 'bg-accent/10 text-accent', text: 'Naafo' }; break;
    case 'Maintenance': props = { icon: <AlertTriangle size={14} />, className: 'bg-orange-500/10 text-orange-500', text: 'Dayactirka' }; break;
  }
  return <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${props.className}`}>{props.icon}{props.text}</span>;
};

export default function FactoryDetailsPage() {
  const { id } = useParams();
  const [factory, setFactory] = useState<FactoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    fetchFactoryDetails();
  }, [id]);

  const fetchFactoryDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/manufacturing/factories');
      if (!response.ok) throw new Error('Failed to fetch factory');
      const data = await response.json();

      const foundFactory = data.factories?.find((f: any) => f.id === id);
      if (!foundFactory) {
        throw new Error('Warshada lama helin');
      }

      // Get detailed production orders and sales for this factory
      const [ordersRes, salesRes] = await Promise.all([
        fetch('/api/manufacturing/production-orders'),
        fetch('/api/sales'),
      ]);

      const ordersData = await ordersRes.json();
      const salesData = await salesRes.json();

      const factoryName = foundFactory.name;
      const factoryOrders = (ordersData.productionOrders || []).filter((o: any) =>
        o.productName === factoryName || o.product?.name === factoryName
      );
      const factorySales = (salesData.sales || []).filter((s: any) =>
        s.description?.includes(factoryName)
      );

      const factoryData: FactoryData = {
        ...foundFactory,
        productionOrders: factoryOrders,
        sales: factorySales,
      };

      setFactory(factoryData);
    } catch (error: any) {
      setToastMessage({ message: error.message || 'Cilad ayaa dhacday.', type: 'error' });
      setFactory(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="animate-spin text-primary" size={48} />
        </div>
      </Layout>
    );
  }

  if (!factory) {
    return (
      <Layout>
        <div className="text-center p-8 mt-10 max-w-lg mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg">
          <AlertTriangle size={48} className="text-redError mx-auto" />
          <h2 className="text-2xl font-bold mt-4">Warshadan Lama Helin</h2>
          <p className="text-mediumGray dark:text-gray-400 mt-2">Lama helin warshada ID-giisu yahay "{id}".</p>
          <Link href="/manufacturing/factories" className="mt-6 inline-flex items-center gap-2 bg-primary text-white py-2 px-4 rounded-lg font-semibold">
            <ArrowLeft size={18} /> Ku noqo Liiska Warshadaha
          </Link>
        </div>
        {toastMessage && <Toast message={toastMessage.message} type={toastMessage.type} onClose={() => setToastMessage(null)} />}
      </Layout>
    );
  }

  const tabs = ['Overview', 'Production', 'Sales', 'Reports'];

  return (
    <Layout>
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex-1 min-w-0">
            <Link href="/manufacturing/factories" className="inline-flex items-center gap-2 text-primary hover:underline font-semibold mb-2 text-sm">
              <ArrowLeft size={18} /> Ku noqo Warshadaha
            </Link>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
                <Factory size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-darkGray dark:text-gray-100">{factory.name}</h1>
                {factory.location && (
                  <p className="text-mediumGray dark:text-gray-400 text-sm">{factory.location}</p>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Link href={`/manufacturing/factories/edit/${factory.id}`} className="p-2 rounded-lg bg-lightGray/80 hover:bg-lightGray dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors">
              <Edit className="text-accent" size={20} />
            </Link>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md">
            <p className="text-sm text-mediumGray">Wadarta Soo Saarista</p>
            <p className="text-2xl font-bold text-darkGray dark:text-gray-100">{factory.totalProduction.toLocaleString()}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md">
            <p className="text-sm text-secondary">Wadarta Iibka</p>
            <p className="text-2xl font-bold text-secondary">{factory.totalSales.toLocaleString()}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md">
            <p className="text-sm text-secondary">Wadarta Dakhliga</p>
            <p className="text-2xl font-bold text-secondary">{factory.totalRevenue.toLocaleString()} ETB</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md flex flex-col justify-center items-center">
            <FactoryStatusBadge status={factory.status} />
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <nav className="flex space-x-2 px-2 border-b border-lightGray dark:border-gray-700 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-2 whitespace-nowrap py-3 px-3 text-sm font-semibold transition-colors duration-200 ${activeTab === tab
                  ? 'border-b-2 border-primary text-primary'
                  : 'border-b-2 border-transparent text-mediumGray hover:text-darkGray'
                  }`}
              >
                {tab}
              </button>
            ))}
          </nav>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'Overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-darkGray dark:text-gray-100 mb-4">Faahfaahinta Warshada</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-lightGray dark:bg-gray-700 p-4 rounded-lg">
                      <p className="text-sm text-mediumGray dark:text-gray-400">Nooca Warshada</p>
                      <p className="text-lg font-semibold text-darkGray dark:text-gray-100">{factory.factoryType}</p>
                    </div>
                    {factory.location && (
                      <div className="bg-lightGray dark:bg-gray-700 p-4 rounded-lg">
                        <p className="text-sm text-mediumGray dark:text-gray-400">Goobta</p>
                        <p className="text-lg font-semibold text-darkGray dark:text-gray-100">{factory.location}</p>
                      </div>
                    )}
                  </div>
                </div>
                {factory.description && (
                  <div>
                    <h3 className="text-lg font-semibold text-darkGray dark:text-gray-100 mb-2">Sharaxaad</h3>
                    <p className="text-mediumGray dark:text-gray-400">{factory.description}</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'Production' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-darkGray dark:text-gray-100">Amarka Soo Saarista</h3>
                  <Link href="/manufacturing/production-orders/add" className="bg-secondary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-600 transition flex items-center space-x-2">
                    <Plus size={16} />
                    <span>Ku Dar Amarka</span>
                  </Link>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-lightGray dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Amarka #</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Alaabta</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold">Tirada</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold">Xaaladda</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Taariikhda</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-lightGray dark:divide-gray-700">
                      {factory.productionOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-lightGray/50 dark:hover:bg-gray-700/50">
                          <td className="px-4 py-3">{order.orderNumber}</td>
                          <td className="px-4 py-3 font-medium">{order.productName}</td>
                          <td className="px-4 py-3 text-right">{order.quantity.toLocaleString()}</td>
                          <td className="px-4 py-3 text-center">
                            <span className="px-2 py-1 rounded text-xs font-medium bg-primary/10 text-primary">
                              {order.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-mediumGray dark:text-gray-400">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'Sales' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-darkGray dark:text-gray-100">Iibka Warshada</h3>
                  <Link href="/manufacturing/sales/add" className="bg-secondary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-600 transition flex items-center space-x-2">
                    <Plus size={16} />
                    <span>Ku Dar Iib</span>
                  </Link>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-lightGray dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Sharaxaad</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold">Qiimaha</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Taariikhda</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-lightGray dark:divide-gray-700">
                      {factory.sales.map((sale) => (
                        <tr key={sale.id} className="hover:bg-lightGray/50 dark:hover:bg-gray-700/50">
                          <td className="px-4 py-3">{sale.description}</td>
                          <td className="px-4 py-3 text-right font-semibold text-secondary">
                            {Number(sale.amount).toLocaleString()} ETB
                          </td>
                          <td className="px-4 py-3 text-sm text-mediumGray dark:text-gray-400">
                            {new Date(sale.transactionDate).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'Reports' && (
              <div>
                <h3 className="text-lg font-semibold text-darkGray dark:text-gray-100 mb-4">Warbixinta Warshada</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Link href="/manufacturing/reports" className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow border border-lightGray dark:border-gray-600 hover:shadow-lg transition">
                    <BarChart2 className="text-primary mb-2" size={32} />
                    <h4 className="font-semibold text-darkGray dark:text-gray-100">Warbixinta Soo Saarista</h4>
                    <p className="text-sm text-mediumGray dark:text-gray-400 mt-1">Warbixin buuxda oo ku saabsan soo saarista</p>
                  </Link>
                  <Link href="/manufacturing/sales" className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow border border-lightGray dark:border-gray-600 hover:shadow-lg transition">
                    <TrendingUp className="text-secondary mb-2" size={32} />
                    <h4 className="font-semibold text-darkGray dark:text-gray-100">Warbixinta Iibka</h4>
                    <p className="text-sm text-mediumGray dark:text-gray-400 mt-1">Warbixin buuxda oo ku saabsan iibka</p>
                  </Link>
                </div>
              </div>
            )}
          </div>
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

