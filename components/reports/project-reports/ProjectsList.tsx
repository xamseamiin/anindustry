import React from 'react';
import { ChevronDown, ChevronUp, HardHat, Layers, DollarSign, TrendingUp, TrendingDown, Package, Wallet } from 'lucide-react';
import { ProjectReport } from './types';
import { AnimatePresence, motion } from 'framer-motion';

interface ProjectsListProps {
    projects: ProjectReport[];
    visibleProjects: ProjectReport[];
    showDetails: boolean;
    expandedProjects: Set<string>;
    toggleProjectExpansion: (id: string) => void;
    loading: boolean;
}

const getStatusStyle = (status: string) => {
    switch (status) {
        case 'Completed': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200';
        case 'Active': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200';
        case 'On Hold': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200';
        default: return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 border-gray-200';
    }
};

const cleanDesc = (d: string) => d.replace(/\s-\s\d{4}-\d{2}-\d{2}$/, '');

const WRow = ({ label, amount, type }: { label: string; amount: number; type: 'in' | 'out' | 'total' }) => {
    if (amount === 0) return null;
    const color = type === 'in' ? 'text-green-600 dark:text-green-400' : type === 'out' ? 'text-red-500 dark:text-red-400' : (amount >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-red-600');
    const sign = type === 'in' ? '+' : type === 'out' ? '−' : '';
    const bold = type === 'total' ? 'font-black text-base' : 'font-semibold text-sm';
    return (
        <div className={`flex justify-between items-center py-1.5 ${type === 'total' ? 'border-t-2 border-gray-800 dark:border-gray-300 mt-2 pt-3' : ''}`}>
            <span className={`text-gray-600 dark:text-gray-300 ${type === 'total' ? 'font-bold text-sm' : 'text-xs'}`}>{label}</span>
            <span className={`${bold} ${color} tabular-nums`}>{sign} {Math.abs(amount).toLocaleString()}</span>
        </div>
    );
};

const ProjectCard: React.FC<{ project: ProjectReport; isExpanded: boolean; onToggle: () => void; showDetails: boolean }> = ({ project, isExpanded, onToggle, showDetails }) => {
    const p = project;
    const catOrder = ['Material', 'Transport', 'Equipment', 'Utilities', 'Consultancy', 'Subcontractor', 'Debt Repayment', 'Other'];
    // Filter out 'Labor' from categories — laborBreakdown section shows it grouped by employee instead
    const sortedCats = Object.keys(p.expensesByCategory || {}).filter(cat => cat !== 'Labor').sort((a, b) => {
        const ia = catOrder.indexOf(a); const ib = catOrder.indexOf(b);
        return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-shadow hover:shadow-md">
            {/* Project Header — Always visible */}
            <div className="cursor-pointer" onClick={onToggle}>
                {/* Top color bar */}
                <div className={`h-1 ${p.status === 'Active' ? 'bg-blue-500' : p.status === 'Completed' ? 'bg-emerald-500' : 'bg-amber-400'}`} />

                <div className="p-4 md:p-5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3 min-w-0">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">{p.name}</h3>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border flex-shrink-0 ${getStatusStyle(p.status)}`}>{p.status}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 dark:text-gray-400">{p.customer}</span>
                            <button className={`p-1.5 rounded-full transition ${isExpanded ? 'bg-primary/10 text-primary' : 'text-gray-400 hover:text-gray-600'}`}>
                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                        </div>
                    </div>

                    {/* Financial Waterfall Summary */}
                    <div className="bg-gray-50/80 dark:bg-gray-900/40 rounded-xl p-4 space-y-0.5">
                        <div className="flex justify-between items-center py-1.5 border-b border-gray-200 dark:border-gray-700 mb-1">
                            <span className="font-bold text-gray-800 dark:text-gray-100 text-xs">Qiimaha Heshiiska (Agreement)</span>
                            <span className="font-bold text-gray-900 dark:text-white tabular-nums text-sm">{p.projectValue.toLocaleString()}</span>
                        </div>
                        <WRow label="+ Lacagta la helay (Collected)" amount={p.totalRevenue} type="in" />
                        <WRow label="− Kharashyada (Expenses)" amount={p.totalExpenses} type="out" />
                        {p.remainingRevenue > 0 && <WRow label="− Haraaga (Remaining Debt)" amount={p.remainingRevenue} type="out" />}
                        <WRow label="Faa'iidada (Cash Profit)" amount={p.grossProfit} type="total" />
                        {p.projectedProfit !== p.grossProfit && (
                            <div className="flex justify-between items-center pt-1">
                                <span className="text-[10px] text-gray-400">Faa'iido Heshiis (Projected)</span>
                                <span className={`text-xs font-semibold tabular-nums ${p.projectedProfit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{p.projectedProfit.toLocaleString()}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Expanded Details */}
            <AnimatePresence>
                {showDetails && isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                        <div className="border-t border-gray-100 dark:border-gray-700">

                            {/* ====== EXPENSES BY CATEGORY ====== */}
                            {sortedCats.length > 0 && sortedCats.map(cat => {
                                const items = p.expensesByCategory[cat] || [];
                                if (!items.length) return null;
                                const catTotal = items.reduce((s, e) => s + e.amount, 0);
                                const catColor = cat === 'Material' ? 'purple' : cat === 'Labor' ? 'blue' : cat === 'Transport' ? 'teal' : cat === 'Equipment' ? 'indigo' : 'gray';

                                return (
                                    <div key={cat} className="border-b border-gray-50 dark:border-gray-700/50 last:border-0">
                                        <div className={`px-5 py-3 flex justify-between items-center bg-${catColor}-50/30 dark:bg-${catColor}-900/10`}>
                                            <h4 className="font-bold text-sm text-gray-800 dark:text-white flex items-center gap-2">
                                                {cat === 'Material' && <Package size={15} className="text-purple-500" />}
                                                {cat === 'Labor' && <HardHat size={15} className="text-blue-500" />}
                                                {cat !== 'Material' && cat !== 'Labor' && <Wallet size={15} className="text-gray-500" />}
                                                {cat}
                                            </h4>
                                            <span className="text-xs font-bold text-red-600 dark:text-red-400">−{catTotal.toLocaleString()}</span>
                                        </div>

                                        {/* Material with breakdown */}
                                        {cat === 'Material' ? (
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-xs text-left">
                                                    <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 font-medium">
                                                        <tr>
                                                            <th className="px-5 py-2">Taariikh</th>
                                                            <th className="px-3 py-2">Sharaxaad</th>
                                                            <th className="px-3 py-2">Agabka</th>
                                                            <th className="px-3 py-2 text-right">Qty</th>
                                                            <th className="px-3 py-2 text-right">Qiimaha</th>
                                                            <th className="px-5 py-2 text-right">Total</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                                                        {items.map((e, idx) => {
                                                            if (e.materials && Array.isArray(e.materials) && e.materials.length > 0) {
                                                                return e.materials.map((m: any, mi: number) => {
                                                                    const qty = Number(m.qty ?? m.quantity ?? 0);
                                                                    const price = Number(m.price ?? 0);
                                                                    return (
                                                                        <tr key={`${e.id}-${mi}`} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                                                            <td className="px-5 py-2.5 text-gray-600 whitespace-nowrap">{mi === 0 ? e.date : ''}</td>
                                                                            <td className="px-3 py-2.5 text-gray-700 dark:text-gray-300">{mi === 0 ? cleanDesc(e.description) : ''}</td>
                                                                            <td className="px-3 py-2.5 font-medium text-gray-900 dark:text-white">{m.name}</td>
                                                                            <td className="px-3 py-2.5 text-right text-gray-600 font-mono">{qty} {m.unit || ''}</td>
                                                                            <td className="px-3 py-2.5 text-right text-gray-600 font-mono">{price.toLocaleString()}</td>
                                                                            <td className="px-5 py-2.5 text-right font-bold text-gray-900 dark:text-white">{(qty * price).toLocaleString()}</td>
                                                                        </tr>
                                                                    );
                                                                });
                                                            }
                                                            return (
                                                                <tr key={e.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                                                    <td className="px-5 py-2.5 text-gray-600 whitespace-nowrap">{e.date}</td>
                                                                    <td className="px-3 py-2.5 text-gray-700 dark:text-gray-300" colSpan={3}>{cleanDesc(e.description)}</td>
                                                                    <td className="px-3 py-2.5" />
                                                                    <td className="px-5 py-2.5 text-right font-bold text-gray-900 dark:text-white">{e.amount.toLocaleString()}</td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                                                {items.map(e => (
                                                    <div key={e.id} className="px-5 py-3 flex justify-between items-start hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                                                        <div className="min-w-0 flex-1">
                                                            <p className="font-medium text-sm text-gray-900 dark:text-white truncate">{cleanDesc(e.description)}</p>
                                                            <div className="flex flex-wrap gap-1 mt-1">
                                                                <span className="text-[10px] text-gray-400">{e.date}</span>
                                                                {e.employeeName && <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-medium">👤 {e.employeeName}</span>}
                                                                {e.accountName && <span className="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">{e.accountName}</span>}
                                                            </div>
                                                        </div>
                                                        <span className="font-bold text-sm text-gray-900 dark:text-white ml-3 flex-shrink-0">−{e.amount.toLocaleString()}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {/* ====== LABOR BREAKDOWN (by employee) ====== */}
                            {p.laborBreakdown && p.laborBreakdown.length > 0 && (
                                <div className="border-t border-gray-100 dark:border-gray-700">
                                    <div className="px-5 py-3 flex justify-between items-center bg-blue-50/40 dark:bg-blue-900/10">
                                        <h4 className="font-bold text-sm text-gray-800 dark:text-white flex items-center gap-2">
                                            <HardHat size={15} className="text-blue-500" />
                                            Shaqaalaha — Kala Saar
                                        </h4>
                                        <span className="text-xs font-bold text-blue-600">
                                            {p.laborBreakdown.length} Shaqaale
                                        </span>
                                    </div>
                                    <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                                        {p.laborBreakdown.map((emp, idx) => (
                                            <div key={idx} className="px-5 py-3">
                                                <div className="flex justify-between items-center mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-xs font-bold text-blue-700 dark:text-blue-400">
                                                            {emp.employeeName.charAt(0).toUpperCase()}
                                                        </div>
                                                        <span className="font-bold text-sm text-gray-900 dark:text-white">{emp.employeeName}</span>
                                                    </div>
                                                    <span className="font-bold text-sm text-red-600">−{emp.totalPaid.toLocaleString()}</span>
                                                </div>
                                                {emp.items.length > 0 && (
                                                    <div className="ml-9 space-y-1">
                                                        {emp.items.map((item, ii) => (
                                                            <div key={ii} className="flex justify-between text-xs text-gray-500">
                                                                <span>{item.date} — {cleanDesc(item.description)}</span>
                                                                <span className="font-medium text-gray-700 dark:text-gray-300">{item.amount.toLocaleString()}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ====== MATERIALS USED ====== */}
                            {p.materialsUsed && p.materialsUsed.length > 0 && (
                                <div className="border-t border-gray-100 dark:border-gray-700">
                                    <div className="px-5 py-3 flex justify-between items-center bg-cyan-50/40 dark:bg-cyan-900/10">
                                        <h4 className="font-bold text-sm text-gray-800 dark:text-white flex items-center gap-2">
                                            <Layers size={15} className="text-cyan-500" />
                                            Agabka La Isticmaalay
                                        </h4>
                                        <span className="text-xs font-bold text-cyan-600">{p.materialsUsed.length} Agab</span>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs text-left">
                                            <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 font-medium">
                                                <tr>
                                                    <th className="px-5 py-2">Magaca</th>
                                                    <th className="px-3 py-2 text-right">Tirada</th>
                                                    <th className="px-3 py-2 text-right">Qiimaha/Unit</th>
                                                    <th className="px-3 py-2 text-right">Hadhay</th>
                                                    <th className="px-5 py-2 text-right">Wadarta</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                                                {p.materialsUsed.map(m => (
                                                    <tr key={m.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                                        <td className="px-5 py-2.5 font-medium text-gray-900 dark:text-white">{m.name}</td>
                                                        <td className="px-3 py-2.5 text-right font-mono text-gray-600">{m.quantityUsed} {m.unit}</td>
                                                        <td className="px-3 py-2.5 text-right font-mono text-gray-600">{m.costPerUnit.toLocaleString()}</td>
                                                        <td className="px-3 py-2.5 text-right text-gray-500">{m.leftoverQty} {m.unit}</td>
                                                        <td className="px-5 py-2.5 text-right font-bold text-gray-900 dark:text-white">{m.totalCost.toLocaleString()}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* ====== PAYMENTS ====== */}
                            {p.payments && p.payments.length > 0 && (
                                <div className="border-t border-gray-100 dark:border-gray-700">
                                    <div className="px-5 py-3 flex justify-between items-center bg-green-50/40 dark:bg-green-900/10">
                                        <h4 className="font-bold text-sm text-gray-800 dark:text-white flex items-center gap-2">
                                            <DollarSign size={15} className="text-green-500" />
                                            Lacagaha La Helay
                                        </h4>
                                        <span className="text-xs font-bold text-green-600">+{p.totalRevenue.toLocaleString()}</span>
                                    </div>
                                    <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                                        {p.payments.map(pay => (
                                            <div key={pay.id} className="px-5 py-3 flex justify-between items-start hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                                                <div>
                                                    <p className="font-medium text-sm text-gray-900 dark:text-white">{cleanDesc(pay.description)}</p>
                                                    <div className="flex gap-2 mt-1">
                                                        <span className="text-[10px] text-gray-400">{pay.date}</span>
                                                        {pay.customerName && <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-medium">{pay.customerName}</span>}
                                                        {pay.accountName && <span className="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">{pay.accountName}</span>}
                                                    </div>
                                                </div>
                                                <span className="font-bold text-sm text-green-600 ml-3 flex-shrink-0">+{pay.amount.toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Empty state */}
                            {sortedCats.length === 0 && (!p.payments || p.payments.length === 0) && (
                                <div className="p-8 text-center text-gray-400 italic">Wax dhaqdhaqaaq ah lagama diiwaangelin mashruucan.</div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export const ProjectsList: React.FC<ProjectsListProps> = ({ visibleProjects, showDetails, expandedProjects, toggleProjectExpansion }) => {
    if (visibleProjects.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center">
                <p className="text-gray-400 text-lg">Wax mashruuc ah lama helin.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {visibleProjects.map(project => (
                <ProjectCard
                    key={project.id}
                    project={project}
                    isExpanded={expandedProjects.has(project.id)}
                    onToggle={() => toggleProjectExpansion(project.id)}
                    showDetails={showDetails}
                />
            ))}

            {/* Grand Total Footer */}
            {visibleProjects.length > 1 && (
                <div className="bg-gradient-to-r from-slate-900 to-slate-700 rounded-2xl p-5 shadow-lg">
                    <h3 className="font-black text-white text-sm tracking-wide mb-3">WADARTA GUUD — {visibleProjects.length} MASHRUUC</h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {[
                            { label: 'Qiimaha', value: visibleProjects.reduce((s, p) => s + p.projectValue, 0), color: 'text-white' },
                            { label: 'La Helay', value: visibleProjects.reduce((s, p) => s + p.totalRevenue, 0), color: 'text-green-400' },
                            { label: 'Kharashka', value: visibleProjects.reduce((s, p) => s + p.totalExpenses, 0), color: 'text-red-400' },
                            { label: "Faa'iida", value: visibleProjects.reduce((s, p) => s + p.grossProfit, 0), color: visibleProjects.reduce((s, p) => s + p.grossProfit, 0) >= 0 ? 'text-green-300' : 'text-red-400' },
                            { label: 'Maqan', value: visibleProjects.reduce((s, p) => s + p.receivables, 0), color: 'text-orange-400' },
                        ].map((item, i) => (
                            <div key={i}>
                                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">{item.label}</p>
                                <p className={`text-lg font-bold tabular-nums ${item.color}`}>{item.value.toLocaleString()}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
