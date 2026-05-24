import React from 'react';
import { ProjectReportsData } from './types';
import { ArrowUpRight, ArrowDownRight, TrendingUp, DollarSign, Wallet, AlertCircle, FolderOpen } from 'lucide-react';

interface ReportsSummaryStatsProps {
    summary: ProjectReportsData['summary'];
}

export const ReportsSummaryStats: React.FC<ReportsSummaryStatsProps> = ({ summary }) => {
    const cards = [
        {
            title: 'Wadarta Dakhliga',
            value: summary.totalRevenue,
            type: 'currency' as const,
            icon: DollarSign,
            color: 'text-emerald-600 dark:text-emerald-400',
            bg: 'bg-emerald-50 dark:bg-emerald-900/20',
            border: 'border-emerald-100 dark:border-emerald-800',
        },
        {
            title: 'Wadarta Kharashyada',
            value: summary.totalExpenses,
            type: 'currency' as const,
            icon: Wallet,
            color: 'text-rose-600 dark:text-rose-400',
            bg: 'bg-rose-50 dark:bg-rose-900/20',
            border: 'border-rose-100 dark:border-rose-800',
        },
        {
            title: "Wadarta Faa'iidada",
            value: summary.totalProfit,
            type: 'currency' as const,
            icon: TrendingUp,
            color: summary.totalProfit >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600 dark:text-rose-400',
            bg: summary.totalProfit >= 0 ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-rose-50 dark:bg-rose-900/20',
            border: summary.totalProfit >= 0 ? 'border-blue-100 dark:border-blue-800' : 'border-rose-100 dark:border-rose-800',
        },
        {
            title: 'Daynta Heshiiska',
            value: Number(summary.totalRemainingAgreement || 0),
            type: 'currency' as const,
            icon: Wallet,
            color: 'text-blue-600 dark:text-blue-400',
            bg: 'bg-blue-50 dark:bg-blue-900/20',
            border: 'border-blue-100 dark:border-blue-800',
        },
        {
            title: 'Daynta Macmiilka',
            value: summary.totalReceivables,
            type: 'currency' as const,
            icon: AlertCircle,
            color: 'text-orange-600 dark:text-orange-400',
            bg: 'bg-orange-50 dark:bg-orange-900/20',
            border: 'border-orange-200 dark:border-orange-800',
        },
        {
            title: 'Faa\'iidada %',
            value: `${summary.averageProfitMargin.toFixed(1)}%`,
            type: 'text' as const,
            icon: summary.averageProfitMargin >= 0 ? ArrowUpRight : ArrowDownRight,
            color: 'text-indigo-600 dark:text-indigo-400',
            bg: 'bg-indigo-50 dark:bg-indigo-900/20',
            border: 'border-indigo-100 dark:border-indigo-800',
        },
    ];

    return (
        <div className="space-y-4 mb-8">
            {/* Project Status Counts */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <FolderOpen size={16} className="text-gray-500" />
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{summary.totalProjects}</span>
                    <span className="text-xs text-gray-500">Mashaariic</span>
                </div>
                <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-3 py-1.5 rounded-lg text-xs font-bold border border-blue-100 dark:border-blue-800">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    {summary.activeProjects} Socda
                </div>
                <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-3 py-1.5 rounded-lg text-xs font-bold border border-emerald-100 dark:border-emerald-800">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    {summary.completedProjects} Dhammaystiran
                </div>
                {summary.onHoldProjects > 0 && (
                    <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 px-3 py-1.5 rounded-lg text-xs font-bold border border-amber-100 dark:border-amber-800">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        {summary.onHoldProjects} Hakad
                    </div>
                )}
            </div>

            {/* Financial Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 print:grid-cols-6">
                {cards.map((card, index) => (
                    <div
                        key={index}
                        className={`relative p-4 rounded-2xl border ${card.border} ${card.bg} transition-all duration-200 hover:shadow-sm overflow-hidden`}
                    >
                        <div className="flex items-center gap-2 mb-3">
                            <div className={`p-1.5 rounded-lg bg-white/80 dark:bg-black/20 ${card.color}`}>
                                <card.icon size={16} />
                            </div>
                        </div>
                        <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1 leading-tight">{card.title}</p>
                        <h3 className={`text-lg font-bold tracking-tight ${card.color} leading-none`}>
                            {card.type === 'currency' && typeof card.value === 'number'
                                ? card.value.toLocaleString()
                                : card.value}
                        </h3>
                        {/* Decorative circle */}
                        <div className={`w-12 h-12 absolute -right-2 -top-2 rounded-full opacity-[0.06] ${card.color.replace('text-', 'bg-')}`} />
                    </div>
                ))}
            </div>
        </div>
    );
};
