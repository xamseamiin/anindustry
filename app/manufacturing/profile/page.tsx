'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, User, Mail, Phone, MapPin, Key, LogOut } from 'lucide-react';
import { useUser } from '@/components/providers/UserProvider';
import { signOut } from 'next-auth/react';

export default function ProfilePage() {
    const { currentUser } = useUser();

    return (
        <div className="flex flex-col gap-6 p-4 lg:p-6 min-h-screen pb-20 bg-slate-50/50">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/manufacturing" className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-200 text-slate-500 hover:text-emerald-600 transition-all">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <User className="text-emerald-600" size={32} />
                            My Profile
                        </h1>
                        <p className="text-sm text-slate-500 font-medium">Manage your personal information and security.</p>
                    </div>
                </div>
            </div>

            {/* Profile Content */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                {/* Left Card - Avatar & Basic Info */}
                <div className="bg-white/60 backdrop-blur-xl p-8 rounded-3xl border border-white shadow-xl flex flex-col items-center text-center">
                    <div className="w-32 h-32 rounded-[2rem] bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-black text-5xl shadow-xl shadow-emerald-500/20 mb-6 relative group overflow-hidden">
                        {currentUser?.name?.slice(0, 1) || 'U'}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                            <span className="text-xs uppercase tracking-widest">Edit</span>
                        </div>
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 leading-none mb-2">{currentUser?.name || 'User Name'}</h2>
                    <p className="text-sm font-bold text-slate-400 mb-6 uppercase tracking-widest">{currentUser?.role || 'Administrator'}</p>
                    
                    <div className="w-full space-y-4 pt-6 border-t border-slate-100 text-left">
                        <div className="flex items-center gap-3 text-slate-600 text-sm">
                            <Mail size={16} className="text-emerald-500" />
                            <span className="font-medium">{currentUser?.email || 'email@example.com'}</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-600 text-sm">
                            <Phone size={16} className="text-emerald-500" />
                            <span className="font-medium">Not Provided</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-600 text-sm">
                            <MapPin size={16} className="text-emerald-500" />
                            <span className="font-medium">Not Provided</span>
                        </div>
                    </div>

                    <button 
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        className="mt-8 w-full py-3 rounded-xl bg-rose-50 text-rose-600 font-bold hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center gap-2"
                    >
                        <LogOut size={18} /> Sign Out
                    </button>
                </div>

                {/* Right Card - Edit Form */}
                <div className="md:col-span-2 bg-white/60 backdrop-blur-xl p-8 rounded-3xl border border-white shadow-xl">
                    <h3 className="text-xl font-black text-slate-900 mb-6 border-b border-slate-100 pb-4 flex items-center gap-2">
                        Personal Details
                    </h3>
                    
                    <form className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-[11px] font-black uppercase text-slate-400 mb-2 tracking-widest">Full Name</label>
                                <input 
                                    type="text" 
                                    className="w-full p-4 rounded-2xl bg-white border border-slate-200 text-slate-700 font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                                    defaultValue={currentUser?.name || ''}
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-black uppercase text-slate-400 mb-2 tracking-widest">Email Address</label>
                                <input 
                                    type="email" 
                                    className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-500 font-bold outline-none cursor-not-allowed"
                                    defaultValue={currentUser?.email || ''}
                                    disabled
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[11px] font-black uppercase text-slate-400 mb-2 tracking-widest">Phone Number</label>
                            <input 
                                type="tel" 
                                className="w-full p-4 rounded-2xl bg-white border border-slate-200 text-slate-700 font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                                placeholder="+251 ..."
                            />
                        </div>

                        <div className="pt-6 border-t border-slate-100 mt-6">
                            <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                                <Key size={20} className="text-slate-400" /> Security
                            </h3>
                            <button type="button" className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all">
                                Change Password
                            </button>
                        </div>

                        <div className="pt-8 flex justify-end">
                            <button type="submit" className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all">
                                Update Profile
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
