import React, { useState } from 'react';
import { X, Bot, CheckCircle2, ScanLine, Sparkles, Zap, Building2, CreditCard, Loader2, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

interface UpgradeCreditsModalProps {
    isOpen: boolean;
    onClose: () => void;
    scanCredits: number | null;
    scanPlan: string;
    creditPackages: any[];
}

export default function UpgradeCreditsModal({ isOpen, onClose, scanCredits, scanPlan, creditPackages }: UpgradeCreditsModalProps) {
    const [step, setStep] = useState<'select' | 'payment_method' | 'pay_cbe' | 'pay_ebirr' | 'processing' | 'success'>('select');
    const [selectedPackage, setSelectedPackage] = useState<any>(null);
    const [reference, setReference] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    if (!isOpen) return null;

    const defaultPackages = [
        { id: 'starter', name: 'Starter', credits: 150, priceETB: 1000, popular: false },
        { id: 'business', name: 'Business', credits: 500, priceETB: 2500, popular: true },
        { id: 'enterprise', name: 'Enterprise', credits: 2000, priceETB: 7500, popular: false },
    ];

    const packages = creditPackages?.length > 0 ? creditPackages : defaultPackages;

    const handleBuyClick = (pkg: any) => {
        setSelectedPackage(pkg);
        setStep('payment_method');
    };

    const submitPayment = async (method: 'CBE' | 'eBirr') => {
        if (!reference.trim()) {
            setErrorMsg('Fadlan geli Reference Number ama Transaction ID');
            return;
        }
        setErrorMsg('');
        setStep('processing');
        try {
            const res = await fetch('/api/shop/payment-requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    packageId: selectedPackage.id,
                    packageName: selectedPackage.name,
                    amount: selectedPackage.priceETB,
                    credits: selectedPackage.credits,
                    paymentMethod: method,
                    reference: reference
                })
            });
            if (!res.ok) throw new Error('Submission failed');
            setStep('success');
        } catch (error) {
            console.error(error);
            setErrorMsg('Cilad ayaa dhacday. Fadlan mar kale isku day.');
            setStep(method === 'CBE' ? 'pay_cbe' : 'pay_ebirr');
        }
    };

    const resetState = () => {
        setStep('select');
        setSelectedPackage(null);
        setReference('');
        setErrorMsg('');
    };

    const handleClose = () => {
        resetState();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-[#151C2C] rounded-[32px] w-full max-w-4xl shadow-2xl relative animate-in zoom-in-95 flex flex-col md:flex-row overflow-hidden border border-gray-100 dark:border-gray-800">
                <button onClick={handleClose} className="absolute right-6 top-6 text-gray-300 hover:text-gray-500 z-10 transition-colors">
                    <X size={20} />
                </button>

                {/* LEFT SIDE: Advertisement & Features */}
                <div className="hidden md:flex md:w-5/12 bg-gradient-to-br from-[#3498DB]/10 to-emerald-500/10 p-8 flex-col justify-center border-r border-gray-100 dark:border-gray-800">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#3498DB] to-emerald-500 flex items-center justify-center text-white mb-6 shadow-lg shadow-blue-500/30">
                        <Bot size={32} />
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2 uppercase tracking-tight">Supercharge<br/>Your Business</h3>
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
                        Iibso AI Credits si aad u dardar geliso shaqadaada. Hal credit wuxuu u dhigmaa hal action oo AI ah.
                    </p>

                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-[#3498DB]">
                                <ScanLine size={16} />
                            </div>
                            <div>
                                <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest">AI Receipt Scanner</h4>
                                <p className="text-[10px] font-bold text-gray-500">Rasiidyada sawir ka qaad oo auto-fill ha kuu sameeyo AI-gu.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-500">
                                <Sparkles size={16} />
                            </div>
                            <div>
                                <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest">Revlo AI Assistant</h4>
                                <p className="text-[10px] font-bold text-gray-500">La sheekeyso xogtaada, weydii iibka, faa'iidada iyo deynta.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500">
                                <Zap size={16} />
                            </div>
                            <div>
                                <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest">Smart Stock Alerts</h4>
                                <p className="text-[10px] font-bold text-gray-500">AI-ga ayaa kuu sheegaya alaabta dhamaanaysa iyo iibkooda.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDE: Dynamic Content */}
                <div className="w-full md:w-7/12 flex flex-col">
                    
                    {/* STEP 1: SELECT PACKAGE */}
                    {step === 'select' && (
                        <div className="p-8 flex-1 overflow-y-auto">
                            <div className="flex items-center justify-between mb-8 p-4 bg-gray-50 dark:bg-[#0F1623] rounded-2xl border border-gray-100 dark:border-gray-800">
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Your Balance</p>
                                    <p className="text-3xl font-black text-red-500 flex items-center gap-2">
                                        {scanCredits ?? 0} <span className="text-sm font-bold text-gray-400 uppercase">Credits Left</span>
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Current Plan</p>
                                    <div className="px-3 py-1 rounded-lg bg-gray-200 dark:bg-gray-700 text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest">
                                        {scanPlan}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {packages.map((pkg: any) => (
                                    <div key={pkg.id} className={`relative p-4 rounded-2xl border-2 text-center transition-all flex flex-col justify-between ${
                                        pkg.popular
                                            ? 'border-[#3498DB] bg-blue-50/50 dark:bg-blue-900/10 shadow-lg shadow-blue-500/10'
                                            : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-[#1a2333]'
                                    }`}>
                                        {pkg.popular && (
                                            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-[#3498DB] text-white text-[8px] font-black uppercase rounded-full tracking-widest shadow-sm">
                                                Best Value
                                            </div>
                                        )}
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{pkg.name}</p>
                                            <p className="text-3xl font-black text-gray-900 dark:text-white mb-0.5">{pkg.credits}</p>
                                            <p className="text-[8px] font-black text-gray-400 uppercase">Credits</p>
                                        </div>
                                        <div className="mt-4">
                                            <div className={`py-2 rounded-xl text-[11px] font-black mb-2 ${
                                                pkg.popular ? 'bg-[#3498DB] text-white shadow-md shadow-blue-500/20' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                                            }`}>
                                                ETB {pkg.priceETB?.toLocaleString()}
                                            </div>
                                            <button 
                                                onClick={() => handleBuyClick(pkg)}
                                                className={`w-full py-2 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                                                    pkg.popular 
                                                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm' 
                                                        : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300'
                                                }`}
                                            >
                                                Buy Now
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* STEP 2: SELECT PAYMENT METHOD */}
                    {step === 'payment_method' && selectedPackage && (
                        <div className="p-8 flex-1 flex flex-col justify-center animate-in slide-in-from-right-4">
                            <button onClick={() => setStep('select')} className="self-start mb-6 text-gray-400 hover:text-gray-600 flex items-center gap-1 text-xs font-bold transition-colors">
                                <ArrowLeft size={14}/> Back to Packages
                            </button>
                            
                            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-1">Select Payment Method</h3>
                            <p className="text-sm font-medium text-gray-500 mb-8">You are buying <strong className="text-gray-800 dark:text-gray-200">{selectedPackage.name} ({selectedPackage.credits} Credits)</strong> for ETB {selectedPackage.priceETB}</p>

                            <div className="space-y-4">
                                <button 
                                    onClick={() => setStep('pay_ebirr')}
                                    className="w-full p-4 rounded-2xl border-2 border-green-500/20 bg-green-50/50 hover:bg-green-50 dark:bg-green-900/10 hover:border-green-500 flex items-center justify-between transition-all group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-green-600 font-black tracking-tighter">
                                            eBirr
                                        </div>
                                        <div className="text-left">
                                            <h4 className="font-bold text-gray-900 dark:text-white">Pay via Telebirr / eBirr</h4>
                                            <p className="text-xs font-medium text-gray-500">Auto-dial USSD code</p>
                                        </div>
                                    </div>
                                    <CheckCircle2 className="text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>

                                <button 
                                    onClick={() => setStep('pay_cbe')}
                                    className="w-full p-4 rounded-2xl border-2 border-orange-500/20 bg-orange-50/50 hover:bg-orange-50 dark:bg-orange-900/10 hover:border-orange-500 flex items-center justify-between transition-all group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-orange-600">
                                            <Building2 size={24}/>
                                        </div>
                                        <div className="text-left">
                                            <h4 className="font-bold text-gray-900 dark:text-white">CBE Bank Transfer</h4>
                                            <p className="text-xs font-medium text-gray-500">Scan QR Code</p>
                                        </div>
                                    </div>
                                    <CheckCircle2 className="text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 3A: PAY WITH CBE */}
                    {step === 'pay_cbe' && selectedPackage && (
                        <div className="p-8 flex-1 flex flex-col animate-in slide-in-from-right-4">
                            <button onClick={() => setStep('payment_method')} className="self-start mb-4 text-gray-400 hover:text-gray-600 flex items-center gap-1 text-xs font-bold transition-colors">
                                <ArrowLeft size={14}/> Back
                            </button>
                            
                            <div className="text-center mb-6">
                                <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mx-auto mb-3">
                                    <Building2 size={24}/>
                                </div>
                                <h3 className="text-lg font-black text-gray-900 dark:text-white">CBE Bank Transfer</h3>
                                <p className="text-xs font-medium text-gray-500 mt-1">Please transfer <strong className="text-orange-600">ETB {selectedPackage.priceETB}</strong></p>
                            </div>

                            <div className="bg-gray-50 dark:bg-[#0F1623] p-4 rounded-2xl border border-gray-200 dark:border-gray-700 mb-6 flex flex-col items-center">
                                <div className="bg-white p-2 rounded-xl border border-gray-200 mb-3 shadow-sm">
                                    <img src="/images/cbe-qr.png" alt="CBE QR Code" className="w-32 h-32 object-contain" />
                                </div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Account Number</p>
                                <p className="text-xl font-mono font-black text-gray-900 dark:text-white tracking-widest select-all">1000651564437</p>
                                <p className="text-xs font-bold text-gray-500 uppercase mt-1">Hamse Amin Abdi</p>
                            </div>

                            <div className="mb-4">
                                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-2">Transaction Reference / ID</label>
                                <input 
                                    type="text" 
                                    value={reference}
                                    onChange={(e) => setReference(e.target.value)}
                                    placeholder="Enter CBE Reference Number"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a2333] focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all font-mono"
                                />
                                {errorMsg && <p className="text-xs font-bold text-red-500 mt-2">{errorMsg}</p>}
                            </div>

                            <button 
                                onClick={() => submitPayment('CBE')}
                                className="w-full py-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-orange-500/30 active:scale-95"
                            >
                                Submit Payment Proof
                            </button>
                        </div>
                    )}

                    {/* STEP 3B: PAY WITH eBIRR */}
                    {step === 'pay_ebirr' && selectedPackage && (
                        <div className="p-8 flex-1 flex flex-col animate-in slide-in-from-right-4">
                            <button onClick={() => setStep('payment_method')} className="self-start mb-4 text-gray-400 hover:text-gray-600 flex items-center gap-1 text-xs font-bold transition-colors">
                                <ArrowLeft size={14}/> Back
                            </button>
                            
                            <div className="text-center mb-6">
                                <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-3 font-black">
                                    eBirr
                                </div>
                                <h3 className="text-lg font-black text-gray-900 dark:text-white">Telebirr / eBirr Payment</h3>
                                <p className="text-xs font-medium text-gray-500 mt-1">Please pay <strong className="text-green-600">ETB {selectedPackage.priceETB}</strong></p>
                            </div>

                            <div className="bg-green-50/50 dark:bg-green-900/10 p-5 rounded-2xl border border-green-200 dark:border-green-800 mb-6 text-center">
                                <p className="text-[10px] font-black text-green-600 dark:text-green-400 uppercase tracking-widest mb-3">Auto USSD Dial</p>
                                
                                <a 
                                    href={`tel:*681*0929475332*${selectedPackage.priceETB}%23`}
                                    className="inline-flex items-center justify-center px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-black font-mono tracking-wider transition-all shadow-lg shadow-green-500/30 mb-3"
                                >
                                    *681*0929475332*{selectedPackage.priceETB}#
                                </a>
                                <p className="text-[10px] font-bold text-gray-500">Guji koodkan si uu toos kuugu furo wicitaanka. Geli PIN-kaaga si aad u bixiso.</p>
                            </div>

                            <div className="mb-4">
                                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-2">eBirr Transaction ID</label>
                                <input 
                                    type="text" 
                                    value={reference}
                                    onChange={(e) => setReference(e.target.value)}
                                    placeholder="Enter TXN ID from SMS"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a2333] focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all font-mono"
                                />
                                {errorMsg && <p className="text-xs font-bold text-red-500 mt-2">{errorMsg}</p>}
                            </div>

                            <button 
                                onClick={() => submitPayment('eBirr')}
                                className="w-full py-4 rounded-xl bg-green-600 hover:bg-green-700 text-white font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-green-500/30 active:scale-95"
                            >
                                Submit & Verify
                            </button>
                        </div>
                    )}

                    {/* STEP 4: PROCESSING */}
                    {step === 'processing' && (
                        <div className="p-8 flex-1 flex flex-col items-center justify-center animate-in fade-in">
                            <Loader2 size={48} className="animate-spin text-[#3498DB] mb-4" />
                            <h3 className="text-xl font-black text-gray-900 dark:text-white">Submitting Payment...</h3>
                            <p className="text-sm font-medium text-gray-500 mt-2">Fadlan xoogaa sug.</p>
                        </div>
                    )}

                    {/* STEP 5: SUCCESS (Pending Approval) */}
                    {step === 'success' && (
                        <div className="p-8 flex-1 flex flex-col items-center justify-center text-center animate-in zoom-in">
                            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-500 mb-6">
                                <CheckCircle2 size={40} />
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Payment Sent!</h3>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-6">
                                Mahadsanid! Lacag bixintaada <strong>({reference})</strong> waa la diiwaangeliyay. Admin-ka ayaa xaqiijin doona kadibna waa laguu shubayaa Credits-ka.
                            </p>
                            <button 
                                onClick={handleClose}
                                className="px-8 py-3 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black transition-all active:scale-95"
                            >
                                Xir (Close)
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
