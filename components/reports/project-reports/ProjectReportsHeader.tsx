import React from 'react';
import { FileText, Download, Printer } from 'lucide-react';
import { ProjectReportsData } from './types';

interface ProjectReportsHeaderProps {
    data: ProjectReportsData;
    dateRangeText: string;
    loading: boolean;
    onExportPDF: () => void;
    onPrint: () => void;
}

export const ProjectReportsHeader: React.FC<ProjectReportsHeaderProps> = ({
    data,
    dateRangeText,
    loading,
    onExportPDF,
    onPrint,
}) => {
    return (
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-3 py-4 md:px-8 shadow-sm rounded-2xl mb-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                {/* Title */}
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="bg-blue-600 text-white p-2.5 rounded-xl shadow-lg shadow-blue-500/30">
                        <FileText size={22} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-none">
                            {data.companyName}
                        </h1>
                        <p className="text-sm text-primary font-semibold mt-1">
                            Warbixinta Mashaariicda
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {dateRangeText}
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 print:hidden">
                    <button
                        onClick={onExportPDF}
                        disabled={loading}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition shadow-lg shadow-blue-500/20 disabled:opacity-50"
                    >
                        <Download size={14} /> PDF
                    </button>
                    <button
                        onClick={onPrint}
                        disabled={loading}
                        className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition disabled:opacity-50"
                    >
                        <Printer size={14} /> Print
                    </button>
                </div>
            </div>
        </div>
    );
};
