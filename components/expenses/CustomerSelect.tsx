'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Check, ChevronsUpDown, Plus, Search, X, Loader2, Users } from 'lucide-react';

interface Customer {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
}

interface CustomerSelectProps {
    value: string;
    onChange: (value: string) => void;
    onCustomerCreated?: (newCustomer: Customer) => void;
    error?: string;
    label?: string;
    placeholder?: string;
}

export function CustomerSelect({
    value,
    onChange,
    onCustomerCreated,
    error,
    label = "Dooro Macmiilka",
    placeholder = "Dooro macmiil..."
}: CustomerSelectProps) {
    const [open, setOpen] = useState(false);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // New Customer State
    const [isCreating, setIsCreating] = useState(false);
    const [newCustomerName, setNewCustomerName] = useState('');
    const [newCustomerEmail, setNewCustomerEmail] = useState('');
    const [newCustomerPhone, setNewCustomerPhone] = useState('');
    const [newCustomerAddress, setNewCustomerAddress] = useState('');
    const [creatingLoader, setCreatingLoader] = useState(false);

    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchCustomers();
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

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/projects/customers');
            if (res.ok) {
                const data = await res.json();
                setCustomers(data.customers || []);
            }
        } catch (error) {
            console.error('Error fetching customers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCustomer = async () => {
        if (!newCustomerName.trim()) return;
        setCreatingLoader(true);
        try {
            const res = await fetch('/api/projects/customers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newCustomerName,
                    email: newCustomerEmail || undefined,
                    phone: newCustomerPhone || undefined,
                    address: newCustomerAddress || undefined,
                }),
            });

            if (res.ok) {
                const data = await res.json();
                if (data.customer) {
                    setCustomers(prev => [...prev, data.customer]);
                    onChange(data.customer.id);
                    if (onCustomerCreated) onCustomerCreated(data.customer);
                    setIsCreating(false);
                    resetForm();
                    setOpen(false);
                }
            }
        } catch (error) {
            console.error('Error creating customer:', error);
        } finally {
            setCreatingLoader(false);
        }
    };

    const resetForm = () => {
        setNewCustomerName('');
        setNewCustomerEmail('');
        setNewCustomerPhone('');
        setNewCustomerAddress('');
    };

    const filteredCustomers = customers.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedCustomer = customers.find(c => c.id === value);

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
                    {selectedCustomer ? (
                        <div className="flex flex-col items-start">
                            <span className="font-medium text-gray-900 dark:text-white truncate">{selectedCustomer.name}</span>
                            {selectedCustomer.phone && (
                                <span className="text-xs text-gray-500">{selectedCustomer.phone}</span>
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
                    {!isCreating ? (
                        <>
                            <div className="p-2 border-b border-gray-100 dark:border-gray-700">
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Raadi macmiil..."
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
                                ) : filteredCustomers.length === 0 ? (
                                    <div className="p-4 text-center">
                                        <p className="text-sm text-gray-500 mb-2">Macmiil lama helin</p>
                                        <button
                                            onClick={() => setIsCreating(true)}
                                            className="text-sm text-blue-600 hover:text-blue-700 font-medium inline-flex items-center"
                                        >
                                            <Plus className="w-4 h-4 mr-1" /> Ku dar "{searchTerm}"
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        {filteredCustomers.map((customer) => (
                                            <div
                                                key={customer.id}
                                                className={`flex items-center justify-between px-3 py-2 text-sm rounded-lg cursor-pointer ${value === customer.id
                                                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-200'
                                                    }`}
                                                onClick={() => {
                                                    onChange(customer.id);
                                                    setOpen(false);
                                                }}
                                            >
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{customer.name}</span>
                                                    {customer.phone && <span className="text-xs text-gray-500">{customer.phone}</span>}
                                                </div>
                                                {value === customer.id && <Check className="w-4 h-4" />}
                                            </div>
                                        ))}
                                    </>
                                )}
                            </div>

                            <div className="p-2 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                                <button
                                    onClick={() => setIsCreating(true)}
                                    className="w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    <Plus className="w-4 h-4 mr-2" /> Macmiil Cusub
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Macmiil Cusub</h3>
                                <button
                                    onClick={() => {
                                        setIsCreating(false);
                                        resetForm();
                                    }}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Magaca *</label>
                                    <input
                                        type="text"
                                        value={newCustomerName}
                                        onChange={(e) => setNewCustomerName(e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        placeholder="Gali magaca..."
                                        autoFocus
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={newCustomerEmail}
                                        onChange={(e) => setNewCustomerEmail(e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        placeholder="email@example.com"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Phone</label>
                                    <input
                                        type="tel"
                                        value={newCustomerPhone}
                                        onChange={(e) => setNewCustomerPhone(e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        placeholder="+252..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Cinwaanka (Address)</label>
                                    <textarea
                                        value={newCustomerAddress}
                                        onChange={(e) => setNewCustomerAddress(e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        placeholder="Gali cinwaanka..."
                                        rows={2}
                                    />
                                </div>

                                <button
                                    onClick={handleCreateCustomer}
                                    disabled={!newCustomerName.trim() || creatingLoader}
                                    className="w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {creatingLoader ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Badbaadi'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
    );
}
