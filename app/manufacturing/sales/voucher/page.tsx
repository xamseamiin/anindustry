// app/manufacturing/sales/voucher/page.tsx - AN-Industory Blank A4 4/6-Voucher Gate Pass & Sales Receipt
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Printer, FileText, Download, Info, Loader2 } from 'lucide-react';

export default function SalesVoucherPage() {
    const router = useRouter();
    const [layoutType, setLayoutType] = useState<'4' | '6'>('6');
    const [pdfLoading, setPdfLoading] = useState(false);

    // Dynamic import and execution of html2pdf.js for high-quality client-side PDF download
    const handleDownloadPDF = async () => {
        setPdfLoading(true);
        try {
            const html2pdf = (await import('html2pdf.js')).default;
            const element = document.getElementById('printable-vouchers-container');
            if (element) {
                const opt = {
                    margin: 0,
                    filename: `AN_Gate_Pass_Blank_${layoutType}_per_page.pdf`,
                    image: { type: 'jpeg' as const, quality: 1.0 },
                    html2canvas: { 
                        scale: 3, // Highly scaled for crisp/sharp print outputs
                        useCORS: true,
                        letterRendering: true
                    },
                    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
                };
                await html2pdf().set(opt).from(element).save();
            }
        } catch (e) {
            console.error("PDF generation failed:", e);
            alert("Cilad ayaa dhacday intii PDF-ka la soo dejinayay.");
        } finally {
            setPdfLoading(false);
        }
    };

    // Render a single blank voucher quadrant
    const renderVoucherQuadrant = (index: number) => {
        const isLeftCol = index % 2 === 0;
        
        // Rows border logic
        const isLastRow = layoutType === '6' ? index >= 4 : index >= 2;

        return (
            <div key={index} className={`quadrant-box bg-white relative flex flex-col justify-between box-border overflow-hidden ${
                layoutType === '6' ? 'quadrant-box-6' : 'quadrant-box-4'
            } ${
                isLeftCol ? 'border-r border-dashed border-slate-400' : ''
            } ${
                !isLastRow ? 'border-b border-dashed border-slate-400' : ''
            }`}>
                {/* Header Section */}
                <div className="flex justify-between items-start">
                    <div className="flex flex-col items-center">
                        <img 
                            src="/logogoods.png" 
                            onError={(e) => {
                                // Fallback to combined logo if logogoods.png is not uploaded yet
                                e.currentTarget.src = "/an-logo-combined.png";
                            }}
                            alt="AN Logo" 
                            className="h-9 object-contain filter grayscale" 
                        />
                        <span className="text-[6.5px] font-bold text-black tracking-tight mt-0.5">AN INDUSTRIES PARTNERSHIP</span>
                    </div>
                    <div className="flex flex-col items-end">
                        <h2 className="text-sm font-bold text-black tracking-tight leading-none uppercase">Goods Gate Pass</h2>
                        <div className="border border-black text-black text-[7.5px] font-bold px-2 py-0.5 rounded text-center w-max mt-1 uppercase tracking-wider bg-slate-50">
                            Sales Receipt
                        </div>
                        <div className="text-[8.5px] font-bold text-black mt-1.5">
                            Date: <span className="text-slate-400 font-mono">_____ / _____ / 202___</span>
                        </div>
                    </div>
                </div>

                {/* Customer Details */}
                <div className="space-y-1.5 mt-2">
                    <div className="text-[9px] font-bold text-black flex items-end">
                        <span className="flex-shrink-0">Customer Name:</span>
                        <span className="flex-grow border-b border-slate-900 pb-0.5 ml-1 bg-transparent h-[14px]" />
                    </div>
                    <div className="text-[9px] font-bold text-black flex items-end">
                        <span className="flex-shrink-0">Phone:</span>
                        <span className="flex-grow border-b border-slate-900 pb-0.5 ml-1 bg-transparent h-[14px]" />
                    </div>
                </div>

                {/* Items Table */}
                <div className="flex-grow mt-3">
                    <table className="w-full text-left border-collapse text-[9px] text-black">
                        <thead>
                            <tr className="bg-slate-100 text-black uppercase text-center border-y border-slate-900 font-bold">
                                <th className="border border-slate-400 py-1 w-[10%]">No.</th>
                                <th className="border border-slate-400 py-1 px-2 w-[50%] text-left">Item Description</th>
                                <th className="border border-slate-400 py-1 w-[12%]">Qty</th>
                                <th className="border border-slate-400 py-1 w-[14%]">Unit Price</th>
                                <th className="border border-slate-400 py-1 px-1 w-[14%] text-right">Total Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b border-slate-300">
                                <td className="border border-slate-400 py-1.5 text-center font-mono font-medium text-slate-800">1</td>
                                <td className="border border-slate-400 py-1.5 px-2 text-slate-900 font-semibold">Cagada 1L</td>
                                <td className="border border-slate-400 py-1.5 text-center"></td>
                                <td className="border border-slate-400 py-1.5 text-center"></td>
                                <td className="border border-slate-400 py-1.5 px-1 text-right"></td>
                            </tr>
                            <tr className="border-b border-slate-300">
                                <td className="border border-slate-400 py-1.5 text-center font-mono font-medium text-slate-800">2</td>
                                <td className="border border-slate-400 py-1.5 px-2 text-slate-900 font-semibold">Cagada 0.5L</td>
                                <td className="border border-slate-400 py-1.5 text-center"></td>
                                <td className="border border-slate-400 py-1.5 text-center"></td>
                                <td className="border border-slate-400 py-1.5 px-1 text-right"></td>
                            </tr>
                        </tbody>
                    </table>

                    {/* Subtotals (Blank Underlines) */}
                    <div className="flex flex-col items-end mt-2.5 text-[8px] font-semibold text-black space-y-1">
                        <div className="flex justify-between w-[130px]">
                            <span>Subtotal:</span>
                            <span className="border-b border-slate-900 w-[65px] h-[10px]"></span>
                        </div>
                        <div className="flex justify-between w-[130px]">
                            <span>Discount:</span>
                            <span className="border-b border-slate-900 w-[65px] h-[10px]"></span>
                        </div>
                        <div className="flex justify-between w-[130px] text-black font-bold text-[9px] mt-1.5">
                            <span>TOTAL:</span>
                            <span className="w-[65px] border-b-2 border-black h-[10px] inline-block"></span>
                        </div>
                    </div>
                </div>

                {/* Payment Box & Details */}
                <div className="flex justify-between items-stretch gap-2 mt-3.5">
                    {/* Status box */}
                    <div className="w-[45%] border border-black rounded-lg p-2 flex flex-col justify-between relative bg-white min-h-[44px]">
                        <div className="absolute -top-2 left-2 bg-white px-1 text-black text-[7px] font-bold uppercase tracking-wider">
                            PAYMENT STATUS
                        </div>
                        <div className="mt-1.5 space-y-1 text-[8.5px] font-semibold text-black">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 border border-black rounded-sm bg-white" />
                                <span>Paid</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 border border-black rounded-sm bg-white" />
                                <span>Due (Dayn)</span>
                            </div>
                        </div>
                    </div>

                    {/* Paid details */}
                    <div className="w-[50%] flex flex-col justify-end text-[7.5px] font-semibold text-slate-800 space-y-1">
                        <div className="flex justify-between items-end">
                            <span className="text-[7px] font-bold text-black">Amount Paid:</span>
                            <span className="border-b border-slate-900 flex-grow h-[8px] ml-1" />
                        </div>
                        <div className="flex justify-between items-end">
                            <span className="text-[7px] font-bold text-black">Balance Due:</span>
                            <span className="border-b border-slate-900 flex-grow h-[8px] ml-1" />
                        </div>
                        <div className="flex justify-between items-end">
                            <span className="text-[7px] font-bold text-black">Payment Method:</span>
                            <span className="border-b border-slate-900 flex-grow h-[8px] ml-1" />
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="relative min-h-screen">
            {/* Dynamic CSS styles for Print */}
            <style>{`
                @media print {
                    /* Hide everything inside body */
                    body * {
                        visibility: hidden;
                    }
                    /* Show only print template */
                    #printable-vouchers-container, #printable-vouchers-container * {
                        visibility: visible;
                    }
                    /* Position print container at top left */
                    #printable-vouchers-container {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 210mm !important;
                        height: 297mm !important;
                        background: white !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        box-shadow: none !important;
                        border: none !important;
                    }
                    .quadrant-box-4 {
                        width: 105mm !important;
                        height: 148.5mm !important; /* Exactly 1/2 of A4 portrait */
                        box-sizing: border-box !important;
                        page-break-inside: avoid !important;
                        page-break-after: avoid !important;
                        page-break-before: avoid !important;
                    }
                    .quadrant-box-6 {
                        width: 105mm !important;
                        height: 99mm !important; /* Exactly 1/3 of A4 portrait */
                        box-sizing: border-box !important;
                        page-break-inside: avoid !important;
                        page-break-after: avoid !important;
                        page-break-before: avoid !important;
                    }
                    @page {
                        size: A4 portrait;
                        margin: 0 !important;
                    }
                }

                .quadrant-box-4 {
                    width: 105mm;
                    height: 148.5mm;
                    padding: 8mm 6.5mm;
                    box-sizing: border-box;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    position: relative;
                    background-color: white;
                }

                .quadrant-box-6 {
                    width: 105mm;
                    height: 99mm;
                    padding: 4mm 5.5mm;
                    box-sizing: border-box;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    position: relative;
                    background-color: white;
                }
            `}</style>

            {/* Dynamic Background Blobs */}
            <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden print:hidden">
                <div className="absolute top-[-10%] right-[-5%] w-[45%] h-[45%] bg-slate-500/5 rounded-full blur-[130px] animate-pulse" />
                <div className="absolute bottom-[-10%] left-[-5%] w-[45%] h-[45%] bg-slate-500/5 rounded-full blur-[130px] animate-pulse" style={{ animationDelay: '3s' }} />
            </div>

            <div className="flex flex-col gap-6 px-8 animate-fade-in max-w-[1700px] mx-auto py-8 relative z-10 print:hidden">
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.push('/manufacturing/sales')} className="p-3 bg-white/60 backdrop-blur-xl rounded-2xl border border-slate-200/50 shadow-xl text-slate-400 hover:text-slate-700 transition-all active:scale-95">
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Print Blank Vouchers (A4)</h1>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">AN-Industory Gate Pass Template Utility</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left Pane - Controls & Actions */}
                    <div className="lg:col-span-4 bg-white/40 backdrop-blur-3xl p-6 rounded-3xl border border-white/50 shadow-2xl flex flex-col gap-6">
                        <div className="pb-3 border-b border-slate-200/40">
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                <FileText size={16} className="text-slate-600" /> Options & Operations
                            </h3>
                        </div>

                        {/* Layout Selector */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Choose Layout Type</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button 
                                    type="button" 
                                    onClick={() => setLayoutType('6')}
                                    className={`py-3.5 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all border ${
                                        layoutType === '6' 
                                            ? 'bg-slate-950 text-white border-slate-950 shadow-lg' 
                                            : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                                    }`}
                                >
                                    6 per Page (3x2)
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => setLayoutType('4')}
                                    className={`py-3.5 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all border ${
                                        layoutType === '4' 
                                            ? 'bg-slate-950 text-white border-slate-950 shadow-lg' 
                                            : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                                    }`}
                                >
                                    4 per Page (2x2)
                                </button>
                            </div>
                        </div>

                        {/* Instructions */}
                        <div className="space-y-3.5 text-xs font-medium text-slate-600 leading-relaxed pt-2 border-t border-slate-200/40">
                            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2.5">
                                <span className="text-[9px] font-black text-slate-800 uppercase tracking-wider block flex items-center gap-1.5"><Info size={14} className="text-blue-500" /> Printing Guide:</span>
                                <ol className="list-decimal pl-4 space-y-1 text-slate-500 font-semibold text-[11px]">
                                    <li>Pick the layout (6 per page or 4 per page).</li>
                                    <li>Set printer margins to <strong>None</strong>.</li>
                                    <li>Turn on <strong>Background graphics</strong> in printer settings.</li>
                                    <li>Cut along the dashed lines with scissors.</li>
                                </ol>
                            </div>
                        </div>

                        {/* Ink Saving Info */}
                        <div className="p-4 bg-slate-950 text-white rounded-2xl relative overflow-hidden shadow-xl shadow-slate-900/10">
                            <div className="absolute top-[-20%] right-[-10%] w-20 h-20 bg-white/5 rounded-full blur-2xl" />
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block mb-1">Ink-Saving Enabled</span>
                            <p className="text-[10px] leading-normal font-semibold text-slate-300">
                                This page runs a greyscale layout to conserve printer cartridges.
                            </p>
                        </div>

                        {/* Print Button */}
                        <div className="flex flex-col gap-3 pt-3 border-t border-slate-200/40">
                            <button type="button" onClick={() => window.print()}
                                className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-slate-900/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <Printer size={16} /> Print Vouchers (A4)
                            </button>
                            <button type="button" onClick={handleDownloadPDF} disabled={pdfLoading}
                                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
                            >
                                {pdfLoading ? (
                                    <>
                                        <Loader2 className="animate-spin" size={16} /> Generating PDF...
                                    </>
                                ) : (
                                    <>
                                        <Download size={16} /> Download PDF
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Right Pane - scaled A4 Live Preview */}
                    <div className="lg:col-span-8 flex flex-col items-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">
                            A4 Preview ({layoutType} Vouchers / Page)
                        </span>
                        <div className="w-full overflow-hidden flex justify-center items-start bg-slate-200/40 border border-slate-200 rounded-3xl p-6 shadow-inner relative max-h-[850px]">
                            {/* Scale Wrapper for Preview */}
                            <div className="scale-[0.45] sm:scale-[0.55] md:scale-[0.62] lg:scale-[0.45] xl:scale-[0.62] origin-top border border-slate-300 shadow-2xl relative bg-white">
                                {/* The exact printable container */}
                                <div id="printable-vouchers-container" className="grid grid-cols-2 bg-white relative w-[210mm] h-[297mm]">
                                    
                                    {/* Scissor markers absolute at boundaries */}
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-1 text-xs z-30 pointer-events-none select-none">✂️</div>
                                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 bg-white px-1 text-xs z-30 pointer-events-none select-none">✂️</div>

                                    {layoutType === '6' ? (
                                        <>
                                            <div className="absolute left-0 top-1/3 -translate-y-1/2 -translate-x-1/2 bg-white py-1 text-xs z-30 pointer-events-none select-none">✂️</div>
                                            <div className="absolute right-0 top-1/3 -translate-y-1/2 translate-x-1/2 bg-white py-1 text-xs z-30 pointer-events-none select-none">✂️</div>
                                            
                                            <div className="absolute left-0 top-2/3 -translate-y-1/2 -translate-x-1/2 bg-white py-1 text-xs z-30 pointer-events-none select-none">✂️</div>
                                            <div className="absolute right-0 top-2/3 -translate-y-1/2 translate-x-1/2 bg-white py-1 text-xs z-30 pointer-events-none select-none">✂️</div>
                                            
                                            <div className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 bg-white p-1 text-xs z-30 pointer-events-none select-none">✂️</div>
                                            <div className="absolute left-1/2 top-2/3 -translate-x-1/2 -translate-y-1/2 bg-white p-1 text-xs z-30 pointer-events-none select-none">✂️</div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 bg-white py-1 text-xs z-30 pointer-events-none select-none">✂️</div>
                                            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 bg-white py-1 text-xs z-30 pointer-events-none select-none">✂️</div>
                                            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-1 text-xs z-30 pointer-events-none select-none">✂️</div>
                                        </>
                                    )}

                                    {/* Render either 4 or 6 vouchers */}
                                    {Array.from({ length: Number(layoutType) }).map((_, index) => renderVoucherQuadrant(index))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
