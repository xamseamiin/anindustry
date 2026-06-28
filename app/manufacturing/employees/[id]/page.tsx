'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
    ArrowLeft, User, Phone, Mail, Briefcase, Calendar, 
    Clock, DollarSign, Activity, Wallet, TrendingUp,
    CheckCircle2, AlertCircle, FileText, Loader2,
    ChevronRight, MapPin
} from 'lucide-react';

export default function EmployeeDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [employee, setEmployee] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        const fetchEmployee = async () => {
            try {
                const res = await fetch(`/api/manufacturing/employees/${params.id}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.success) {
                        setEmployee(data.employee);
                    }
                }
            } catch (error) {
                console.error("Failed to load employee:", error);
            } finally {
                setLoading(false);
            }
        };

        if (params.id) {
            fetchEmployee();
        }
    }, [params.id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-[#3498DB]" />
            </div>
        );
    }

    if (!employee) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <AlertCircle className="w-12 h-12 text-red-500" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Employee Not Found</h2>
                <p className="text-gray-500">The employee you are looking for does not exist.</p>
                <button onClick={() => router.back()} className="px-4 py-2 mt-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-colors">
                    Go Back
                </button>
            </div>
        );
    }

    const { dailyCalculations, monthlyCalculations, commissionCalculations } = employee;

    return (
        <div className="flex flex-col gap-6 p-2 lg:p-4 min-h-screen pb-20 max-w-7xl mx-auto">
            {/* Header / Breadcrumb */}
            <div className="flex items-center gap-4">
                <Link href="/manufacturing/employees" className="p-2.5 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all border border-gray-100 dark:border-gray-700 shadow-sm">
                    <ArrowLeft size={18} />
                </Link>
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                        {employee.fullName}
                        <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold ${employee.isActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                            {employee.isActive ? 'Active' : 'Inactive'}
                        </span>
                    </h1>
                    <div className="flex items-center gap-2 text-sm text-gray-500 font-medium mt-1">
                        <Link href="/manufacturing/employees" className="hover:text-[#3498DB] transition-colors">Employees</Link>
                        <ChevronRight size={14} className="opacity-50" />
                        <span className="text-gray-900 dark:text-gray-300">{employee.id.slice(0,8)}</span>
                    </div>
                </div>
            </div>
            
            <div className="flex justify-end">
                <Link href={`/manufacturing/employees/${employee.id}/edit`} className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-bold rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm">
                    Edit Employee
                </Link>
            </div>

            {/* Profile Summary & Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile Card */}
                <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-blue-500/20 to-purple-500/20 dark:from-blue-500/10 dark:to-purple-500/10"></div>
                    
                    <div className="relative z-10 flex flex-col items-center mt-4">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#3498DB] to-blue-600 text-white flex items-center justify-center text-3xl font-black shadow-lg shadow-blue-500/30 border-4 border-white dark:border-gray-800">
                            {employee.fullName.split(' ').map((n: string) => n[0]).join('').substring(0,2)}
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-4">{employee.fullName}</h2>
                        <p className="text-sm font-medium text-gray-500 bg-gray-100 dark:bg-gray-900 px-3 py-1 rounded-full mt-2">
                            {employee.role}
                        </p>
                    </div>

                    <div className="mt-8 space-y-4">
                        <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                            <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-400">
                                <Briefcase size={16} />
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-bold text-gray-400">Department</p>
                                <p className="font-medium">{employee.department || 'N/A'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                            <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-400">
                                <Phone size={16} />
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-bold text-gray-400">Phone</p>
                                <p className="font-medium">{employee.phone || employee.phoneNumber || 'N/A'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                            <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-400">
                                <Calendar size={16} />
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-bold text-gray-400">Joined Date</p>
                                <p className="font-medium">{new Date(employee.createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Compensation Cards */}
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Monthly Salary Card */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between group hover:border-[#3498DB]/30 transition-colors">
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-[#3498DB] rounded-xl group-hover:scale-110 transition-transform">
                                    <Wallet size={24} />
                                </div>
                                <span className="text-xs font-bold px-2.5 py-1 bg-gray-100 dark:bg-gray-900 text-gray-500 rounded-lg">Monthly</span>
                            </div>
                            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Base Salary</p>
                            <p className="text-3xl font-black text-gray-900 dark:text-white mt-1">
                                ${monthlyCalculations.monthlySalary.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                        <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center text-sm">
                            <span className="text-gray-500">Paid this month:</span>
                            <span className="font-bold text-green-600">${monthlyCalculations.salaryPaidThisMonth.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                    </div>

                    {/* Daily Wages Card */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between group hover:border-purple-500/30 transition-colors">
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-xl group-hover:scale-110 transition-transform">
                                    <Clock size={24} />
                                </div>
                                <span className="text-xs font-bold px-2.5 py-1 bg-gray-100 dark:bg-gray-900 text-gray-500 rounded-lg">Daily / Labor</span>
                            </div>
                            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Total Earned</p>
                            <p className="text-3xl font-black text-gray-900 dark:text-white mt-1">
                                ${dailyCalculations.totalEarned.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                        <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center text-sm">
                            <span className="text-gray-500">Total Paid: <span className="font-bold text-green-600">${dailyCalculations.totalPaid.toLocaleString()}</span></span>
                            <span className="text-gray-500">Balance: <span className="font-bold text-amber-600">${dailyCalculations.balance.toLocaleString()}</span></span>
                        </div>
                    </div>

                    {/* Production Earnings Card */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between group hover:border-emerald-500/30 transition-colors">
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform">
                                    <Activity size={24} />
                                </div>
                                <span className="text-xs font-bold px-2.5 py-1 bg-gray-100 dark:bg-gray-900 text-gray-500 rounded-lg">Production</span>
                            </div>
                            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Production Earnings</p>
                            <p className="text-3xl font-black text-gray-900 dark:text-white mt-1">
                                {employee.productionCalculations?.totalEarned ? `${employee.productionCalculations.totalEarned.toLocaleString(undefined, { minimumFractionDigits: 2 })} ETB` : '0.00 ETB'}
                            </p>
                        </div>
                        <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center text-sm">
                            <span className="text-gray-500">Linked to production:</span>
                            <span className="font-bold text-emerald-600">{employee.isPercentageLinked ? `Yes (${employee.productionRate}%)` : 'No'}</span>
                        </div>
                    </div>

                    {/* Commissions / Sales Card */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between group hover:border-blue-500/30 transition-colors">
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-[#3498DB] rounded-xl group-hover:scale-110 transition-transform">
                                    <TrendingUp size={24} />
                                </div>
                                <span className="text-xs font-bold px-2.5 py-1 bg-gray-100 dark:bg-gray-900 text-gray-500 rounded-lg">Sales</span>
                            </div>
                            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Sales Volume (Commission)</p>
                            <p className="text-3xl font-black text-gray-900 dark:text-white mt-1">
                                ${commissionCalculations.totalSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                        <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center text-sm">
                            <span className="text-gray-500">Sales recorded:</span>
                            <span className="font-bold text-blue-600">{employee.sales?.length || 0}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Detailed Tabs */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="flex border-b border-gray-100 dark:border-gray-700 overflow-x-auto no-scrollbar">
                    <button 
                        onClick={() => setActiveTab('overview')}
                        className={`px-6 py-4 text-sm font-bold transition-all whitespace-nowrap border-b-2 ${activeTab === 'overview' ? 'border-[#3498DB] text-[#3498DB] bg-blue-50/50 dark:bg-blue-900/10' : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
                    >
                        Daily Labor Records
                    </button>
                    <button 
                        onClick={() => setActiveTab('production')}
                        className={`px-6 py-4 text-sm font-bold transition-all whitespace-nowrap border-b-2 ${activeTab === 'production' ? 'border-[#3498DB] text-[#3498DB] bg-blue-50/50 dark:bg-blue-900/10' : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
                    >
                        Production Earnings (Wax-soo-saarka)
                    </button>
                    <button 
                        onClick={() => setActiveTab('sales')}
                        className={`px-6 py-4 text-sm font-bold transition-all whitespace-nowrap border-b-2 ${activeTab === 'sales' ? 'border-[#3498DB] text-[#3498DB] bg-blue-50/50 dark:bg-blue-900/10' : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
                    >
                        Sales & Commissions
                    </button>
                </div>

                <div className="p-6">
                    {activeTab === 'overview' && (
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Labor History</h3>
                            {employee.companyLaborRecords?.length === 0 && employee.laborRecords?.length === 0 ? (
                                <div className="text-center py-10 text-gray-500">
                                    <Activity className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                    <p>No daily labor records found for this employee.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-gray-50/50 dark:bg-gray-900/50 text-xs uppercase text-gray-500 font-bold border-b border-gray-100 dark:border-gray-700">
                                            <tr>
                                                <th className="px-4 py-3">Date</th>
                                                <th className="px-4 py-3">Type</th>
                                                <th className="px-4 py-3">Description</th>
                                                <th className="px-4 py-3 text-right">Agreed Wage</th>
                                                <th className="px-4 py-3 text-right">Paid</th>
                                                <th className="px-4 py-3 text-right">Balance</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                            {/* Combine and sort labor records */}
                                            {[...employee.companyLaborRecords.map((r:any) => ({...r, type: 'Company'})), 
                                              ...employee.laborRecords.map((r:any) => ({...r, type: 'Project'}))]
                                              .sort((a,b) => new Date(b.dateWorked).getTime() - new Date(a.dateWorked).getTime())
                                              .map((record: any, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300">
                                                        {new Date(record.dateWorked).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`text-[10px] px-2 py-1 rounded-md font-bold uppercase ${record.type === 'Company' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                                            {record.type} Labor
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                                        {record.description || (record.project ? `Project: ${record.project.name}` : '-')}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm font-medium text-right text-gray-900 dark:text-white">
                                                        ${Number(record.agreedWage || 0).toFixed(2)}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm font-medium text-right text-green-600">
                                                        ${Number(record.paidAmount || 0).toFixed(2)}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm font-medium text-right text-amber-600">
                                                        ${(Number(record.agreedWage || 0) - Number(record.paidAmount || 0)).toFixed(2)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'sales' && (
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Sales History</h3>
                            {employee.sales?.length === 0 ? (
                                <div className="text-center py-10 text-gray-500">
                                    <Activity className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                    <p>No sales records found. Commission tracking requires sales assigned to this employee.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-gray-50/50 dark:bg-gray-900/50 text-xs uppercase text-gray-500 font-bold border-b border-gray-100 dark:border-gray-700">
                                            <tr>
                                                <th className="px-4 py-3">Date</th>
                                                <th className="px-4 py-3">Invoice</th>
                                                <th className="px-4 py-3">Status</th>
                                                <th className="px-4 py-3 text-right">Total Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                            {employee.sales.map((sale: any) => (
                                                <tr key={sale.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300">
                                                        {new Date(sale.createdAt).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm font-mono text-gray-600 dark:text-gray-400">
                                                        {sale.invoiceNumber}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="text-[10px] px-2 py-1 rounded-md font-bold uppercase bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-300">
                                                            {sale.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm font-bold text-right text-gray-900 dark:text-white">
                                                        ${Number(sale.total || 0).toFixed(2)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'production' && (
                        <div>
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Daily Production & Earnings</h3>
                                {employee.isPercentageLinked && (
                                    <div className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-500/15 text-xs font-bold rounded-xl">
                                        Production Rate: {employee.productionRate}%
                                    </div>
                                )}
                            </div>

                            {!employee.isPercentageLinked ? (
                                <div className="text-center py-10 bg-gray-50 dark:bg-gray-900/20 rounded-2xl border border-dashed border-gray-250 dark:border-white/5 text-gray-500">
                                    <AlertCircle className="w-12 h-12 mx-auto mb-3 text-amber-500 opacity-60 animate-bounce" />
                                    <h4 className="font-bold text-gray-800 dark:text-gray-200">Shaqaalahan kuma xidhna Waxsoosaarka</h4>
                                    <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">Taariikhda oo ku dar boqolleyda waxsoosaarka si aad u bilowdo xisaabinta dakhliga waxsoosaarka ee maalinlaha ah.</p>
                                    <Link href={`/manufacturing/employees/${employee.id}/edit`} className="inline-block mt-4 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white dark:text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl transition-all">
                                        Edit Employee
                                    </Link>
                                </div>
                            ) : employee.productionCalculations?.earningsList?.length === 0 ? (
                                <div className="text-center py-10 text-gray-500">
                                    <Activity className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                    <p>No completed production/work orders found for this employee.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-gray-50/50 dark:bg-gray-900/50 text-xs uppercase text-gray-500 font-bold border-b border-gray-100 dark:border-gray-700">
                                            <tr>
                                                <th className="px-4 py-3">Taariikhda / Date</th>
                                                <th className="px-4 py-3">Alaabta / Product</th>
                                                <th className="px-4 py-3 text-right">Qadarka / Qty</th>
                                                <th className="px-4 py-3 text-right">Qiimaha / Bottle Value</th>
                                                <th className="px-4 py-3 text-right">Rate</th>
                                                <th className="px-4 py-3 text-right">Dakhliga / Earned</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                            {employee.productionCalculations.earningsList.map((item: any, idx: number) => (
                                                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300">
                                                        {new Date(item.date).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm font-bold text-gray-700 dark:text-gray-300">
                                                        {item.productName}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm font-medium text-right text-gray-900 dark:text-white font-mono">
                                                        {item.quantity.toLocaleString()} pcs
                                                    </td>
                                                    <td className="px-4 py-3 text-sm font-medium text-right text-gray-500 dark:text-slate-400 font-mono">
                                                        {Number(item.sellingPrice).toFixed(2)} ETB
                                                    </td>
                                                    <td className="px-4 py-3 text-sm font-bold text-right text-sky-500 font-mono">
                                                        {item.rate}%
                                                    </td>
                                                    <td className="px-4 py-3 text-sm font-black text-right text-emerald-600 dark:text-emerald-400 font-mono">
                                                        {Number(item.earned).toLocaleString(undefined, { minimumFractionDigits: 2 })} ETB
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
