// app/manufacturing/production-orders/add/page.tsx - AN-Industory Production Terminal (Glassmorphism Live)
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
    ArrowLeft, Plus, Trash2, Loader2, CheckCircle2,
    Factory, X, Percent, Beaker, ChevronDown, Package,
    Zap, ListChecks, History, Calendar, FlaskConical, Boxes,
    User
} from 'lucide-react';

export default function ProductionEntryPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    
    const [products, setProducts] = useState<any[]>([]);
    const [selectedProductId, setSelectedProductId] = useState('');
    const [quantity, setQuantity] = useState<number>(1000);
    const [productionDate, setProductionDate] = useState(new Date().toISOString().split('T')[0]);
    const [priority, setPriority] = useState('MEDIUM');
    const [bom, setBom] = useState<any[]>([]);
    const [fetchingBOM, setFetchingBOM] = useState(false);

    // Workers selection and rates state
    const [allEmployees, setAllEmployees] = useState<any[]>([]);
    const [selectedWorkers, setSelectedWorkers] = useState<any[]>([]);

    useEffect(() => {
        fetch('/api/manufacturing/products')
            .then(res => res.json())
            .then(data => setProducts(data.products || []))
            .catch(console.error);

        // Fetch active employees and load saved configurations
        fetch('/api/manufacturing/employees')
            .then(res => res.json())
            .then(data => {
                const activeEmps = (data.employees || []).filter((e: any) => e.status === 'Active');
                setAllEmployees(activeEmps);

                const saved = localStorage.getItem('anindustry_po_saved_workers');
                if (saved) {
                    try {
                        const parsed = JSON.parse(saved);
                        const validSaved = parsed.filter((s: any) => activeEmps.some((e: any) => e.id === s.employeeId));
                        setSelectedWorkers(validSaved);
                    } catch (e) {
                        console.error("Failed to parse saved workers from localStorage", e);
                    }
                } else {
                    // Pre-select active employees who have isPercentageLinked === true
                    const defaultWorkers = activeEmps
                        .filter((e: any) => e.isPercentageLinked)
                        .map((e: any) => ({
                            employeeId: e.id,
                            rate: e.productionRate || 0.0
                        }));
                    setSelectedWorkers(defaultWorkers);
                }
            })
            .catch(console.error);
    }, []);

    useEffect(() => {
        if (selectedProductId) {
            setFetchingBOM(true);
            fetch(`/api/manufacturing/bom?productId=${selectedProductId}`)
                .then(res => res.json())
                .then(data => setBom(data.bom || []))
                .catch(console.error)
                .finally(() => setFetchingBOM(false));
        } else {
            setBom([]);
        }
    }, [selectedProductId]);

    const totalEstimatedCost = bom.reduce((sum, item) => sum + (item.costPerUnit * item.quantity * (quantity / 1)), 0);

    const handleWorkerCheckboxChange = (employeeId: string, checked: boolean, defaultRate: number) => {
        let updated;
        if (checked) {
            updated = [...selectedWorkers, { employeeId, rate: defaultRate }];
        } else {
            updated = selectedWorkers.filter(w => w.employeeId !== employeeId);
        }
        setSelectedWorkers(updated);
        localStorage.setItem('anindustry_po_saved_workers', JSON.stringify(updated));
    };

    const handleWorkerRateChange = (employeeId: string, rateStr: string) => {
        const rate = parseFloat(rateStr) || 0.0;
        const updated = selectedWorkers.map(w => 
            w.employeeId === employeeId ? { ...w, rate } : w
        );
        setSelectedWorkers(updated);
        localStorage.setItem('anindustry_po_saved_workers', JSON.stringify(updated));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await fetch('/api/manufacturing/production-orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId: selectedProductId,
                    productName: products.find(p => p.id === selectedProductId)?.name,
                    quantity,
                    startDate: productionDate,
                    priority,
                    status: 'COMPLETED',
                    notes: 'Automatic production run',
                    workers: selectedWorkers
                })
            });
            if (response.ok) { 
                setSuccess(true); 
                setTimeout(() => router.push('/manufacturing/production-orders'), 1200); 
            }
        } catch (error) { console.error(error); } finally { setLoading(false); }
    };

    if (success) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-emerald-500/5 blur-[100px]" />
                <div className="relative z-10 flex flex-col items-center gap-4">
                    <div className="p-5 bg-emerald-500 text-white rounded-full shadow-2xl shadow-emerald-500/40 animate-bounce">
                        <CheckCircle2 size={48} />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Production Recorded!</h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Inventory Synchronized Successfully</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen">
            <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
                <div className="absolute top-[-10%] right-[-5%] w-[45%] h-[45%] bg-blue-500/10 rounded-full blur-[130px] animate-pulse" />
                <div className="absolute bottom-[-10%] left-[-5%] w-[45%] h-[45%] bg-emerald-500/10 rounded-full blur-[130px] animate-pulse" style={{ animationDelay: '3s' }} />
            </div>

            <div className="flex flex-col gap-6 px-8 animate-fade-in max-w-[1700px] mx-auto py-8 relative z-10">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.back()} className="p-3 bg-white/60 backdrop-blur-xl rounded-2xl border border-white/40 shadow-xl text-slate-400 hover:text-blue-600 transition-all">
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Production Entry</h1>
                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">AN-Industory Factory</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white/30 backdrop-blur-3xl p-8 rounded-3xl border border-white/50 shadow-2xl">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="p-3 bg-blue-500/10 text-blue-600 rounded-xl"><Boxes size={24} /></div>
                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">Batch Configuration</h3>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Target Product</label>
                                    <div className="relative">
                                        <select required value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)} 
                                            className="w-full p-4 bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-blue-500/10 appearance-none shadow-inner"
                                        >
                                            <option value="">Select Bottle...</option>
                                            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                        <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Batch Quantity</label>
                                    <div className="relative">
                                        <input type="number" required value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value) || 0)} 
                                            className="w-full p-4 bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl text-sm font-black outline-none focus:ring-4 focus:ring-blue-500/10 shadow-inner" 
                                        />
                                        <Zap size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-500 pointer-events-none" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Production Date</label>
                                    <input type="date" value={productionDate} onChange={(e) => setProductionDate(e.target.value)} 
                                        className="w-full p-4 bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl text-xs font-bold outline-none" 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Priority</label>
                                    <div className="flex gap-3 h-[52px]">
                                        {['LOW', 'MEDIUM', 'HIGH'].map(p => (
                                            <button key={p} type="button" onClick={() => setPriority(p)}
                                                className={`flex-1 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${priority === p ? 'bg-slate-900 text-white shadow-xl scale-105' : 'bg-white/40 border border-white/40 text-slate-400 hover:bg-white/60'}`}
                                            >
                                                {p}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Workers Assignment Panel */}
                        <div className="bg-white/30 backdrop-blur-3xl p-8 rounded-3xl border border-white/50 shadow-2xl space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl"><User size={24} /></div>
                                <div>
                                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">Shaqaalaha Waxsoosaarka (Workers Assignment)</h3>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Link employees and their percentage rates to this batch run</p>
                                </div>
                            </div>

                            {allEmployees.length === 0 ? (
                                <p className="text-xs text-slate-400 font-bold uppercase italic py-4">No active employees found to link.</p>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {allEmployees.map(emp => {
                                        const isChecked = selectedWorkers.some(w => w.employeeId === emp.id);
                                        const workerRecord = selectedWorkers.find(w => w.employeeId === emp.id);
                                        const rateValue = workerRecord ? workerRecord.rate : (emp.productionRate || 0.0);

                                        return (
                                            <div key={emp.id} className={`p-4 rounded-2xl border transition-all duration-300 flex flex-col justify-between gap-3 ${isChecked ? 'bg-emerald-500/5 border-emerald-500/30 shadow-md shadow-emerald-500/5' : 'bg-white/40 border-white/40 hover:bg-white/60'}`}>
                                                <div className="flex items-start justify-between gap-3">
                                                    <label className="flex items-center gap-3 cursor-pointer select-none flex-1">
                                                        <input
                                                            type="checkbox"
                                                            checked={isChecked}
                                                            onChange={(e) => handleWorkerCheckboxChange(emp.id, e.target.checked, emp.productionRate || 0.0)}
                                                            className="w-4 h-4 rounded border-slate-355 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                                        />
                                                        <div>
                                                            <h4 className="text-xs font-black text-slate-900 leading-none">{emp.name}</h4>
                                                            <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 tracking-wider">{emp.role}</p>
                                                        </div>
                                                    </label>
                                                    {emp.isPercentageLinked && (
                                                        <span className="text-[9px] px-2 py-0.5 bg-blue-500/10 text-blue-600 rounded-md font-bold uppercase shrink-0">
                                                            Default {emp.productionRate}%
                                                        </span>
                                                    )}
                                                </div>

                                                {isChecked && (
                                                    <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200 border-t border-dashed border-emerald-500/10 pt-2.5">
                                                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Percentage Rate for this batch (%)</label>
                                                        <div className="relative">
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                max="100"
                                                                value={rateValue}
                                                                onChange={(e) => handleWorkerRateChange(emp.id, e.target.value)}
                                                                className="w-full p-2 bg-white/70 border border-white/50 rounded-xl text-xs font-black text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/20 pr-8"
                                                            />
                                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-emerald-600">%</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="bg-white/30 backdrop-blur-3xl rounded-3xl border border-white/50 shadow-2xl overflow-hidden">
                            <div className="p-6 px-8 border-b border-white/20 flex justify-between items-center bg-white/20">
                                <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-3">
                                    <FlaskConical size={18} className="text-emerald-500" /> Automated Material Deduction (BOM)
                                </h3>
                                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-full text-[9px] font-black uppercase border border-emerald-500/20 shadow-sm">Live Sync</span>
                            </div>
                            <div className="min-h-[250px] overflow-x-auto">
                                {fetchingBOM ? (
                                    <div className="h-[250px] flex flex-col items-center justify-center gap-3">
                                        <Loader2 size={24} className="animate-spin text-blue-500" />
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Calculating Recipe...</p>
                                    </div>
                                ) : bom.length === 0 ? (
                                    <div className="h-[250px] flex flex-col items-center justify-center gap-6 opacity-40">
                                        <div className="p-6 bg-white/40 rounded-full text-slate-300 shadow-inner"><Beaker size={48} /></div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">No Material Recipe Found</p>
                                    </div>
                                ) : (
                                    <table className="w-full text-left">
                                        <thead className="bg-white/10">
                                            <tr className="text-[9px] font-black uppercase text-slate-500 border-b border-white/10">
                                                <th className="p-5 pl-10">Material Name</th>
                                                <th className="p-5 text-center">Unit Req.</th>
                                                <th className="p-5 text-center">Batch Usage</th>
                                                <th className="p-5 text-right pr-10">Est. Cost</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/10">
                                            {bom.map((item: any) => (
                                                <tr key={item.id} className="hover:bg-white/40 transition-all group">
                                                    <td className="p-5 pl-10 font-black text-slate-900 text-xs">{item.materialName}</td>
                                                    <td className="p-5 text-center text-xs font-bold text-slate-500">{item.quantity} {item.unit}</td>
                                                    <td className="p-5 text-center">
                                                        <span className="bg-blue-500/10 text-blue-600 px-3 py-1 rounded-lg text-[10px] font-black border border-blue-500/10">
                                                            {(item.quantity * quantity).toLocaleString()} {item.unit}
                                                        </span>
                                                    </td>
                                                    <td className="p-5 text-right pr-10 font-black text-slate-900 text-xs">{(item.costPerUnit * item.quantity * quantity).toLocaleString()} <span className="text-[9px] text-slate-400 font-normal">ETB</span></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="bg-white/40 backdrop-blur-3xl p-8 rounded-3xl border border-white/50 shadow-2xl flex flex-col gap-6">
                            <div className="pb-4 border-b border-white/20">
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.15em]">Batch Summary</h3>
                            </div>
                            <div className="space-y-5">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Quantity</span>
                                    <span className="text-sm font-black text-slate-900">{quantity.toLocaleString()} pcs</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ingredients</span>
                                    <span className="text-sm font-black text-blue-600">{bom.length} SKUs</span>
                                </div>
                                <div className="p-5 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 flex items-center gap-4">
                                    <div className="p-3 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/20"><CheckCircle2 size={18} /></div>
                                    <div>
                                        <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Auto-Complete</p>
                                        <p className="text-[8px] font-bold text-emerald-600/60 uppercase">Instant Stock Injection</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 bg-slate-900 rounded-3xl text-white relative overflow-hidden shadow-2xl shadow-slate-900/20 group">
                                <div className="absolute top-[-20%] right-[-10%] w-24 h-24 bg-blue-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                                <div className="relative z-10 space-y-4">
                                    <div className="flex justify-between items-center opacity-60">
                                        <span className="text-[8px] font-black uppercase tracking-widest">Unit Cost (Est)</span>
                                        <span className="text-[10px] font-black font-mono tracking-tighter">{(totalEstimatedCost / (quantity || 1)).toFixed(3)} <span className="text-[8px] text-slate-400">ETB</span></span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Total Batch Cost</span>
                                        <span className="text-3xl font-black tracking-tighter">{totalEstimatedCost.toLocaleString()} <span className="text-xs text-slate-400 font-normal">ETB</span></span>
                                    </div>
                                </div>
                            </div>

                            <button type="submit" disabled={loading || !selectedProductId} 
                                className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-blue-600/30 transition-all active:scale-95 disabled:opacity-30 flex items-center justify-center gap-3"
                            >
                                {loading ? <Loader2 className="animate-spin" size={18} /> : <Zap size={18} />}
                                Record Production
                            </button>
                        </div>
                        <div className="p-6 bg-white/20 backdrop-blur-xl rounded-2xl border border-white/20 flex items-center gap-4">
                            <History size={20} className="text-slate-400" />
                            <p className="text-[8px] font-bold text-slate-500 uppercase leading-relaxed tracking-widest">
                                Every run triggers an atomic stock transaction in the inventory engine.
                            </p>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
