// app/manufacturing/page.tsx - AN-Industory Factory Hub (Fully Live Glassmorphism)
'use client';

import React, { useState, useEffect } from 'react';
import {
  Factory, Package, ClipboardList, Users, TrendingUp, Truck, 
  AlertTriangle, RotateCw, Plus as PlusIcon, Box, ArrowRight, 
  Loader2, DollarSign, ShoppingCart, Activity, ChevronRight, Boxes, Zap,
  ArrowUpRight, Wallet, TrendingDown
} from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';

const localTranslations = {
  so: {
    connecting: "Ku xidhaynaa Xarunta Warshadda...",
    hub: "Xarunta Shirkadda",
    liveOverview: "Dulmarka Tooska ah",
    commandCenter: "Xarunta Maamulka Warshadda",
    startProduction: "Billaaw Warshadayn",
    totalSales: "Wadarta Iibka",
    lifetimeRevenue: "Dakhliga Guud",
    outstandingDebt: "Deynta Kaa Maqan",
    customerBalance: "Hadhaaga Macaamiisha",
    payablesDebt: "Deynta Lagugu Leeyahay",
    payablesBalance: "Deynta Alaab-qeybiyeyaasha",
    dailyOutput: "Soosaarka Maalinlaha",
    bottlesToday: "Badeecada Maanta",
    activeOrders: "Dalabaadka Socda",
    inQueue: "Ku Jira Safka",
    rawMaterials: "Qalabka Qayriin",
    liveStockRaw: "Kaydka Qayriin",
    noMaterials: "Ma jiraan qalab la diiwaangeliyey",
    finishedGoods: "Badeecada Bisil",
    liveStockFinished: "Kaydka Bisil",
    noProducts: "Ma jiraan badeecado kaydka ku jira",
    recentRuns: "Warshadayntii U Danbaysay",
    liveActivity: "Diiwaanka Tooska ah",
    viewHub: "Fiiri Xarunta",
    batchId: "Tixraaca",
    product: "Badeecad",
    qty: "Tirada",
    status: "Xaaladda",
    time: "Waqtiga",
    noRecent: "Ma Jiro Diiwaan Cusub",
    opsCenter: "Xarunta Hawlgallada",
    newSale: "Iib Cusub",
    purchase: "Iibso Alaab",
    financeOverview: "Dulmarka Maaliyadda",
    totalRevenue: "Wadarta Dakhliga",
    outstandingBalance: "Hadhaaga Deynta",
    openFinance: "Fur Xarunta Maaliyadda",
    accountsOverview: "Hantida Koontooyinka",
    bankAndCash: "Bangiyada iyo Kaashka",
  },
  en: {
    connecting: "Connecting Factory Hub...",
    hub: "Enterprise Hub",
    liveOverview: "Live Overview",
    commandCenter: "Factory Command Center",
    startProduction: "Start Production",
    totalSales: "Total Sales",
    lifetimeRevenue: "Lifetime Revenue",
    outstandingDebt: "Receivables",
    customerBalance: "Customer Balance",
    payablesDebt: "Payables",
    payablesBalance: "Supplier Debt",
    dailyOutput: "Daily Output",
    bottlesToday: "Bottles Today",
    activeOrders: "Active Orders",
    inQueue: "In Queue",
    rawMaterials: "Raw Materials",
    liveStockRaw: "Live Stock",
    noMaterials: "No Materials Tracked",
    finishedGoods: "Finished Goods",
    liveStockFinished: "Live Stock",
    noProducts: "No Products in Stock",
    recentRuns: "Recent Production Runs",
    liveActivity: "Live Activity Log",
    viewHub: "View Hub",
    batchId: "Batch ID",
    product: "Product",
    qty: "Quantity",
    status: "Status",
    time: "Time",
    noRecent: "No Recent Activity",
    opsCenter: "Operations Center",
    newSale: "New Sale",
    purchase: "Purchase",
    financeOverview: "Finance Overview",
    totalRevenue: "Total Revenue",
    outstandingBalance: "Outstanding Balance",
    openFinance: "Open Financial Hub",
    accountsOverview: "Accounts Overview",
    bankAndCash: "Banks & Cash",
  }
};

export default function EnterpriseDashboard() {
  const { language } = useLanguage();
  const tLocal = localTranslations[language as 'so' | 'en'] || localTranslations.so;
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  const fetchDashboardData = () => {
    fetch('/api/manufacturing/dashboard')
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDashboardData();
    // Make the dashboard truly LIVE by polling every 10 seconds
    const interval = setInterval(fetchDashboardData, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-blue-500/5 blur-[100px] animate-pulse" />
        <div className="relative z-10 flex flex-col items-center gap-4">
            <div className="w-16 h-16 relative">
                <div className="absolute inset-0 rounded-full border-4 border-blue-500/20" />
                <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
            </div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">{tLocal.connecting}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      {/* Ultra-Premium Dynamic Background Blobs */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[45%] h-[45%] bg-blue-500/10 rounded-full blur-[130px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[45%] h-[45%] bg-emerald-500/10 rounded-full blur-[130px] animate-pulse" style={{ animationDelay: '3s' }} />
      </div>

      <div className="flex flex-col gap-6 md:gap-8 px-4 md:px-8 animate-fade-in max-w-[1700px] mx-auto py-6 md:py-8 relative z-10">
        {/* Enterprise Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-white/60 backdrop-blur-xl rounded-2xl shadow-xl border border-white/40 text-blue-600">
              <Factory size={32} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{tLocal.hub}</span>
                <ChevronRight size={10} className="text-slate-400" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{tLocal.liveOverview}</span>
              </div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">{tLocal.commandCenter}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/manufacturing/production-orders/add" className="px-6 py-3.5 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-600/30 hover:bg-blue-700 transition-all flex items-center gap-2">
              <PlusIcon size={18} /> {tLocal.startProduction}
            </Link>
          </div>
        </div>

        {/* KPI Section with Glassmorphism */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {[
            { title: tLocal.totalSales, value: (data?.totalSales || 0).toLocaleString(), sub: tLocal.lifetimeRevenue, icon: <TrendingUp size={20} />, color: 'emerald' },
            { title: tLocal.outstandingDebt, value: (data?.receivablesDebt || 0).toLocaleString(), sub: tLocal.customerBalance, icon: <Wallet size={20} />, color: 'blue' },
            { title: tLocal.payablesDebt, value: (data?.payablesDebt || 0).toLocaleString(), sub: tLocal.payablesBalance, icon: <AlertTriangle size={20} />, color: 'rose' },
            { title: tLocal.dailyOutput, value: (data?.dailyOutput || 0).toLocaleString(), sub: tLocal.bottlesToday, icon: <Boxes size={20} />, color: 'amber' }
          ].map((stat, idx) => (
            <div key={idx} className="bg-white/40 backdrop-blur-2xl p-5 md:p-6 rounded-3xl border border-white/40 shadow-xl group hover:scale-[1.02] transition-all duration-300">
              <div className="flex items-center gap-4 mb-4">
                <div className={`p-3 rounded-2xl bg-${stat.color}-500/10 text-${stat.color}-600 group-hover:rotate-12 transition-transform`}>{stat.icon}</div>
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.title}</h3>
              </div>
              <p className="text-2xl font-black text-slate-900 tracking-tight">
                {stat.value} {stat.title.includes('Sales') || stat.title.includes('Debt') || stat.title.includes('Deynta') || stat.title.includes('Receivables') || stat.title.includes('Payables') ? <span className="text-[10px] text-slate-400 font-bold ml-1">ETB</span> : null}
              </p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{stat.sub}</p>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Inventory Overview (Glassy) */}
          <div className="lg:col-span-2 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/30 backdrop-blur-3xl p-5 md:p-7 rounded-3xl border border-white/50 shadow-2xl">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h4 className="text-xl font-black text-slate-900 tracking-tight">{tLocal.rawMaterials}</h4>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{tLocal.liveStockRaw}</p>
                        </div>
                        <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl">
                            <Package size={22} />
                        </div>
                    </div>
                    <div className="space-y-6">
                        {(data?.rawMaterials?.length > 0) ? data.rawMaterials.map((item: any) => (
                            <div key={item.name} className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-black text-slate-700">{item.name}</span>
                                    <span className="text-[10px] font-black text-slate-900">{item.quantity.toLocaleString()} {item.unit}</span>
                                </div>
                                <div className="w-full h-1.5 bg-white/40 rounded-full overflow-hidden shadow-inner">
                                    <div 
                                        className={`h-full transition-all duration-1000 ${item.status === 'low' ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                                        style={{ width: `${item.percentage}%` }}
                                    />
                                </div>
                            </div>
                        )) : (
                            <div className="py-10 text-center opacity-30">
                                <Package size={32} className="mx-auto mb-2" />
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">{tLocal.noMaterials}</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white/30 backdrop-blur-3xl p-5 md:p-7 rounded-3xl border border-white/50 shadow-2xl">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h4 className="text-xl font-black text-slate-900 tracking-tight">{tLocal.finishedGoods}</h4>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{tLocal.liveStockFinished}</p>
                        </div>
                        <div className="p-3 bg-blue-500/10 text-blue-600 rounded-xl">
                            <Box size={22} />
                        </div>
                    </div>
                    <div className="space-y-6">
                        {(data?.finishedGoods?.length > 0) ? data.finishedGoods.map((item: any) => (
                            <div key={item.name} className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-black text-slate-700">{item.name}</span>
                                    <span className="text-[10px] font-black text-slate-900">{item.quantity.toLocaleString()} {item.unit}</span>
                                </div>
                                <div className="w-full h-1.5 bg-white/40 rounded-full overflow-hidden shadow-inner">
                                    <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${item.percentage}%` }} />
                                </div>
                            </div>
                        )) : (
                            <div className="py-10 text-center opacity-30">
                                <Box size={32} className="mx-auto mb-2" />
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">{tLocal.noProducts}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Recent Activity Table (Glassy) */}
            <div className="bg-white/30 backdrop-blur-3xl p-5 md:p-7 rounded-3xl border border-white/50 shadow-2xl overflow-hidden">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h4 className="text-xl font-black text-slate-900 tracking-tight">{tLocal.recentRuns}</h4>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{tLocal.liveActivity}</p>
                    </div>
                    <Link href="/manufacturing/production-orders" className="flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-md rounded-xl text-[10px] font-black text-blue-600 uppercase tracking-widest hover:bg-white transition-all shadow-sm border border-white/40">
                        {tLocal.viewHub} <ArrowRight size={14} />
                    </Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-white/10">
                                <th className="pb-5">{tLocal.batchId}</th>
                                <th className="pb-5">{tLocal.product}</th>
                                <th className="pb-5 text-center">{tLocal.qty}</th>
                                <th className="pb-5 text-center">{tLocal.status}</th>
                                <th className="pb-5 text-right">{tLocal.time}</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {(data?.recentOrders && data.recentOrders.length > 0) ? data.recentOrders.map((order: any) => (
                                <tr key={order.id} className="group hover:bg-white/40 transition-all">
                                    <td className="py-5 font-black text-blue-600 font-mono">#{order.orderNumber}</td>
                                    <td className="py-5 font-black text-slate-900">{order.productName}</td>
                                    <td className="py-5 text-center font-black text-slate-900">{order.quantity.toLocaleString()} pcs</td>
                                    <td className="py-5 text-center">
                                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${
                                            order.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-blue-500/10 text-blue-500'
                                        }`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="py-5 text-right text-slate-400 font-bold">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center opacity-30">
                                        <div className="flex flex-col items-center gap-4">
                                            <RotateCw size={48} />
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">{tLocal.noRecent}</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        {/* Right Column: Quick Stats & Actions */}
        <div className="space-y-8">
          <div className="bg-slate-900/90 backdrop-blur-2xl p-7 rounded-3xl border border-white/10 shadow-2xl text-white relative overflow-hidden">
            <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-blue-500/20 rounded-full blur-3xl" />
            <h4 className="text-xl font-black mb-6 tracking-tight relative z-10">{tLocal.opsCenter}</h4>
            <div className="grid grid-cols-2 gap-4 relative z-10">
              <Link href="/manufacturing/sales/add" className="p-5 rounded-2xl bg-white/5 hover:bg-white/10 transition-all flex flex-col items-center gap-3 border border-white/5 group">
                <div className="p-3 bg-emerald-500/20 text-emerald-500 rounded-xl group-hover:scale-110 transition-transform"><ShoppingCart size={24} /></div>
                <span className="text-[10px] font-black uppercase tracking-widest">{tLocal.newSale}</span>
              </Link>
              <Link href="/manufacturing/material-purchases/add" className="p-5 rounded-2xl bg-white/5 hover:bg-white/10 transition-all flex flex-col items-center gap-3 border border-white/5 group">
                <div className="p-3 bg-blue-500/20 text-blue-500 rounded-xl group-hover:scale-110 transition-transform"><Truck size={24} /></div>
                <span className="text-[10px] font-black uppercase tracking-widest">{tLocal.purchase}</span>
              </Link>
            </div>
          </div>

          <div className="bg-white/30 backdrop-blur-3xl p-5 md:p-7 rounded-3xl border border-white/50 shadow-2xl">
            <h4 className="text-xl font-black text-slate-900 mb-8 tracking-tight">{tLocal.financeOverview}</h4>
            <div className="space-y-8">
                <div className="flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-500/10 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Wallet size={24} />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">{tLocal.totalRevenue}</p>
                            <p className="text-lg font-black text-slate-900">
                                {(data?.totalSales || 0).toLocaleString()} <span className="text-[9px] text-slate-400">ETB</span>
                            </p>
                        </div>
                    </div>
                </div>
              
                <div className="flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-500/10 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <TrendingDown size={24} />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">{tLocal.outstandingDebt}</p>
                            <p className="text-lg font-black text-slate-900">
                                {(data?.receivablesDebt || 0).toLocaleString()} <span className="text-[9px] text-slate-400">ETB</span>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-rose-500/10 text-rose-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <AlertTriangle size={24} />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">{tLocal.payablesDebt}</p>
                            <p className="text-lg font-black text-slate-900">
                                {(data?.payablesDebt || 0).toLocaleString()} <span className="text-[9px] text-slate-400">ETB</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            
            <Link href="/manufacturing/reports" className="mt-10 flex items-center justify-center gap-2 w-full py-4 bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-900 hover:bg-white transition-all shadow-sm">
                {tLocal.openFinance} <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="bg-white/30 backdrop-blur-3xl p-5 md:p-7 rounded-3xl border border-white/50 shadow-2xl">
            <h4 className="text-xl font-black text-slate-900 mb-6 tracking-tight">{tLocal.accountsOverview}</h4>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-6">{tLocal.bankAndCash}</p>
            <div className="space-y-6">
                {(data?.accounts?.length > 0) ? data.accounts.map((acc: any) => (
                    <div key={acc.name} className="flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-blue-500/10 text-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                <DollarSign size={20} />
                            </div>
                            <div>
                                <p className="text-sm font-black text-slate-900">{acc.name}</p>
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{acc.type}</p>
                            </div>
                        </div>
                        <p className="text-sm font-black text-slate-900">
                            {acc.balance.toLocaleString()} <span className="text-[9px] text-slate-400">ETB</span>
                        </p>
                    </div>
                )) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
