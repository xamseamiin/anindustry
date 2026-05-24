
import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, DollarSign, Package, AlertCircle, ScanLine, Loader2, UploadCloud, X, CheckCircle, ImageIcon } from 'lucide-react';
import { VendorSelect } from './VendorSelect';
import { toast } from 'sonner';

// Interface for Material Item
export interface MaterialItem {
    id: number;
    name: string;
    qty: number | '';
    price: number | ''; // Unit Price
    unit: string;
}

interface MaterialExpenseFormProps {
    materials: MaterialItem[];
    setMaterials: (materials: MaterialItem[]) => void;
    selectedVendor: string;
    setSelectedVendor: (vendor: string) => void;
    paymentStatus: string;
    setPaymentStatus: (status: string) => void;
    paidAmount: number | string;
    setPaidAmount: (amount: number | string) => void;
    expenseDate: string;
    setExpenseDate: (date: string) => void;
    invoiceNumber: string;
    setInvoiceNumber: (invoice: string) => void;
    totalAmount: number;
    setTotalAmount: (amount: number) => void;
    setReceiptImage: (file: File | null) => void;
    errors?: { [key: string]: string };
    vendorType?: 'project' | 'company'; // NEW: which vendor API to use
}

export function MaterialExpenseForm({
    materials,
    setMaterials,
    selectedVendor,
    setSelectedVendor,
    paymentStatus,
    setPaymentStatus,
    paidAmount,
    setPaidAmount,
    expenseDate,
    setExpenseDate,
    invoiceNumber,
    setInvoiceNumber,
    totalAmount,
    setTotalAmount,
    setReceiptImage,
    errors = {},
    vendorType = 'company',
}: MaterialExpenseFormProps) {

    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewFile, setPreviewFile] = useState<File | null>(null);

    // Calculate total whenever materials change
    useEffect(() => {
        // Only auto-calc if NOT currently analyzing (to avoid overriding AI total momentarily)
        if (!isAnalyzing) {
            const total = materials.reduce((sum, item) => {
                const qty = Number(item.qty) || 0;
                const price = Number(item.price) || 0;
                return sum + (qty * price);
            }, 0);
            if (total !== totalAmount) {
                setTotalAmount(total);
                // If status is PAID, auto-update paid amount to match new total
                if (paymentStatus === 'PAID') {
                    setPaidAmount(total);
                }
            }
        }
    }, [materials, setTotalAmount, isAnalyzing, totalAmount, paymentStatus, setPaidAmount]);

    // Handle paste event (Ctrl+V)
    useEffect(() => {
        const handlePaste = (e: ClipboardEvent) => {
            const items = e.clipboardData?.items;
            if (!items) return;

            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const file = items[i].getAsFile();
                    if (file) {
                        processReceiptFile(file);
                        e.preventDefault();
                        break;
                    }
                }
            }
        };

        document.addEventListener('paste', handlePaste);
        return () => {
            document.removeEventListener('paste', handlePaste);
        };
    }, []);

    // Clean up object URLs on unmount
    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    // Handle adding a new material row
    const addMaterial = () => {
        setMaterials([
            ...materials,
            { id: Date.now(), name: '', qty: '', price: '', unit: 'pcs' }
        ]);
    };

    // Handle removing a material row
    const removeMaterial = (id: number) => {
        if (materials.length > 1) {
            setMaterials(materials.filter(m => m.id !== id));
        }
    };

    // Handle updating a material row
    const updateMaterial = (id: number, field: keyof MaterialItem, value: string | number) => {
        setMaterials(materials.map(m => {
            if (m.id === id) {
                return { ...m, [field]: value };
            }
            return m;
        }));
    };

    // Process receipt file (shared by upload, drag-drop, and paste)
    const processReceiptFile = async (file: File) => {
        // Handle Telegram Desktop dragging where file.type might be empty
        const isImage = file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif)$/i.test(file.name) || file.type === '';
        
        if (!isImage) {
            toast.error('Fadlan sawir kaliya soo geli!');
            return;
        }

        // Show live preview immediately
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        setPreviewFile(file);

        // Set the file for final submission
        setReceiptImage(file);

        setIsAnalyzing(true);
        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await fetch('/api/analyze-receipt', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Server Error: ${response.status}`);
            }

            const data = await response.json();

            // Populate form with AI data
            if (data.items && Array.isArray(data.items)) {
                const newMaterials = data.items.map((item: any) => ({
                    id: Date.now() + Math.random(),
                    name: item.name || '',
                    qty: item.qty || 1,
                    price: item.price || 0,
                    unit: item.unit || 'pcs'
                }));
                setMaterials(newMaterials);
            }

            if (data.totalAmount) {
                setTotalAmount(Number(data.totalAmount));
            }

            toast.success('✅ Rasiidka si guul leh ayaa loo akhriyay!');

        } catch (error: any) {
            console.error('Error analyzing receipt:', error);
            toast.error(`Cilad: ${error.message || 'Lama akhrin karo'}`);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        await processReceiptFile(file);
    };

    const clearReceipt = () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        setPreviewFile(null);
        setReceiptImage(null);
    };

    // Drag and drop handlers
    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        
        // 1. First check for File objects (Desktop drag)
        if (files && files.length > 0) {
            const file = files[0];
            const isImage = file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif|heic)$/i.test(file.name) || file.type === '';
            if (isImage) {
                processReceiptFile(file);
                return;
            } else {
                toast.error(`Fadlan sawir soo geli! (File ah: ${file.name}, type: ${file.type})`);
                return;
            }
        }
        
        // 2. Look through items just in case Chrome hid it from files list
        if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
            for (let i = 0; i < e.dataTransfer.items.length; i++) {
                const item = e.dataTransfer.items[i];
                if (item.kind === 'file' && item.type.indexOf('image') !== -1) {
                    const file = item.getAsFile();
                    if (file) {
                        processReceiptFile(file);
                        return;
                    }
                }
            }
        }

        // 3. Alternative Telegram drag handling: checking HTML for img src
        const htmlData = e.dataTransfer.getData('text/html');
        if (htmlData) {
            const match = htmlData.match(/src="([^"]+)"/);
            if (match && match[1]) {
                const src = match[1];
                if (src.startsWith('data:image')) {
                    try {
                        const res = await fetch(src);
                        const blob = await res.blob();
                        const file = new File([blob], "telegram_receipt.png", { type: blob.type });
                        processReceiptFile(file);
                        return;
                    } catch (err) {
                        toast.error('Galdalool sawirka jiidaha (HTML base64)!');
                        return;
                    }
                } else if (src.startsWith('http')) {
                    toast.error('Waa URL sawir. Fadlan ku samee COPY SAWIRKA kadibna halkan ku dhufo Ctrl+V.');
                    return;
                } else if (src.startsWith('file://') || src.includes('C:\\')) {
                    toast.error('Browser-ku ma akhrin karo sawirka sababo dhanka amniga ah (Security Sandbox). Fadlan sawirka Telegram COPY Dheh, ka dibna halkan ku dhufo Ctrl+V.');
                    return;
                }
            }
        }

        // 4. Debug text
        const plainText = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('text/uri-list');
        if (plainText) {
             toast.error('Browser-kaagu ma qaadi karo qaabkan. Fadlan sawirka Telegram COPY Dheh, ka dibna halkan ku dhufo Ctrl+V.');
             return;
        }

        // 5. Tell the user what happened
        const types = Array.from(e.dataTransfer.types).join(', ');
        toast.error(`Ma arkin wax sawir ah (Types: ${types}). Fadlan COPY u dheh sawirka (Ctrl+C), ka dibna halkan ugu samee PASTE (Ctrl+V).`);
    };

    const materialUnits = ['pcs', 'kg', 'm', 'cm', 'l', 'm²', 'm³', 'ton', 'box', 'set', 'bag', 'roll', 'sheet'];

    return (
        <div className="space-y-6">

            {/* ═══ PREMIUM DRAG & DROP RECEIPT ZONE ═══ */}
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <ScanLine className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <h4 className="text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Smart Receipt Upload <span className="text-xs text-gray-400 font-normal normal-case">(Ikhtiyaari ah / Optional)</span></h4>
                    <span className="text-[10px] bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 px-2 py-0.5 rounded-full font-bold">AI</span>
                </div>

                {previewUrl ? (
                    /* === PREVIEW STATE === */
                    <div className="relative rounded-2xl overflow-hidden border-2 border-blue-300 dark:border-blue-600 shadow-xl bg-gray-50 dark:bg-gray-900">
                        {/* Preview image */}
                        <img
                            src={previewUrl}
                            alt="Receipt Preview"
                            className="w-full max-h-72 object-contain p-2"
                        />

                        {/* Overlay controls on top of image */}
                        <div className="absolute top-3 right-3 flex gap-2">
                            <button
                                type="button"
                                onClick={clearReceipt}
                                className="bg-red-500 text-white p-2 rounded-xl shadow-lg hover:bg-red-600 transition-colors"
                                title="Ka saar rasiidka"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Status badge */}
                        <div className="absolute bottom-3 left-3">
                            {isAnalyzing ? (
                                <span className="flex items-center gap-2 bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg animate-pulse">
                                    <Loader2 size={12} className="animate-spin" /> AI waa akhriyaa...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2 bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                                    <CheckCircle size={12} /> Rasiidka waa diyaar
                                </span>
                            )}
                        </div>

                        {/* Change receipt label */}
                        <div className="absolute top-3 left-3">
                            <label htmlFor="aiReceiptUpload" className="cursor-pointer">
                                <span className="flex items-center gap-1 bg-white/90 dark:bg-gray-800/90 text-gray-700 dark:text-gray-200 text-xs font-bold px-3 py-1.5 rounded-full shadow border border-gray-200 dark:border-gray-600 hover:bg-blue-50 transition-colors">
                                    <UploadCloud size={12} /> Beddel  
                                </span>
                            </label>
                        </div>
                    </div>
                ) : (
                    /* === DROP ZONE STATE === */
                    <div
                        className={`
                            relative rounded-2xl border-2 border-dashed transition-all cursor-pointer
                            ${isDragging
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-[1.01] shadow-lg shadow-blue-200/50'
                                : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/10'
                            }
                        `}
                        onDragEnter={handleDragEnter}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => document.getElementById('aiReceiptUpload')?.click()}
                    >
                        <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
                            {isDragging ? (
                                <>
                                    <div className="w-16 h-16 rounded-2xl bg-blue-500 flex items-center justify-center mb-4 shadow-xl animate-bounce">
                                        <UploadCloud className="w-8 h-8 text-white" />
                                    </div>
                                    <p className="text-lg font-black text-blue-600 dark:text-blue-300">🎯 Sii daaya! Halkan dhig!</p>
                                    <p className="text-sm text-blue-500 mt-1">Drop image here</p>
                                </>
                            ) : (
                                <>
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center mb-4 shadow-md">
                                        <ImageIcon className="w-8 h-8 text-blue-500 dark:text-blue-400" />
                                    </div>
                                    <p className="text-base font-bold text-gray-700 dark:text-gray-200">
                                        Rasiidka Halkan Ku Dhig (Ikhtiyaari ah)
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        Telegram-ka ka soo jiid ↓ ama guji
                                    </p>
                                    <div className="flex items-center gap-3 mt-4">
                                        <span className="flex items-center gap-1 text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 px-3 py-1.5 rounded-full font-semibold">
                                            <UploadCloud size={12} /> Dhig (Drag & Drop)
                                        </span>
                                        <span className="text-gray-300 dark:text-gray-600">|</span>
                                        <span className="flex items-center gap-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded-full font-semibold">
                                            Ctrl+V Paste
                                        </span>
                                        <span className="text-gray-300 dark:text-gray-600">|</span>
                                        <span className="flex items-center gap-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded-full font-semibold">
                                            📁 Browse
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Hidden file input */}
                <input
                    type="file"
                    id="aiReceiptUpload"
                    accept="image/*"
                    onChange={handleReceiptUpload}
                    className="hidden"
                    disabled={isAnalyzing}
                />
            </div>

            {/* 1. Vendor & Invoice Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                    <VendorSelect
                        value={selectedVendor}
                        onChange={setSelectedVendor}
                        error={errors.selectedVendor}
                        vendorType={vendorType}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Invoice No. (Haddii ay jirto)
                    </label>
                    <input
                        type="text"
                        value={invoiceNumber}
                        onChange={(e) => setInvoiceNumber(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        placeholder="e.g. INV-001"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Taariikhda
                    </label>
                    <input
                        type="date"
                        value={expenseDate}
                        onChange={(e) => setExpenseDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                </div>
            </div>

            {/* 2. Materials List */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                        <Package className="w-4 h-4 mr-2" />
                        Liiska Alaabta
                    </h3>
                    <button
                        type="button"
                        onClick={addMaterial}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center"
                    >
                        <Plus className="w-4 h-4 mr-1" /> Ku dar Alaab
                    </button>
                </div>

                <div className="space-y-3">
                    {materials.map((item, index) => (
                        <div key={item.id} className="flex flex-col md:flex-row gap-3 items-start md:items-center bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                            <span className="text-xs text-gray-400 font-mono hidden md:inline-block w-6">#{index + 1}</span>

                            {/* Name */}
                            <div className="flex-1 w-full">
                                <input
                                    type="text"
                                    value={item.name}
                                    onChange={(e) => updateMaterial(item.id, 'name', e.target.value)}
                                    placeholder="Magaca Alaabta"
                                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                                />
                            </div>

                            {/* Qty */}
                            <div className="w-full md:w-24">
                                <input
                                    type="number"
                                    value={item.qty}
                                    onChange={(e) => updateMaterial(item.id, 'qty', e.target.value)}
                                    placeholder="Qty"
                                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                                />
                            </div>

                            {/* Unit */}
                            <div className="w-full md:w-28">
                                <select
                                    value={item.unit}
                                    onChange={(e) => updateMaterial(item.id, 'unit', e.target.value)}
                                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-transparent text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 ${errors[`materialUnit_${index}`] ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'}`}
                                >
                                    {materialUnits.map(u => <option key={u} value={u}>{u}</option>)}
                                </select>
                                {errors[`materialUnit_${index}`] && <p className="text-red-500 text-[10px] mt-1">{errors[`materialUnit_${index}`]}</p>}
                            </div>

                            {/* Price */}
                            <div className="w-full md:w-32 relative">
                                <span className="absolute left-3 top-2.5 text-gray-400 text-xs">$</span>
                                <input
                                    type="number"
                                    value={item.price}
                                    onChange={(e) => updateMaterial(item.id, 'price', e.target.value)}
                                    placeholder="Unit Price"
                                    className="w-full pl-6 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                                />
                            </div>

                            {/* Total for Row */}
                            <div className="w-full md:w-24 text-right font-medium text-gray-700 dark:text-gray-300 text-sm">
                                ${((Number(item.qty) || 0) * (Number(item.price) || 0)).toFixed(2)}
                            </div>

                            {/* Delete */}
                            <button
                                type="button"
                                onClick={() => removeMaterial(item.id)}
                                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                disabled={materials.length === 1}
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>

                {/* Grand Total Display */}
                <div className="flex justify-end mt-4">
                    <div className="bg-blue-50 dark:bg-blue-900/30 px-4 py-2 rounded-lg border border-blue-100 dark:border-blue-800">
                        <span className="text-sm text-blue-800 dark:text-blue-300 mr-2">Total Amount:</span>
                        <span className="text-lg font-bold text-blue-700 dark:text-blue-200">${totalAmount.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {/* 3. Payment Details (Partial Payment Logic) */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Payment Details (Lacag bixinta)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Payment Status
                        </label>
                        <div className="flex gap-2">
                            {['PAID', 'PARTIAL', 'UNPAID'].map((status) => (
                                <button
                                    key={status}
                                    type="button"
                                    onClick={() => {
                                        setPaymentStatus(status);
                                        if (status === 'PAID') {
                                            setPaidAmount(totalAmount);
                                        } else if (status === 'UNPAID') {
                                            setPaidAmount(0);
                                        }
                                    }}
                                    className={`flex-1 py-2 text-sm font-medium rounded-lg border ${paymentStatus === status
                                        ? 'bg-blue-600 text-white border-blue-600'
                                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    {status === 'PARTIAL' ? 'Qayb' : status === 'UNPAID' ? 'Deyn' : 'Wada Bixin'}
                                </button>
                            ))}
                        </div>
                        {errors.paymentStatus && <p className="text-red-500 text-xs mt-1">{errors.paymentStatus}</p>}
                    </div>

                    {paymentStatus !== 'UNPAID' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Amount Paid (Inta la bixiyay)
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-gray-400 text-sm">$</span>
                                <input
                                    type="number"
                                    value={paidAmount}
                                    onChange={(e) => setPaidAmount(e.target.value)}
                                    max={totalAmount}
                                    className="w-full pl-7 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                            </div>
                            {paymentStatus === 'PARTIAL' && (
                                <p className="text-xs text-red-500 mt-1 font-medium">
                                    Remaining (Deyn noqonaysa): ${(totalAmount - (Number(paidAmount) || 0)).toFixed(2)}
                                </p>
                            )}
                            {errors.paidAmount && <p className="text-red-500 text-xs mt-1">{errors.paidAmount}</p>}
                            {errors.paidFrom && paymentStatus !== 'UNPAID' && <p className="text-red-500 text-xs mt-1">{errors.paidFrom}</p>}
                        </div>
                    )}
                </div>

                {paymentStatus === 'UNPAID' && (
                    <div className="mt-3 flex items-center text-sm text-amber-600 bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg border border-amber-100 dark:border-amber-800/30">
                        <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                        Warning: This entire amount (${totalAmount.toFixed(2)}) will be recorded as Debt (Deyn) on the vendor.
                    </div>
                )}
            </div>
        </div>
    );
}
