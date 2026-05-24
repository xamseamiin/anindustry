
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Check, ChevronsUpDown, Plus, Search, X, Loader2, DollarSign } from 'lucide-react';

interface Vendor {
    id: string;
    name: string;
    balance?: number; // Optional balance
}

interface VendorSelectProps {
    value: string;
    onChange: (value: string) => void;
    onVendorCreated?: (newVendor: Vendor) => void;
    error?: string;
    vendorType?: 'project' | 'company'; // NEW: which vendor list to use
}

export function VendorSelect({ value, onChange, onVendorCreated, error, vendorType = 'company' }: VendorSelectProps) {
    const [open, setOpen] = useState(false);
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // New Vendor State
    const [isCreating, setIsCreating] = useState(false);
    const [newVendorName, setNewVendorName] = useState('');
    const [creatingLoader, setCreatingLoader] = useState(false);

    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchVendors();
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

    const fetchVendors = async () => {
        setLoading(true);
        try {
            const apiUrl = vendorType === 'project' ? '/api/projects/vendors' : '/api/projects/vendors';
            const res = await fetch(apiUrl);
            if (res.ok) {
                const data = await res.json();
                setVendors(data.vendors || []);
            }
        } catch (error) {
            console.error('Error fetching vendors:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateVendor = async () => {
        if (!newVendorName.trim()) return;
        setCreatingLoader(true);
        try {
            const apiUrl = vendorType === 'project' ? '/api/projects/vendors' : '/api/projects/vendors';
            const res = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newVendorName, type: 'Material' }),
            });

            if (res.ok) {
                const data = await res.json();
                const newVendor = data.vendor;
                if (newVendor) {
                    setVendors(prev => [...prev, newVendor]);
                    onChange(newVendor.id);
                    if (onVendorCreated) onVendorCreated(newVendor);
                    setIsCreating(false);
                    setNewVendorName('');
                    setOpen(false);
                }
            }
        } catch (error) {
            console.error('Error creating vendor:', error);
        } finally {
            setCreatingLoader(false);
        }
    };

    const filteredVendors = vendors.filter(vendor =>
        vendor.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedVendor = vendors.find(v => v.id === value);

    return (
        <div className="relative" ref={wrapperRef}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Vendor (Alaab-leyda)
            </label>

            <div
                className={`w-full flex items-center justify-between px-3 py-2 border rounded-xl bg-white dark:bg-gray-800 cursor-pointer hover:border-blue-500 transition-colors ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                onClick={() => setOpen(!open)}
            >
                <div className="flex items-center gap-2 overflow-hidden">
                    {selectedVendor ? (
                        <div className="flex flex-col items-start">
                            <span className="font-medium text-gray-900 dark:text-white truncate">{selectedVendor.name}</span>
                            {selectedVendor.balance !== undefined && (
                                <span className={`text-xs ${selectedVendor.balance > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                    {selectedVendor.balance > 0 ? `Lagu leeyahay: $${selectedVendor.balance}` : `Horey u bixisay: $${Math.abs(selectedVendor.balance)}`}
                                </span>
                            )}
                        </div>
                    ) : (
                        <span className="text-gray-500">Dooro Vendor...</span>
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
                                        placeholder="Raadi vendor..."
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
                                ) : filteredVendors.length === 0 ? (
                                    <div className="p-4 text-center">
                                        <p className="text-sm text-gray-500 mb-2">Vendor lama helin</p>
                                        <button
                                            onClick={() => setIsCreating(true)}
                                            className="text-sm text-blue-600 hover:text-blue-700 font-medium inline-flex items-center"
                                        >
                                            <Plus className="w-4 h-4 mr-1" /> Ku dar "{searchTerm}"
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        {filteredVendors.map((vendor) => (
                                            <div
                                                key={vendor.id}
                                                className={`flex items-center justify-between px-3 py-2 text-sm rounded-lg cursor-pointer ${value === vendor.id
                                                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-200'
                                                    }`}
                                                onClick={() => {
                                                    onChange(vendor.id);
                                                    setOpen(false);
                                                }}
                                            >
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{vendor.name}</span>
                                                    {/* We can verify this API field later */}
                                                    {/* <span className="text-xs text-gray-500">Balance: $0.00</span> */}
                                                </div>
                                                {value === vendor.id && <Check className="w-4 h-4" />}
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
                                    <Plus className="w-4 h-4 mr-2" /> Vendor Cusub
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Vendor Cusub</h3>
                                <button
                                    onClick={() => setIsCreating(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Magaca</label>
                                    <input
                                        type="text"
                                        value={newVendorName}
                                        onChange={(e) => setNewVendorName(e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        placeholder="Gali magaca..."
                                        autoFocus
                                    />
                                </div>

                                <button
                                    onClick={handleCreateVendor}
                                    disabled={!newVendorName.trim() || creatingLoader}
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
