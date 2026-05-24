'use client';

import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import UltraIcon from './UltraIcon';

interface MetricCardProps {
    label: string;
    value: string;
    trend: string;
    isPositive: boolean;
    icon: any;
    variant: 'primary' | 'secondary' | 'accent' | 'neutral' | 'danger';
    subtext?: string;
}

export default function MetricCard({ label, value, trend, isPositive, icon: Icon, variant, subtext = "this week" }: MetricCardProps) {
    return (
        <div className="bg-white/50 dark:bg-[#1f2937]/30 backdrop-blur-md rounded-[24px] p-1 border border-gray-100 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/10 transition-colors group">
            <div className="bg-white dark:bg-[#0f172a] rounded-[20px] p-6 h-full relative overflow-hidden shadow-sm dark:shadow-none hover:shadow-md transition-all">
                {/* Background pattern */}
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] transform translate-x-4 -translate-y-4 pointer-events-none transition-transform group-hover:scale-110 duration-500">
                    <Icon size={120} />
                </div>

                <div className="flex justify-between items-start relative z-10">
                    <div className="flex flex-col justify-between h-full">
                        <div>
                            <p className="text-gray-500 dark:text-gray-400 font-bold text-xs uppercase tracking-wider mb-2 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">{label}</p>
                            <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight leading-none mb-3">{value}</h3>
                        </div>

                        <div className="flex items-center gap-2 mt-2">
                            <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${isPositive ? 'bg-[#2ECC71]/10 text-[#2ECC71]' : 'bg-red-500/10 text-red-500'}`}>
                                {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                <span>{trend}</span>
                            </div>
                            <span className="text-xs text-gray-400 font-medium">{subtext}</span>
                        </div>
                    </div>

                    <UltraIcon icon={Icon} variant={variant} />
                </div>
            </div>
        </div>
    );
};
