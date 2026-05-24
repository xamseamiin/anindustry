// app/factories/page.tsx - Factory List Page (Similar to Projects Design)
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '@/components/layouts/Layout';
import {
  Plus, Search, Filter, Eye, Edit, Trash2, LayoutGrid, List, Calendar, CheckCircle, Clock, XCircle, ChevronRight,
  Loader2, Info, Bell, FileX2, MoreVertical, DollarSign, User, Hash, AlertTriangle, Upload, TrendingUp, Factory
} from 'lucide-react';
import Toast from '@/components/common/Toast';

// --- Factory Data Interface ---
interface Factory {
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
}

// --- Helper Function for Status ---
const getStatusProps = (status: Factory['status']) => {
  switch (status) {
    case 'Active':
      return { class: 'text-primary bg-primary/10', icon: <Clock size={16} />, text: 'Firfircoon' };
    case 'Inactive':
      return { class: 'text-accent bg-accent/10', icon: <Info size={16} />, text: 'Naafo' };
    case 'Maintenance':
      return { class: 'text-orange-500 bg-orange-500/10', icon: <AlertTriangle size={16} />, text: 'Dayactirka' };
    default:
      return { class: 'text-mediumGray bg-mediumGray/10', icon: <Info size={16} />, text: status };
  }
};

// --- Factory Row Component ---
interface FactoryRowProps {
  factory: Factory;
  onDelete: (id: string) => void;
}

const FactoryRow: React.FC<FactoryRowProps> = ({ factory, onDelete }) => {
  const { class: statusClass, icon: statusIcon, text: statusText } = getStatusProps(factory.status);

  return (
    <tr className="block md:table-row border-b md:border-b-0 border-lightGray dark:border-gray-700 mb-4 md:mb-0 rounded-lg md:rounded-none bg-white dark:bg-gray-800 md:bg-transparent shadow-md md:shadow-none md:hover:bg-lightGray/50 dark:md:hover:bg-gray-700/50 transition-colors duration-150">
      <td data-label="Warshada" className="p-3 md:p-4 flex justify-between items-center md:table-cell text-left font-bold text-lg md:font-medium md:text-base text-darkGray dark:text-gray-100 whitespace-nowrap border-b md:border-b-0 border-lightGray dark:border-gray-700/50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
            <Factory size={20} className="text-white" />
          </div>
          <div>
            <span className="md:hidden text-primary font-bold">{factory.name}</span>
            <span className="hidden md:inline">{factory.name}</span>
            {factory.location && (
              <div className="text-xs text-mediumGray dark:text-gray-400 mt-1">{factory.location}</div>
            )}
          </div>
        </div>
      </td>
      <td data-label="Nooca" className="p-3 md:p-4 flex justify-between items-center md:table-cell text-left text-mediumGray dark:text-gray-300 whitespace-nowrap border-b md:border-b-0 border-lightGray dark:border-gray-700/50">
        <span className="font-bold md:hidden">Nooca:</span> {factory.factoryType}
      </td>
      <td data-label="Soo Saarista" className="p-3 md:p-4 flex justify-between items-center md:table-cell text-left md:text-right text-mediumGray dark:text-gray-300 whitespace-nowrap border-b md:border-b-0 border-lightGray dark:border-gray-700/50">
        <span className="font-bold md:hidden">Soo Saarista:</span> {factory.totalProduction.toLocaleString()}
      </td>
      <td data-label="Iibka" className="p-3 md:p-4 flex justify-between items-center md:table-cell text-left md:text-right text-secondary dark:text-green-400 whitespace-nowrap border-b md:border-b-0 border-lightGray dark:border-gray-700/50">
        <span className="font-bold md:hidden">Iibka:</span> {factory.totalSales.toLocaleString()}
      </td>
      <td data-label="Dakhliga" className="p-3 md:p-4 flex justify-between items-center md:table-cell text-left md:text-right font-semibold text-secondary dark:text-green-400 whitespace-nowrap border-b md:border-b-0 border-lightGray dark:border-gray-700/50">
        <span className="font-bold md:hidden">Dakhliga:</span> {factory.totalRevenue.toLocaleString()} ETB
      </td>
      <td data-label="Xaaladda" className="p-3 md:p-4 flex justify-between items-center md:table-cell text-left whitespace-nowrap border-b md:border-b-0 border-lightGray dark:border-gray-700/50">
        <span className="font-bold md:hidden">Xaaladda:</span>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center justify-center gap-2 ${statusClass}`}>
          {statusIcon} <span>{statusText}</span>
        </span>
      </td>
      <td className="p-3 md:p-4 md:table-cell text-right">
        <div className="flex items-center justify-end space-x-2">
          <Link href={`/manufacturing/factories/${factory.id}`} className="p-2 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors duration-200" title="Fiiri Faahfaahinta">
            <Eye size={18} />
          </Link>
          <Link href={`/manufacturing/factories/edit/${factory.id}`} className="p-2 rounded-full bg-accent/10 text-accent hover:bg-accent hover:text-white transition-colors duration-200" title="Wax ka Beddel">
            <Edit size={18} />
          </Link>
          <button onClick={() => onDelete(factory.id)} className="p-2 rounded-full bg-redError/10 text-redError hover:bg-redError hover:text-white transition-colors duration-200" title="Tirtir">
            <Trash2 size={18} />
          </button>
        </div>
      </td>
    </tr>
  );
};

// --- Kanban Card Component ---
interface KanbanCardProps {
  factory: Factory;
  onDelete: (id: string) => void;
}

const KanbanCard: React.FC<KanbanCardProps> = ({ factory, onDelete }) => {
  const { class: statusClass, icon: statusIcon, text: statusText } = getStatusProps(factory.status);
  let borderColor = 'border-lightGray dark:border-gray-700';
  if (factory.status === 'Active') borderColor = 'border-primary';
  if (factory.status === 'Inactive') borderColor = 'border-accent';
  if (factory.status === 'Maintenance') borderColor = 'border-orange-500';

  return (
    <div className={`bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg mb-4 border-l-4 ${borderColor} transform hover:scale-[1.02] hover:shadow-xl transition-all duration-300 flex flex-col justify-between`}>
      <div>
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center space-x-2">
            <Factory size={20} className="text-primary" />
            <h4 className="font-bold text-lg text-darkGray dark:text-gray-100">{factory.name}</h4>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1.5 ${statusClass}`}>
            {statusIcon} <span>{statusText}</span>
          </span>
        </div>
        {factory.description && (
          <p className="text-sm text-mediumGray dark:text-gray-400 mb-3 line-clamp-2">{factory.description}</p>
        )}
        {factory.location && (
          <p className="text-xs text-mediumGray dark:text-gray-400 mb-3 flex items-center gap-1">
            <Info size={14} /> {factory.location}
          </p>
        )}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-lightGray dark:bg-gray-700 p-2 rounded">
            <p className="text-xs text-mediumGray dark:text-gray-400">Soo Saarista</p>
            <p className="text-sm font-bold text-darkGray dark:text-gray-100">{factory.totalProduction.toLocaleString()}</p>
          </div>
          <div className="bg-lightGray dark:bg-gray-700 p-2 rounded">
            <p className="text-xs text-mediumGray dark:text-gray-400">Iibka</p>
            <p className="text-sm font-bold text-secondary">{factory.totalSales.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-secondary/10 p-2 rounded mb-3">
          <p className="text-xs text-mediumGray dark:text-gray-400">Dakhliga Guud</p>
          <p className="text-lg font-bold text-secondary">{factory.totalRevenue.toLocaleString()} ETB</p>
        </div>
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-lightGray dark:border-gray-700">
        <span className="text-xs text-mediumGray dark:text-gray-400">{factory.factoryType}</span>
        <div className="flex space-x-2">
          <Link href={`/manufacturing/factories/${factory.id}`} className="p-1.5 rounded bg-primary/10 text-primary hover:bg-primary hover:text-white transition">
            <Eye size={14} />
          </Link>
          <Link href={`/manufacturing/factories/edit/${factory.id}`} className="p-1.5 rounded bg-accent/10 text-accent hover:bg-accent hover:text-white transition">
            <Edit size={14} />
          </Link>
          <button onClick={() => onDelete(factory.id)} className="p-1.5 rounded bg-redError/10 text-redError hover:bg-redError hover:text-white transition">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default function FactoriesPage() {
  const [factories, setFactories] = useState<Factory[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban');
  const [pageLoading, setPageLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Fetch factories
  const fetchFactories = async () => {
    setPageLoading(true);
    try {
      const response = await fetch('/api/manufacturing/factories');
      if (!response.ok) throw new Error('Failed to fetch factories');
      const data = await response.json();
      setFactories(data.factories || []);
    } catch (error: any) {
      console.error('Error fetching factories:', error);
      setToastMessage({ message: error.message || 'Cilad ayaa dhacday marka warshadaha la soo gelinayay.', type: 'error' });
      setFactories([]);
    } finally {
      setPageLoading(false);
    }
  };

  const handleDeleteFactory = async (id: string) => {
    if (window.confirm('Ma hubtaa inaad tirtirto warshadan?')) {
      try {
        // For now just remove from list
        setFactories(factories.filter(f => f.id !== id));
        setToastMessage({ message: 'Warshada si guul leh ayaa loo tirtiray!', type: 'success' });
      } catch (error: any) {
        setToastMessage({ message: error.message || 'Cilad ayaa dhacday.', type: 'error' });
      }
    }
  };

  useEffect(() => {
    fetchFactories();
  }, []);

  const filteredFactories = factories.filter(factory => {
    const matchesSearch = factory.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      factory.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      factory.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || factory.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const kanbanColumns = {
    'Firfircoon': filteredFactories.filter(f => f.status === 'Active'),
    'Naafo': filteredFactories.filter(f => f.status === 'Inactive'),
    'Dayactirka': filteredFactories.filter(f => f.status === 'Maintenance'),
  };

  const totalFactories = factories.length;
  const activeFactories = factories.filter(f => f.status === 'Active').length;
  const totalProduction = factories.reduce((sum, f) => sum + f.totalProduction, 0);
  const totalRevenue = factories.reduce((sum, f) => sum + f.totalRevenue, 0);

  return (
    <Layout>
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-darkGray dark:text-gray-100">Warshadaha</h1>
            <p className="text-mediumGray dark:text-gray-400 mt-1">Maamul warshadaha iyo soo saarista</p>
          </div>
          <div className="flex space-x-3">
            <Link
              href="/manufacturing/factories/add"
              className="bg-secondary text-white px-4 md:px-6 py-2 md:py-3 rounded-lg font-semibold hover:bg-green-600 transition flex items-center space-x-2"
            >
              <Plus size={20} />
              <span>Ku Dar Warshad Cusub</span>
            </Link>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-lightGray dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-mediumGray dark:text-gray-400 text-sm">Wadarta Warshadaha</p>
                <p className="text-2xl font-bold text-darkGray dark:text-gray-100 mt-1">{totalFactories}</p>
              </div>
              <Factory className="text-primary" size={32} />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-lightGray dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-mediumGray dark:text-gray-400 text-sm">Warshadaha Firfircoon</p>
                <p className="text-2xl font-bold text-darkGray dark:text-gray-100 mt-1">{activeFactories}</p>
              </div>
              <CheckCircle className="text-green-500" size={32} />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-lightGray dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-mediumGray dark:text-gray-400 text-sm">Wadarta Soo Saarista</p>
                <p className="text-2xl font-bold text-darkGray dark:text-gray-100 mt-1">{totalProduction.toLocaleString()}</p>
              </div>
              <TrendingUp className="text-secondary" size={32} />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-lightGray dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-mediumGray dark:text-gray-400 text-sm">Wadarta Dakhliga</p>
                <p className="text-2xl font-bold text-darkGray dark:text-gray-100 mt-1">{totalRevenue.toLocaleString()} ETB</p>
              </div>
              <DollarSign className="text-secondary" size={32} />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-lightGray dark:border-gray-700">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Raadi warshada..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-secondary"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-secondary"
            >
              <option value="All">Dhammaan Xaaladaha</option>
              <option value="Active">Firfircoon</option>
              <option value="Inactive">Naafo</option>
              <option value="Maintenance">Dayactirka</option>
            </select>
            <div className="flex space-x-2">
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-lg transition ${viewMode === 'list' ? 'bg-primary text-white' : 'bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100'}`}
              >
                <List size={20} />
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-4 py-2 rounded-lg transition ${viewMode === 'kanban' ? 'bg-primary text-white' : 'bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100'}`}
              >
                <LayoutGrid size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {pageLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : filteredFactories.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 p-12 rounded-lg shadow border border-lightGray dark:border-gray-700 text-center">
            <Factory className="mx-auto text-mediumGray dark:text-gray-400 mb-4" size={48} />
            <p className="text-mediumGray dark:text-gray-400 text-lg">Ma jiro warshad la heli karo</p>
            <Link href="/manufacturing/factories/add" className="text-secondary hover:underline mt-2 inline-block">
              Ku dar warshad cusub
            </Link>
          </div>
        ) : viewMode === 'list' ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-lightGray dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-lightGray dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-darkGray dark:text-gray-100">Warshada</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-darkGray dark:text-gray-100">Nooca</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-darkGray dark:text-gray-100">Soo Saarista</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-darkGray dark:text-gray-100">Iibka</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-darkGray dark:text-gray-100">Dakhliga</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-darkGray dark:text-gray-100">Xaaladda</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-darkGray dark:text-gray-100">Ficilada</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-lightGray dark:divide-gray-700">
                  {filteredFactories.map(factory => (
                    <FactoryRow key={factory.id} factory={factory} onDelete={handleDeleteFactory} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {Object.entries(kanbanColumns).filter(([_, factoriesInColumn]) => factoriesInColumn.length > 0).map(([status, factoriesInColumn]) => (
              <div key={status} className="bg-lightGray/50 dark:bg-gray-900/50 p-4 rounded-xl shadow-inner flex flex-col w-full min-h-[300px]">
                <h3 className="text-lg font-bold text-darkGray dark:text-gray-100 mb-4 pb-2 border-b border-mediumGray/20 flex justify-between items-center">
                  <span>{status}</span>
                  <span className="text-sm font-semibold bg-primary/10 text-primary px-2.5 py-1 rounded-full">{factoriesInColumn.length}</span>
                </h3>
                <div className="flex-1 space-y-4 overflow-y-auto pr-2 -mr-2">
                  {factoriesInColumn.map(factory => (
                    <KanbanCard key={factory.id} factory={factory} onDelete={handleDeleteFactory} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
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

