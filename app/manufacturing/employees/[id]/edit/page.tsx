'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Loader2, User as UserIcon } from 'lucide-react';
import Toast from '@/components/common/Toast';

export default function EditEmployeePage() {
    const router = useRouter();
    const params = useParams();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const [formData, setFormData] = useState<any>({
        fullName: '',
        role: '',
        department: '',
        phone: '',
        status: 'Active',
        monthlySalary: ''
    });

    const departments = ['Production', 'Quality Control', 'Inventory', 'Packaging', 'Management', 'Maintenance'];
    const roles = ['Operator', 'Technician', 'Supervisor', 'Manager', 'Worker', 'Inspector'];

    useEffect(() => {
        const fetchEmployee = async () => {
            try {
                const res = await fetch(`/api/manufacturing/employees/${params.id}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.success) {
                        setFormData({
                            fullName: data.employee.fullName || '',
                            role: data.employee.role || '',
                            department: data.employee.department || '',
                            phone: data.employee.phone || data.employee.phoneNumber || '',
                            status: data.employee.isActive ? 'Active' : 'Inactive',
                            monthlySalary: data.employee.monthlySalary || ''
                        });
                    }
                }
            } catch (error) {
                console.error("Failed to fetch employee", error);
                setToast({ message: 'Error loading employee details.', type: 'error' });
            } finally {
                setFetching(false);
            }
        };

        if (params.id) {
            fetchEmployee();
        }
    }, [params.id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (!formData.fullName || !formData.role) {
            setToast({ message: 'Please fill in all required fields.', type: 'error' });
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`/api/manufacturing/employees/${params.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    isActive: formData.status === 'Active'
                })
            });

            if (!response.ok) throw new Error('Failed to update employee');

            setToast({ message: 'Employee updated successfully!', type: 'success' });
            setTimeout(() => router.push(`/manufacturing/employees/${params.id}`), 1000);

        } catch (error) {
            setToast({ message: 'Error updating employee.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [field]: value }));
    };

    if (fetching) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-[#3498DB]" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 p-2 lg:p-4 min-h-screen pb-20">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href={`/manufacturing/employees/${params.id}`} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white">Edit Employee</h1>
                    <p className="text-sm font-medium text-gray-500">Update staff member details</p>
                </div>
            </div>

            <div className="max-w-2xl mx-auto w-full">
                <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-6">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 rounded-lg bg-blue-50 text-[#3498DB]">
                            <UserIcon size={20} />
                        </div>
                        <h3 className="font-bold text-gray-900 dark:text-white">Personal Information</h3>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Full Name *</label>
                        <input
                            type="text"
                            required
                            value={formData.fullName}
                            onChange={(e) => handleInputChange('fullName', e.target.value)}
                            className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-[#3498DB] outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Phone Number</label>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-[#3498DB] outline-none"
                        />
                    </div>

                    <div className="flex items-center gap-2 mb-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                        <h3 className="font-bold text-gray-900 dark:text-white">Job Details</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Department</label>
                            <select
                                value={formData.department}
                                onChange={(e) => handleInputChange('department', e.target.value)}
                                className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-[#3498DB] outline-none"
                            >
                                {departments.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Role / Position</label>
                            <input
                                type="text"
                                list="roles"
                                required
                                value={formData.role}
                                onChange={(e) => handleInputChange('role', e.target.value)}
                                className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-[#3498DB] outline-none"
                            />
                            <datalist id="roles">
                                {roles.map(r => <option key={r} value={r} />)}
                            </datalist>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Monthly Salary / Base Pay</label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={formData.monthlySalary || ''}
                                onChange={(e) => handleInputChange('monthlySalary', e.target.value)}
                                className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-[#3498DB] outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Status</label>
                            <select
                                value={formData.status}
                                onChange={(e) => handleInputChange('status', e.target.value)}
                                className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-[#3498DB] outline-none"
                            >
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-4 flex gap-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-4 bg-[#3498DB] hover:bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                            Save Changes
                        </button>
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="px-6 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200 transition"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}
