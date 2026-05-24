'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Check, ChevronsUpDown, Plus, Search, X, Loader2, User } from 'lucide-react';
import { EmployeeFormModal } from '@/components/modals/EmployeeFormModal';

interface Employee {
    id: string;
    fullName: string;
    role?: string;
    category?: string;
    monthlySalary?: number;
}

interface EmployeeSelectProps {
    value: string;
    onChange: (value: string) => void;
    onEmployeeCreated?: (newEmployee: Employee) => void;
    error?: string;
    label?: string;
    placeholder?: string;
    filterCategory?: 'COMPANY' | 'PROJECT' | 'ALL'; // Filter by employee category
}

export function EmployeeSelect({
    value,
    onChange,
    onEmployeeCreated,
    error,
    label = "Dooro Shaqaalaha",
    placeholder = "Dooro shaqaale...",
    filterCategory = 'ALL'
}: EmployeeSelectProps) {
    const [open, setOpen] = useState(false);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal state
    const [showModal, setShowModal] = useState(false);

    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchEmployees();
    }, []);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const fetchEmployees = async () => {
        setLoading(true);
        try {
            console.log('[EmployeeSelect] Fetching employees from API...');
            const res = await fetch('/api/projects/employees');
            console.log('[EmployeeSelect] API response status:', res.status);

            if (res.ok) {
                const data = await res.json();
                console.log('[EmployeeSelect] Received employees:', data.employees?.length || 0);
                setEmployees(data.employees || []);
            } else {
                const errorData = await res.json().catch(() => ({ message: 'Unknown error' }));
                console.error('[EmployeeSelect] Failed to fetch employees:', res.status, errorData);
            }
        } catch (error) {
            console.error('[EmployeeSelect] Error fetching employees:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEmployeeCreated = async (newEmployee: Employee) => {
        console.log('[EmployeeSelect] New employee created:', newEmployee);

        // Refresh employees list from the API to ensure we have the latest data
        await fetchEmployees();

        // Select the newly created employee
        onChange(newEmployee.id);

        // Call parent callback if provided
        if (onEmployeeCreated) {
            onEmployeeCreated(newEmployee);
        }

        setShowModal(false);
        setOpen(false);
    };

    // Filter employees by category if specified
    const filteredEmployees = employees
        .filter(emp => filterCategory === 'ALL' || emp.category === filterCategory)
        .filter(emp => emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()));

    const selectedEmployee = employees.find(e => e.id === value);

    return (
        <div className="relative" ref={wrapperRef}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {label}
            </label>

            <div
                className={`w-full flex items-center justify-between px-3 py-2 border rounded-xl bg-white dark:bg-gray-800 cursor-pointer hover:border-blue-500 transition-colors ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                onClick={() => setOpen(!open)}
            >
                <div className="flex items-center gap-2 overflow-hidden">
                    {selectedEmployee ? (
                        <div className="flex flex-col items-start">
                            <span className="font-medium text-gray-900 dark:text-white truncate">{selectedEmployee.fullName}</span>
                            {selectedEmployee.role && (
                                <span className="text-xs text-gray-500">{selectedEmployee.role}</span>
                            )}
                        </div>
                    ) : (
                        <span className="text-gray-500">{placeholder}</span>
                    )}
                </div>
                <ChevronsUpDown className="w-4 h-4 text-gray-400" />
            </div>

            {open && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-2 border-b border-gray-100 dark:border-gray-700">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Raadi shaqaale..."
                                className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="max-h-60 overflow-y-auto p-1">
                        {loading ? (
                            <div className="flex items-center justify-center py-4 text-gray-400">
                                <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading...
                            </div>
                        ) : filteredEmployees.length === 0 ? (
                            <div className="p-4 text-center">
                                <p className="text-sm text-gray-500 mb-2">Shaqaale lama helin</p>
                                <button
                                    onClick={() => {
                                        setOpen(false);
                                        setShowModal(true);
                                    }}
                                    className="text-sm text-blue-600 hover:text-blue-700 font-medium inline-flex items-center"
                                >
                                    <Plus className="w-4 h-4 mr-1" /> Ku dar shaqaale cusub
                                </button>
                            </div>
                        ) : (
                            <>
                                {filteredEmployees.map((employee) => (
                                    <div
                                        key={employee.id}
                                        className={`flex items-center justify-between px-3 py-2 text-sm rounded-lg cursor-pointer ${value === employee.id
                                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                            : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-200'
                                            }`}
                                        onClick={() => {
                                            onChange(employee.id);
                                            setOpen(false);
                                        }}
                                    >
                                        <div className="flex flex-col">
                                            <span className="font-medium">{employee.fullName}</span>
                                            {employee.role && <span className="text-xs text-gray-500">{employee.role}</span>}
                                        </div>
                                        {value === employee.id && <Check className="w-4 h-4" />}
                                    </div>
                                ))}
                            </>
                        )}
                    </div>

                    <div className="p-2 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                        <button
                            onClick={() => {
                                setOpen(false);
                                setShowModal(true);
                            }}
                            className="w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Plus className="w-4 h-4 mr-2" /> Shaqaale Cusub
                        </button>
                    </div>
                </div>
            )}

            {/* Employee Form Modal */}
            <EmployeeFormModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSuccess={handleEmployeeCreated}
                initialCategory={filterCategory === 'PROJECT' ? 'PROJECT' : 'COMPANY'}
            />

            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
    );
}
