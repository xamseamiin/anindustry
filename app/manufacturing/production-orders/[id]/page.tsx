'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronRight, Edit, Trash2, ArrowLeft, Calendar, User, Package, Clock, DollarSign, Play, Pause, CheckCircle, XCircle, RefreshCw, Square, Loader2 } from 'lucide-react';
import Layout from '@/components/layouts/Layout';
import Toast from '@/components/common/Toast';

interface ProductionOrder {
  id: string;
  orderNumber: string;
  productName: string;
  quantity: number;
  status: string;
  priority: string;
  startDate: string;
  dueDate: string;
  notes?: string;
  customerId: string;
  productId?: string;
  customer?: {
    id: string;
    name: string;
  };
  product?: {
    id: string;
    name: string;
  };
  billOfMaterials?: BillOfMaterial[];
  workOrders?: WorkOrder[];
}

interface BillOfMaterial {
  id: string;
  materialName: string;
  quantity: number;
  unit: string;
  costPerUnit: number;
  totalCost: number;
  notes?: string;
}

interface WorkOrder {
  id: string;
  stage: string;
  description: string;
  estimatedHours: number;
  actualHours?: number;
  status: string;
  startTime?: string;
  endTime?: string;
  notes?: string;
  assignedToId?: string;
  assignedTo?: {
    id: string;
    fullName: string;
  };
}

export default function ViewProductionOrderPage() {
  const params = useParams();
  const router = useRouter();
  const productionOrderId = params.id as string;

  const [productionOrder, setProductionOrder] = useState<ProductionOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (productionOrderId) {
      fetchProductionOrder();
    }
  }, [productionOrderId]);

  const fetchProductionOrder = async () => {
    try {
      const response = await fetch(`/api/manufacturing/production-orders/${productionOrderId}`);
      if (response.ok) {
        const data = await response.json();
        setProductionOrder(data.order);
      } else {
        setToast({ message: 'Qalad ayaa dhacay marka la soo saarayay amarka', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Qalad ayaa dhacay', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Ma hubtaa inaad tirtirto amarkan?')) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/manufacturing/production-orders/${productionOrderId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setToast({ message: 'Amarka warshadaha waa la tirtiray!', type: 'success' });
        router.push('/manufacturing');
      } else {
        const error = await response.json();
        setToast({ message: error.error || 'Qalad ayaa dhacay', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Qalad ayaa dhacay', type: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLANNED':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PLANNED':
        return 'Planned';
      case 'IN_PROGRESS':
        return 'In Progress';
      case 'COMPLETED':
        return 'Completed';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const updateStatus = async (newStatus: string) => {
    if (newStatus === 'COMPLETED') setCompleting(true);
    try {
      const response = await fetch(`/api/manufacturing/production-orders/${productionOrderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          orderNumber: productionOrder?.orderNumber, // Maintain required fields
          productName: productionOrder?.productName,
          // If status is completed, the backend logic handles date and stock
        }),
      });

      if (response.ok) {
        setToast({ message: `Status updated to ${getStatusText(newStatus)}`, type: 'success' });
        fetchProductionOrder();
      } else {
        const error = await response.json();
        setToast({ message: error.message || 'Failed to update status', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Error updating status', type: 'error' });
    } finally {
      setCompleting(false);
    }
  };

  // Work Order Actions
  const handleWorkOrderAction = async (workOrderId: string, action: 'start' | 'complete' | 'reset') => {
    // Find current work order
    const wo = productionOrder?.workOrders?.find(w => w.id === workOrderId);
    if (!wo) return;

    let payload: any = {};

    if (action === 'start') {
      payload = {
        status: 'IN_PROGRESS',
        startTime: new Date().toISOString(),
        stage: wo.stage, description: wo.description // Required by API validation
      };
    } else if (action === 'complete') {
      const endTime = new Date();
      const startTime = wo.startTime ? new Date(wo.startTime) : endTime;
      const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);

      payload = {
        status: 'COMPLETED',
        endTime: endTime.toISOString(),
        actualHours: durationHours.toFixed(2),
        stage: wo.stage, description: wo.description
      };
    } else if (action === 'reset') {
      payload = {
        status: 'PENDING',
        startTime: null,
        endTime: null,
        actualHours: null,
        stage: wo.stage, description: wo.description
      };
    }

    try {
      const res = await fetch(`/api/manufacturing/work-orders/${workOrderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setToast({ message: `Work Order ${action}ed successfully`, type: 'success' });
        fetchProductionOrder();
      } else {
        setToast({ message: 'Failed to update work order', type: 'error' });
      }
    } catch (e) {
      console.error(e);
      setToast({ message: 'Error connecting to server', type: 'error' });
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin text-[#3498DB]" size={32} />
        </div>
      </Layout>
    );
  }

  if (!productionOrder) {
    return (
      <Layout>
        <div className="text-center py-8">
          <p className="text-gray-500">Amarka lama helin</p>
          <button onClick={() => router.push('/manufacturing')} className="mt-4 text-[#3498DB] underline">Go Back</button>
        </div>
      </Layout>
    );
  }

  const totalMaterialCost = (productionOrder.billOfMaterials || []).reduce((sum, bom) => sum + (Number(bom.totalCost) || 0), 0);
  const totalEstimatedHours = (productionOrder.workOrders || []).reduce((sum, wo) => sum + (Number(wo.estimatedHours) || 0), 0);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
          <a href="/manufacturing" className="hover:text-blue-600">Factory OS</a>
          <ChevronRight className="w-4 h-4" />
          <a href="/manufacturing/production-orders" className="hover:text-blue-600">Production Orders</a>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 font-bold">{productionOrder.orderNumber}</span>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
              {productionOrder.orderNumber}
              <span className={`px-3 py-1.5 rounded-xl text-sm font-bold border ${getStatusColor(productionOrder.status)} border-transparent`}>
                {getStatusText(productionOrder.status)}
              </span>
            </h1>
            <p className="text-gray-500 font-medium mt-1">{productionOrder.productName}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {productionOrder.status !== 'COMPLETED' && (
              <button
                onClick={() => updateStatus('COMPLETED')}
                disabled={completing}
                className="bg-green-600 text-white px-5 py-2.5 rounded-xl hover:bg-green-700 flex items-center gap-2 shadow-lg shadow-green-500/20 font-bold transition-all hover:-translate-y-0.5"
              >
                {completing ? <Loader2 className="animate-spin w-4 h-4" /> : <CheckCircle className="w-5 h-5" />}
                Complete Order
              </button>
            )}

            <button
              onClick={() => router.push(`/manufacturing/production-orders/${productionOrderId}/edit`)}
              className="bg-[#3498DB] text-white px-5 py-2.5 rounded-xl hover:bg-blue-600 shadow-lg shadow-blue-500/20 font-bold transition-all hover:-translate-y-0.5 flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-50 text-red-600 px-5 py-2.5 rounded-xl hover:bg-red-100 font-bold transition-colors flex items-center gap-2"
            >
              {deleting ? <Loader2 className="animate-spin w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
            </button>
          </div>
        </div>


        {/* Basic Information */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold mb-4 text-gray-800">Order Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase">Quantity</p>
                <p className="font-bold text-gray-900 text-lg">{productionOrder.quantity} <span className="text-sm font-medium text-gray-400">units</span></p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase">Due Date</p>
                <p className="font-bold text-gray-900 text-lg">
                  {productionOrder.dueDate ? new Date(productionOrder.dueDate).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase">Est. Material Cost</p>
                <p className="font-bold text-gray-900 text-lg">${totalMaterialCost.toFixed(2)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Clock className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase">Est. Hours</p>
                <p className="font-bold text-gray-900 text-lg">{totalEstimatedHours} <span className="text-sm font-medium text-gray-400">hrs</span></p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 items-start">
            <div className="mt-1"><RefreshCw size={16} className="text-gray-400" /></div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase mb-1">Notes</p>
              <p className="text-sm text-gray-600 font-medium">{productionOrder.notes || 'No additional notes provided.'}</p>
            </div>
          </div>
        </div>

        {/* Work Orders (Execution) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <div className="w-2 h-6 bg-[#3498DB] rounded-full"></div>
              Production Stages
            </h2>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{productionOrder?.workOrders?.length || 0} Stages</span>
          </div>

          {(productionOrder.workOrders || []).length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <Clock className="mx-auto text-gray-300 mb-2" size={32} />
              <p className="text-gray-500">No work orders defined.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {(productionOrder.workOrders || []).map((workOrder, index) => (
                <div key={workOrder.id || index} className={`
                    border rounded-xl p-5 transition-all
                    ${workOrder.status === 'IN_PROGRESS' ? 'border-[#3498DB] ring-1 ring-[#3498DB]/20 bg-blue-50/20' :
                    workOrder.status === 'COMPLETED' ? 'border-green-200 bg-green-50/30' : 'border-gray-200'}
                `}>
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`
                            w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                            ${workOrder.status === 'COMPLETED' ? 'bg-green-100 text-green-600' :
                          workOrder.status === 'IN_PROGRESS' ? 'bg-blue-100 text-[#3498DB] animate-pulse' : 'bg-gray-100 text-gray-500'}
                        `}>
                        {workOrder.status === 'COMPLETED' ? <CheckCircle size={18} /> : (index + 1)}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">{workOrder.stage}</h3>
                        <p className="text-sm text-gray-500 font-medium">{workOrder.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right mr-4 hidden md:block">
                        <p className="text-xs text-gray-400 font-bold uppercase">Timer</p>
                        <p className="font-mono text-lg font-bold text-gray-700">
                          {workOrder.actualHours ? `${workOrder.actualHours} hrs` :
                            workOrder.startTime ? 'Running...' :
                              `${workOrder.estimatedHours} hrs est.`}
                        </p>
                      </div>

                      {workOrder.status === 'PENDING' && (
                        <button
                          onClick={() => handleWorkOrderAction(workOrder.id, 'start')}
                          className="px-4 py-2 bg-[#3498DB] text-white rounded-lg font-bold text-sm hover:bg-blue-600 flex items-center gap-2 shadow-lg shadow-blue-500/20"
                        >
                          <Play size={16} fill="currentColor" /> Start
                        </button>
                      )}

                      {workOrder.status === 'IN_PROGRESS' && (
                        <button
                          onClick={() => handleWorkOrderAction(workOrder.id, 'complete')}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold text-sm hover:bg-green-700 flex items-center gap-2 animate-pulse"
                        >
                          <Square size={16} fill="currentColor" /> Complete
                        </button>
                      )}

                      {workOrder.status === 'COMPLETED' && (
                        <button
                          disabled
                          className="px-4 py-2 bg-gray-100 text-gray-400 rounded-lg font-bold text-sm flex items-center gap-2 cursor-not-allowed"
                        >
                          <CheckCircle size={16} /> Done
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bill of Materials */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold mb-4 text-gray-800">Bill of Materials</h2>
          {(productionOrder.billOfMaterials || []).length === 0 ? (
            <p className="text-gray-500 text-center py-4">No materials registered.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Material</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider hidden md:table-cell">Unit Cost</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {(productionOrder.billOfMaterials || []).map((bom, index) => (
                    <tr key={bom.id || index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        {bom.materialName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                        {bom.quantity} <span className="text-xs text-gray-400">{bom.unit}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium hidden md:table-cell">
                        ${Number(bom.costPerUnit).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                        ${Number(bom.totalCost).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </Layout>
  );
}
