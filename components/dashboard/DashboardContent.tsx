// components/dashboard/DashboardContent.tsx - Enhanced Dashboard (1000% Design)
'use client'; // Muhiim, haddii ay ku jiraan interactions

import React from 'react';
import Link from 'next/link';
import { DollarSign, Briefcase, Banknote, ArrowUpRight, ArrowDownLeft, TrendingUp, TrendingDown, Plus } from 'lucide-react'; // Icons for dashboard cards
import { BarChart } from 'lucide-react'; // Example for graph
import Toast from '../common/Toast'; // Hubi wadada saxda ah

// Dashboard Card Component
interface DashboardCardProps {
  title: string;
  value: string;
  trend?: 'up' | 'down'; // To show up/down arrow
  colorClass: string; // Tailwind color class like 'text-secondary'
  icon: React.ReactNode;
  description?: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ title, value, trend, colorClass, icon, description }) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col justify-between animate-fade-in-up">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold text-mediumGray dark:text-gray-400">{title}</h3>
      <div className={`text-3xl ${colorClass}`}>{icon}</div>
    </div>
    <div className="flex items-center justify-between">
      <p className={`text-4xl font-extrabold ${colorClass}`}>{value}</p>
      {trend && (
        <span className={`flex items-center text-sm font-medium ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
          {trend === 'up' ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
          {description || ''}
        </span>
      )}
    </div>
    {description && !trend && ( // For general descriptions without trend
        <p className="text-sm text-mediumGray dark:text-gray-500 mt-2">{description}</p>
    )}
  </div>
);

// Recent Activity/List Item
interface ActivityItemProps {
  type: 'project' | 'expense' | 'payment';
  title: string;
  date: string;
  amount?: string;
  status?: string;
}

const ActivityItem: React.FC<ActivityItemProps> = ({ type, title, date, amount, status }) => {
    let icon: React.ReactNode;
    let amountColor = 'text-mediumGray dark:text-gray-400';
    let statusColor = 'text-mediumGray dark:text-gray-500';

    if (type === 'project') {
        icon = <Briefcase className="w-5 h-5 text-primary" />;
        statusColor = status === 'Active' ? 'text-secondary bg-secondary/10' : 'text-mediumGray bg-mediumGray/10';
    } else if (type === 'expense') {
        icon = <DollarSign className="w-5 h-5 text-redError" />;
        amountColor = 'text-redError';
    } else { // payment
        icon = <Banknote className="w-5 h-5 text-green-500" />;
        amountColor = 'text-green-500';
    }

    return (
        <li className="flex items-center justify-between py-2 border-b border-lightGray dark:border-gray-700 last:border-b-0">
            <div className="flex items-center space-x-3">
                {icon}
                <span className="text-darkGray dark:text-gray-100 font-medium">{title}</span>
            </div>
            <div className="flex items-center space-x-4">
                {amount && <span className={`text-sm font-semibold ${amountColor}`}>{amount}</span>}
                {status && <span className={`text-xs px-2 py-1 rounded-full ${statusColor}`}>{status}</span>}
                <span className="text-sm text-mediumGray dark:text-gray-400">{date}</span>
            </div>
        </li>
    );
};


const DashboardContent: React.FC = () => {
  return (
    <>
      <h1 className="text-4xl font-bold text-darkGray dark:text-gray-100 mb-8">Dashboard Overview</h1>

      {/* Overview Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <DashboardCard 
          title="Total Profit" 
          value="$125,000" 
          trend="up"
          description="12% from last month"
          colorClass="text-secondary" 
          icon={<Banknote />} 
        />
        <DashboardCard 
          title="Total Expenses" 
          value="$75,000" 
          trend="down"
          description="5% from last month"
          colorClass="text-redError" 
          icon={<DollarSign />} 
        />
        <DashboardCard 
          title="Bank Balance" 
          value="$50,000" 
          description="Updated today"
          colorClass="text-primary" 
          icon={<Briefcase />} 
        />
      </div>

      {/* Graphs Section - Placeholder with better design */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md mb-8 animate-fade-in-up">
          <h3 className="text-xl font-semibold text-darkGray dark:text-gray-100 mb-4">Profit vs. Expenses (Monthly)</h3>
          <div className="h-64 flex items-center justify-center bg-lightGray dark:bg-gray-700 rounded-lg text-mediumGray dark:text-gray-500">
              <BarChart className="w-16 h-16" /> {/* Placeholder icon */}
              <span className="ml-4 text-lg">Graph Data Coming Soon!</span>
          </div>
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Projects */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md animate-fade-in-up">
          <h3 className="text-xl font-semibold text-darkGray dark:text-gray-100 mb-4">Recent Projects</h3>
          <ul className="space-y-3">
            <ActivityItem type="project" title="Furniture Project A" date="July 20, 2025" status="Active" />
            <ActivityItem type="project" title="Office Setup B" date="July 18, 2025" status="Completed" />
            <ActivityItem type="project" title="Restaurant Decor C" date="July 15, 2025" status="On Hold" />
            <ActivityItem type="project" title="Home Renovation D" date="July 10, 2025" status="Active" />
            <ActivityItem type="project" title="Shop Fit-out E" date="July 05, 2025" status="Completed" />
          </ul>
        </div>

        {/* Recent Expenses */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md animate-fade-in-up">
          <h3 className="text-xl font-semibold text-darkGray dark:text-gray-100 mb-4">Recent Expenses</h3>
          <ul className="space-y-3">
            <ActivityItem type="expense" title="Wood Purchase (Project A)" date="July 23, 2025" amount="-$1,500" />
            <ActivityItem type="expense" title="Employee Salary" date="July 22, 2025" amount="-$2,000" />
            <ActivityItem type="expense" title="Transport for Project C" date="July 21, 2025" amount="-$350" />
            <ActivityItem type="expense" title="Office Supplies" date="July 20, 2025" amount="-$120" />
            <ActivityItem type="payment" title="Client Payment (Project B)" date="July 19, 2025" amount="+$10,000" />
          </ul>
        </div>
      </div>

      {/* Quick Add Floating Button */}
      <Link href="/projects/add" className="fixed bottom-8 right-8 bg-accent text-white p-4 rounded-full shadow-lg text-xl font-bold hover:bg-orange-600 transition-all duration-300 transform hover:scale-110 flex items-center justify-center z-50">
        <Plus className="mr-2" /> Add New
      </Link>
    </>
  );
};

export default DashboardContent;