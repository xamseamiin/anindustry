import React from 'react';
import { Filter, Eye, EyeOff, Calendar as CalendarIcon, ChevronsDownUp, ChevronsUpDown } from 'lucide-react';
import { DateFilterType, ProjectReportsData } from './types';

interface ReportsFilterBarProps {
    dateFilter: DateFilterType;
    setDateFilter: (filter: DateFilterType) => void;
    showDetails: boolean;
    setShowDetails: (show: boolean) => void;
    selectedProjectId: string;
    setSelectedProjectId: (id: string) => void;
    projects: ProjectReportsData['projects'];
    customStartDate: string;
    setCustomStartDate: (date: string) => void;
    customEndDate: string;
    setCustomEndDate: (date: string) => void;
    showCustomDateInput: boolean;
    setShowCustomDateInput: (show: boolean) => void;
    expandAll?: boolean;
    onToggleExpandAll?: () => void;
}

export const ReportsFilterBar: React.FC<ReportsFilterBarProps> = ({
    dateFilter,
    setDateFilter,
    showDetails,
    setShowDetails,
    selectedProjectId,
    setSelectedProjectId,
    projects,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    showCustomDateInput,
    setShowCustomDateInput,
    expandAll,
    onToggleExpandAll,
}) => {
    const dateFilters: { label: string; value: DateFilterType }[] = [
        { label: 'Dhammaan', value: 'all' },
        { label: 'Sanadkan', value: 'thisYear' },
        { label: 'Bishii', value: 'lastMonth' },
        { label: '2 Bilood', value: 'lastTwoMonths' },
        { label: 'Todobaadka', value: 'lastWeek' },
    ];

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-2 mb-6 print:hidden">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-3 p-2">

                {/* Date Filters */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 w-full lg:w-auto scrollbar-hide">
                    <div className="flex items-center gap-2 pr-3 border-r border-gray-100 dark:border-gray-700 mr-1">
                        <div className="p-1.5 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-400">
                            <Filter size={16} />
                        </div>
                    </div>

                    <div className="flex bg-gray-50 dark:bg-gray-700/50 p-1 rounded-xl">
                        {dateFilters.map((filter) => (
                            <button
                                key={filter.value}
                                onClick={() => setDateFilter(filter.value)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap ${dateFilter === filter.value
                                    ? 'bg-white dark:bg-gray-600 text-primary shadow-sm'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                                    }`}
                            >
                                {filter.label}
                            </button>
                        ))}
                        <button
                            onClick={() => {
                                setDateFilter('custom');
                                setShowCustomDateInput(!showCustomDateInput);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap flex items-center gap-1.5 ${dateFilter === 'custom'
                                ? 'bg-white dark:bg-gray-600 text-primary shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                                }`}
                        >
                            Custom
                            <CalendarIcon size={12} />
                        </button>
                    </div>
                </div>

                {/* Right Side Controls */}
                <div className="flex items-center gap-2 w-full lg:w-auto">
                    {projects.length > 0 && (
                        <div className="flex-1 lg:flex-none">
                            <select
                                value={selectedProjectId}
                                onChange={(e) => setSelectedProjectId(e.target.value)}
                                className="w-full lg:w-44 px-3 py-2 bg-gray-50 dark:bg-gray-700 border-none rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-primary/20 cursor-pointer"
                            >
                                <option value="all">Dhammaan ({projects.length})</option>
                                {projects.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {onToggleExpandAll && (
                        <button
                            onClick={onToggleExpandAll}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${expandAll
                                ? 'bg-primary/10 text-primary'
                                : 'bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-300 hover:bg-gray-100'
                                }`}
                            title={expandAll ? 'Laab dhammaan' : 'Fur dhammaan'}
                        >
                            {expandAll ? <ChevronsDownUp size={14} /> : <ChevronsUpDown size={14} />}
                            <span className="hidden sm:inline">{expandAll ? 'Laab' : 'Fur Dhan'}</span>
                        </button>
                    )}

                    <button
                        onClick={() => setShowDetails(!showDetails)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${showDetails
                            ? 'bg-primary/10 text-primary'
                            : 'bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                            }`}
                    >
                        {showDetails ? <EyeOff size={14} /> : <Eye size={14} />}
                        <span className="hidden sm:inline">{showDetails ? 'Qari' : 'Faahfaahin'}</span>
                    </button>
                </div>
            </div>

            {/* Custom Date Inputs */}
            {showCustomDateInput && (
                <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row items-end gap-4 animate-in slide-in-from-top-2 duration-200">
                    <div className="w-full sm:w-auto">
                        <label className="block text-xs font-semibold text-gray-500 mb-1.5">Bilowga</label>
                        <input
                            type="date"
                            value={customStartDate}
                            onChange={(e) => {
                                setCustomStartDate(e.target.value);
                                setDateFilter('custom');
                            }}
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
                        />
                    </div>
                    <div className="w-full sm:w-auto">
                        <label className="block text-xs font-semibold text-gray-500 mb-1.5">Dhamaadka</label>
                        <input
                            type="date"
                            value={customEndDate}
                            onChange={(e) => {
                                setCustomEndDate(e.target.value);
                                setDateFilter('custom');
                            }}
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
