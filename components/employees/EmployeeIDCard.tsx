'use client';

import React from 'react';
import { User, ShieldCheck, Mail, Phone, Calendar, Building2 } from 'lucide-react';

interface EmployeeIDCardProps {
  employee: {
    fullName: string;
    role: string;
    id: string;
    email?: string | null;
    phone?: string | null;
    startDate: string;
    category?: string;
  };
  companyName?: string;
}

const EmployeeIDCard: React.FC<EmployeeIDCardProps> = ({ employee, companyName = 'REVLO PROJECT' }) => {
  const formattedId = employee.id.substring(0, 8).toUpperCase();
  const formattedDate = new Date(employee.startDate).toLocaleDateString('so-SO', {
    month: 'short',
    year: 'numeric'
  });

  return (
    <div className="id-card-print-container">
      <div className="flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl w-[350px] mx-auto overflow-hidden relative group transition-all duration-300 hover:shadow-2xl">
        {/* Background Design Elements */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-500"></div>
        <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-secondary/10 rounded-full blur-3xl group-hover:bg-secondary/20 transition-all duration-500"></div>
        
        <div className="w-full space-y-6 relative z-10">
          {/* Header */}
          <div className="flex flex-col items-center space-y-2 pb-4 border-b border-gray-100 dark:border-gray-800">
            <div className="p-3 bg-gradient-to-br from-primary to-blue-600 rounded-2xl shadow-inner transform -rotate-3 group-hover:rotate-0 transition-transform duration-300">
              <Building2 className="text-white" size={32} />
            </div>
            <h2 className="text-xl font-black tracking-tighter text-blue-900 dark:text-blue-100 uppercase">
              {companyName}
            </h2>
            <div className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 rounded-full">
              <span className="text-[10px] font-bold text-primary dark:text-blue-300 uppercase tracking-widest">
                Official Staff ID
              </span>
            </div>
          </div>

          {/* Profile Section */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 p-1 shadow-inner border-2 border-white dark:border-gray-800 overflow-hidden transform group-hover:scale-105 transition-transform duration-300">
                <div className="w-full h-full rounded-2xl bg-white dark:bg-gray-950 flex items-center justify-center">
                  <User className="text-gray-300 dark:text-gray-600" size={64} />
                </div>
              </div>
              <div className="absolute -bottom-2 -right-2 bg-green-500 border-4 border-white dark:border-gray-900 rounded-full p-1 shadow-lg">
                <ShieldCheck className="text-white" size={16} />
              </div>
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                {employee.fullName}
              </h3>
              <p className="text-sm font-semibold text-primary dark:text-blue-400 uppercase tracking-wide">
                {employee.role}
              </p>
            </div>
          </div>

          {/* Details Section */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="bg-white/50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center text-center">
              <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase">Employee ID</span>
              <span className="text-xs font-black text-gray-700 dark:text-gray-300">#{formattedId}</span>
            </div>
            <div className="bg-white/50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center text-center">
              <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase">Joined</span>
              <span className="text-xs font-black text-gray-700 dark:text-gray-300">{formattedDate}</span>
            </div>
          </div>

          {/* Footer Card */}
          <div className="pt-2">
            <div className="bg-gray-950 dark:bg-blue-900/40 p-3 rounded-2xl flex items-center justify-between group-hover:bg-blue-900 transition-colors duration-300">
               <div className="flex -space-x-1">
                  {[1,2,3].map(i => (
                    <div key={i} className="w-2 h-2 rounded-full border border-gray-800 bg-blue-500"></div>
                  ))}
               </div>
               <div className="text-[10px] font-mono text-gray-400 group-hover:text-blue-100">
                  REVLO-CERTIFIED-SECURE
               </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .id-card-print-container, .id-card-print-container * {
            visibility: visible;
          }
          .id-card-print-container {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default EmployeeIDCard;
