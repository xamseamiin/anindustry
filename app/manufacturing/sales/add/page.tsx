// app/manufacturing/sales/add/page.tsx - AN-Industory Sales Terminal (Glassmorphism Live)
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
    ArrowLeft, Plus, Trash2, Loader2, CheckCircle2,
    Wallet, X, Percent, Banknote, ChevronDown, CreditCard,
    DollarSign, Receipt, Landmark, Calendar, UserPlus, ShoppingBag,
    History as HistoryIcon
} from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children }: any) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />
            <div className="bg-white/90 backdrop-blur-3xl rounded-3xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden border border-white/40 animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-white/20 flex justify-between items-center bg-white/20">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">{title}</h3>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-all">
                        <X size={18} className="text-slate-400" />
                    </button>
                </div>
                <div className="p-8">{children}</div>
            </div>
        </div>
    );
};

export default function NewSalesOrderPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    
    const [products, setProducts] = useState<any[]>([]);
    const [customers, setCustomers] = useState<any[]>([]);
    const [accounts, setAccounts] = useState<any[]>([]);

    const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
    const [customerId, setCustomerId] = useState('');
    const [accountId, setAccountId] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('');
    const [paidAmount, setPaidAmount] = useState<number>(0);
    const [discount, setDiscount] = useState<number>(0);
    const [items, setItems] = useState([{ id: 1, productId: '', productName: '', quantity: 1, unitPrice: 0 }]);

    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [showAccountModal, setShowAccountModal] = useState(false);
    const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', address: '' });
    const [newAccount, setNewAccount] = useState({ name: '', type: 'Cash' });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [pRes, cRes, aRes] = await Promise.all([
                    fetch('/api/manufacturing/inventory?category=Finished Goods'),
                    fetch('/api/manufacturing/customers'),
                    fetch('/api/manufacturing/accounting/accounts')
                ]);
                if (pRes.ok) setProducts((await pRes.json()).items || []);
                if (cRes.ok) setCustomers((await cRes.json()).customers || []);
                if (aRes.ok) {
                    const aData = await aRes.json();
                    setAccounts(aData.accounts || []);
                    if (aData.accounts?.length > 0) setAccountId(aData.accounts[0].id);
                }
            } catch (e) { console.error(e); }
        };
        fetchData();
    }, []);

    const addItem = () => setItems([...items, { id: Date.now(), productId: '', productName: '', quantity: 1, unitPrice: 0 }]);
    const removeItem = (id: number) => items.length > 1 && setItems(items.filter(i => i.id !== id));
    
    const updateItem = (id: number, field: string, value: any) => {
        setItems(items.map(item => {
            if (item.id === id) {
                if (field === 'productId') {
                    const match = products.find(p => p.id === value);
                    if (match) return { ...item, productId: value, productName: match.name, unitPrice: Number(match.sellingPrice) };
                }
                return { ...item, [field]: value };
            }
            return item;
        }));
    };

    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const grandTotal = Math.max(0, subtotal - discount);
    const debtAmount = Math.max(0, grandTotal - paidAmount);

    const handleMethodSelect = (m: string) => {
        setPaymentMethod(m);
        if (m === 'CASH' || m === 'CARD') setPaidAmount(grandTotal);
        else setPaidAmount(0);
    };

    const handleAddCustomer = async () => {
        try {
            const res = await fetch('/api/manufacturing/customers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newCustomer)
            });
            if (res.ok) {
                const data = await res.json();
                setCustomers([...customers, data.customer]);
                setCustomerId(data.customer.id);
                setShowCustomerModal(false);
                setNewCustomer({ name: '', phone: '', address: '' });
            }
        } catch (e) { console.error(e); }
    };

    const handleAddAccount = async () => {
        try {
            const res = await fetch('/api/manufacturing/accounting/accounts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newAccount)
            });
            if (res.ok) {
                const data = await res.json();
                setAccounts([...accounts, data.account]);
                setAccountId(data.account.id);
                setShowAccountModal(false);
                setNewAccount({ name: '', type: 'Cash' });
            }
        } catch (e) { console.error(e); }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        if (!customerId || !paymentMethod) { alert('Please fill in all fields.'); setLoading(false); return; }

        try {
            const response = await fetch('/api/manufacturing/sales', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: saleDate,
                    customerId,
                    accountId: (paymentMethod === 'CREDIT') ? null : accountId,
                    paymentMethod,
                    paidAmount: (paymentMethod === 'CASH' || paymentMethod === 'CARD') ? grandTotal : paidAmount,
                    discount,
                    total: grandTotal,
                    items: items.map(i => ({ productId: i.productId, productName: i.productName, quantity: i.quantity, unitPrice: i.unitPrice }))
                })
            });
            if (response.ok) { setSuccess(true); setTimeout(() => router.push('/manufacturing/sales'), 1200); }
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
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Sale Completed!</h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Inventory & Revenue Updated</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen">
            {/* Dynamic Background Blobs */}
            <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
                <div className="absolute top-[-10%] right-[-5%] w-[45%] h-[45%] bg-emerald-500/10 rounded-full blur-[130px] animate-pulse" />
                <div className="absolute bottom-[-10%] left-[-5%] w-[45%] h-[45%] bg-blue-500/10 rounded-full blur-[130px] animate-pulse" style={{ animationDelay: '3s' }} />
            </div>

            <div className="flex flex-col gap-6 px-8 animate-fade-in max-w-[1700px] mx-auto py-8 relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.back()} className="p-3 bg-white/60 backdrop-blur-xl rounded-2xl border border-white/40 shadow-xl text-slate-400 hover:text-emerald-600 transition-all">
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Sales Entry</h1>
                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">AN-Industory Terminal</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Workspace */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Customer Info (Glassy) */}
                        <div className="bg-white/30 backdrop-blur-3xl p-8 rounded-3xl border border-white/50 shadow-2xl">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Customer</label>
                                        <button type="button" onClick={() => setShowCustomerModal(true)} className="text-[10px] font-black text-blue-600 uppercase flex items-center gap-1.5 hover:underline">
                                            <UserPlus size={14} /> New
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <select required value={customerId} onChange={(e) => setCustomerId(e.target.value)} 
                                            className="w-full p-4 bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-emerald-500/10 appearance-none shadow-inner"
                                        >
                                            <option value="">Select customer...</option>
                                            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                        <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sale Date</label>
                                    <div className="relative">
                                        <input type="date" required value={saleDate} onChange={(e) => setSaleDate(e.target.value)} 
                                            className="w-full p-4 bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-emerald-500/10" 
                                        />
                                        <Calendar size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Items Table (Glassy) */}
                        <div className="bg-white/30 backdrop-blur-3xl rounded-3xl border border-white/50 shadow-2xl overflow-hidden">
                            <div className="p-6 px-8 border-b border-white/20 flex justify-between items-center bg-white/20">
                                <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-3">
                                    <ShoppingBag size={18} className="text-emerald-500" /> Cart Items
                                </h3>
                                <button type="button" onClick={addItem} className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 active:scale-95">
                                    <Plus size={14} /> Add Product
                                </button>
                            </div>
                            <div className="overflow-x-auto min-h-[300px]">
                                <table className="w-full text-left">
                                    <thead className="bg-white/10">
                                        <tr className="text-[9px] font-black uppercase text-slate-500 border-b border-white/10">
                                            <th className="p-5 pl-10">Product Name</th>
                                            <th className="p-5 text-center">Qty</th>
                                            <th className="p-5 text-center">Unit Price</th>
                                            <th className="p-5 text-right pr-10">Total</th>
                                            <th className="p-5 w-12"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/10">
                                        {items.map((item) => (
                                            <tr key={item.id} className="group hover:bg-white/40 transition-all duration-300">
                                                <td className="p-5 pl-10">
                                                    <select value={item.productId} onChange={(e) => updateItem(item.id, 'productId', e.target.value)} 
                                                        className="w-full bg-transparent border-none outline-none font-black text-slate-900 text-xs appearance-none cursor-pointer"
                                                    >
                                                        <option value="">Select product...</option>
                                                        {products.map(p => <option key={p.id} value={p.id}>{p.name} (Stock: {p.inStock} {p.unit})</option>)}
                                                    </select>
                                                </td>
                                                <td className="p-5 text-center">
                                                    <input type="number" value={item.quantity} onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)} 
                                                        className="w-16 p-2 bg-white/40 rounded-xl text-center outline-none font-black text-slate-900 text-sm focus:bg-white transition-all shadow-inner" 
                                                    />
                                                </td>
                                                <td className="p-5 text-center">
                                                     <div className="flex items-center justify-center gap-1">
                                                         <span className="text-[8px] font-black text-slate-400">ETB</span>
                                                         <input type="number" value={item.unitPrice} onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)} 
                                                             className="w-20 p-2 bg-white/40 rounded-xl text-center outline-none font-black text-slate-900 text-sm focus:bg-white transition-all shadow-inner" 
                                                         />
                                                     </div>
                                                </td>
                                                <td className="p-5 text-right pr-10 font-black text-slate-900 text-sm tracking-tighter">
                                                     {(item.quantity * item.unitPrice).toLocaleString()} <span className="text-[9px] text-slate-400">ETB</span>
                                                </td>
                                                <td className="p-5 text-center">
                                                    <button type="button" onClick={() => removeItem(item.id)} className="text-slate-300 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100 p-2">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Payment Sidebar (Glassy) */}
                    <div className="space-y-8">
                        <div className="bg-white/40 backdrop-blur-3xl p-8 rounded-3xl border border-white/50 shadow-2xl flex flex-col gap-8">
                            <div className="pb-4 border-b border-white/20">
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.15em]">Payment Hub</h3>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { id: 'CASH', icon: <Banknote size={18} />, label: 'Cash' },
                                    { id: 'CARD', icon: <CreditCard size={18} />, label: 'Card' },
                                    { id: 'PARTIAL', icon: <Wallet size={18} />, label: 'Partial' },
                                    { id: 'CREDIT', icon: <HistoryIcon size={18} />, label: 'Credit' }
                                ].map(m => (
                                    <button key={m.id} type="button" onClick={() => handleMethodSelect(m.id)} 
                                        className={`p-4 rounded-2xl flex flex-col items-center gap-3 transition-all border group active:scale-95 ${paymentMethod === m.id ? 'bg-emerald-600 text-white border-emerald-600 shadow-xl shadow-emerald-600/30' : 'bg-white/40 text-slate-600 border-white/40 hover:bg-white/60'}`}
                                    >
                                        <div className={`p-3 rounded-xl transition-transform duration-300 group-hover:scale-110 ${paymentMethod === m.id ? 'bg-white/20' : 'bg-emerald-500/10 text-emerald-600'}`}>{m.icon}</div>
                                        <span className="text-[10px] font-black uppercase tracking-widest">{m.label}</span>
                                    </button>
                                ))}
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-4 pt-4 border-t border-white/20">
                                    <div className="flex justify-between items-center text-slate-500">
                                        <span className="text-[10px] font-black uppercase tracking-widest">Subtotal</span>
                                        <span className="text-sm font-black text-slate-900">{subtotal.toLocaleString()} <span className="text-[9px] text-slate-400">ETB</span></span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                            <Percent size={14} className="text-emerald-500" /> Discount
                                        </label>
                                        <input type="number" value={discount} onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)} 
                                            className="w-20 bg-white/40 p-2 rounded-xl border border-white/40 text-right text-emerald-600 text-xs font-black outline-none focus:bg-white transition-all shadow-inner" 
                                        />
                                    </div>
                                </div>

                                {paymentMethod && (paymentMethod !== 'CREDIT') && (
                                    <div className="space-y-5 animate-in fade-in slide-in-from-top-4 duration-500">
                                        {paymentMethod === 'PARTIAL' && (
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Deposit Amount</label>
                                                <div className="relative">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600 font-black text-[9px]">ETB</span>
                                                    <input type="number" value={paidAmount} onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)} 
                                                        className="w-full bg-white/60 p-4 pl-10 rounded-2xl border border-white/40 outline-none text-slate-900 text-lg font-black shadow-inner" 
                                                    />
                                                </div>
                                            </div>
                                        )}
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Deposit To</label>
                                                <button type="button" onClick={() => setShowAccountModal(true)} className="text-[9px] font-black text-emerald-500 uppercase hover:underline">+ New Account</button>
                                            </div>
                                            <div className="relative">
                                                <select value={accountId} onChange={(e) => setAccountId(e.target.value)} 
                                                    className="w-full bg-white/60 p-4 rounded-2xl border border-white/40 outline-none text-slate-900 text-[11px] font-bold appearance-none shadow-inner"
                                                >
                                                    {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                                                </select>
                                                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="p-6 bg-slate-900 rounded-3xl text-white relative overflow-hidden shadow-2xl shadow-slate-900/20 group">
                                    <div className="absolute top-[-20%] right-[-10%] w-24 h-24 bg-emerald-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                                    <div className="relative z-10 space-y-4">
                                        <div className="flex justify-between items-center opacity-60">
                                            <span className="text-[8px] font-black uppercase tracking-widest">Remaining Debt</span>
                                            <span className={`text-[10px] font-black font-mono ${debtAmount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>{debtAmount.toLocaleString()} <span className="text-[8px]">ETB</span></span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Total Receivable</span>
                                            <span className="text-3xl font-black tracking-tighter">{grandTotal.toLocaleString()} <span className="text-[11px] text-slate-400">ETB</span></span>
                                        </div>
                                    </div>
                                </div>

                                <button type="submit" disabled={loading || !customerId || !paymentMethod} 
                                    className="w-full py-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-emerald-600/30 transition-all active:scale-95 disabled:opacity-30 flex items-center justify-center gap-3 cursor-pointer"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                                    Finalize Transaction
                                </button>

                                {!paymentMethod && (
                                    <p className="text-[9px] font-black text-amber-600 bg-amber-500/10 p-3 rounded-xl uppercase tracking-widest text-center animate-pulse border border-amber-500/20">
                                        ⚠️ Fadlan dooro habka lacag bixinta si aad u dhammaystirto.
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="p-6 bg-white/20 backdrop-blur-xl rounded-2xl border border-white/20 flex items-center gap-4">
                            <Landmark size={24} className="text-slate-400" />
                            <p className="text-[8px] font-bold text-slate-500 uppercase leading-relaxed tracking-widest">
                                Transaction logs will be synchronized with the general ledger and inventory records.
                            </p>
                        </div>
                    </div>
                </form>

                <Modal isOpen={showCustomerModal} onClose={() => setShowCustomerModal(false)} title="New Customer Registration">
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Customer Name</label>
                            <input type="text" placeholder="Full Customer Name" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold text-xs border border-slate-100 focus:border-emerald-500/30 transition-all" value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                            <input type="text" placeholder="Phone Number" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold text-xs border border-slate-100 focus:border-emerald-500/30 transition-all" value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Address</label>
                            <input type="text" placeholder="Address (e.g. Mogadishu)" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold text-xs border border-slate-100 focus:border-emerald-500/30 transition-all" value={newCustomer.address} onChange={e => setNewCustomer({...newCustomer, address: e.target.value})} />
                        </div>
                        <button onClick={handleAddCustomer} className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-900/20 active:scale-95 transition-all">Register Customer</button>
                    </div>
                </Modal>
                
                <Modal isOpen={showAccountModal} onClose={() => setShowAccountModal(false)} title="New Financial Account">
                    <div className="space-y-4">
                        <input type="text" placeholder="Account Title (e.g. Somnet Cash)" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold text-xs border border-slate-100" value={newAccount.name} onChange={e => setNewAccount({...newAccount, name: e.target.value})} />
                        <button onClick={handleAddAccount} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-600/20 active:scale-95">Link Account</button>
                    </div>
                </Modal>
            </div>
        </div>
    );
}
