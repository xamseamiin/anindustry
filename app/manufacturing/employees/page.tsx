'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Plus, Search, Filter, Users, User, Phone, Mail,
    MoreVertical, Clock, DollarSign, Loader2, RefreshCcw, Briefcase
} from 'lucide-react';

export default function FactoryEmployeesPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ totalUnpaidWages: 0 });

    const fetchEmployees = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/manufacturing/employees');
            if (res.ok) {
                const data = await res.json();
                setEmployees(data.employees || []);
                setStats(data.stats || { totalUnpaidWages: 0 });
            }
        } catch (e) {
            console.error("Failed to load employees", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timeout = setTimeout(fetchEmployees, 300);
        return () => clearTimeout(timeout);
    }, [searchTerm]);

    const totalStaff = employees.length;
    const activeStaff = employees.filter(e => e.status === 'Active').length;

    // Filter logic
    const filteredEmployees = employees.filter(e =>
        e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col gap-6 p-2 lg:p-4 min-h-screen pb-20">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Employees</h1>
                    <p className="text-sm text-gray-500 font-medium">Manage factory staff, operators, and payroll.</p>
                </div>
                <Link href="/manufacturing/employees/add" className="px-5 py-2.5 bg-[#3498DB] hover:bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/30 flex items-center gap-2 transition-all hover:-translate-y-0.5">
                    <Plus size={18} /> Add Employee
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-[#3498DB] rounded-xl">
                        <Users size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Staff</p>
                        <p className="text-2xl font-black text-gray-900 dark:text-white leading-none mt-1">
                            {loading ? '-' : totalStaff}
                        </p>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4">
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-xl">
                        <Clock size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Staff</p>
                        <p className="text-2xl font-black text-gray-900 dark:text-white leading-none mt-1">
                            {loading ? '-' : activeStaff}
                        </p>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4">
                    <div className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-xl">
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Unpaid Wages</p>
                        <p className="text-2xl font-black text-gray-900 dark:text-white leading-none mt-1">
                            {loading ? '-' : `$${stats.totalUnpaidWages.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                        </p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col min-h-[400px]">
                {/* Toolbar */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full md:max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search name, role, department..."
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#3498DB] outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button onClick={fetchEmployees} className="p-2.5 bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-100 transition-colors">
                        {loading ? <Loader2 className="animate-spin" size={18} /> : <RefreshCcw size={18} />}
                    </button>
                </div>

                {/* Table */}
                <div className="overflow-x-auto flex-1">
                    {loading ? (
                        <div className="p-6 space-y-4">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="h-16 bg-gray-50 dark:bg-gray-900/50 rounded-xl animate-pulse"></div>
                            ))}
                        </div>
                    ) : filteredEmployees.length === 0 ? (
                        <div className="flex flex-col h-64 items-center justify-center text-gray-400 gap-4">
                            <Users size={48} className="opacity-20" />
                            <p>No employees found.</p>
                            <Link href="/manufacturing/employees/add" className="text-[#3498DB] hover:underline font-bold text-sm">Add your first employee</Link>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50/50 dark:bg-gray-900/50 text-xs uppercase text-gray-500 font-bold border-b border-gray-100 dark:border-gray-700">
                                <tr>
                                    <th className="px-6 py-4">Name</th>
                                    <th className="px-6 py-4">Role</th>
                                    <th className="px-6 py-4">Department</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {filteredEmployees.map((emp) => (
                                    <tr key={emp.id} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 text-[#3498DB] flex items-center justify-center text-xs font-bold border border-blue-200">
                                                    {emp.name.split(' ').map((n: string) => n[0]).join('')}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-900 dark:text-white text-sm">{emp.name}</div>
                                                    <div className="text-[10px] text-gray-400 font-mono">{emp.id.slice(0, 8)}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                                            {emp.role}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-bold">
                                                <Briefcase size={12} /> {emp.department}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase
                                                ${emp.status === 'Active' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}
                                            `}>
                                                {emp.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <Link href={`/manufacturing/employees/${emp.id}`} className="p-2 text-[#3498DB] hover:text-blue-700 font-bold transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg inline-flex items-center gap-1 text-xs">
                                                View Details
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
