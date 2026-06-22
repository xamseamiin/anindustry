'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, User, Mail, Phone, MapPin, Key, LogOut, Loader2, Save, CheckCircle2, ShieldCheck, Landmark } from 'lucide-react';
import { useUser } from '@/components/providers/UserProvider';
import { signOut, useSession } from 'next-auth/react';
import Toast from '@/components/common/Toast';

export default function ProfilePage() {
    const { user, setUser } = useUser();
    const { update: updateSession } = useSession();

    // Loading states
    const [loadingDetails, setLoadingDetails] = useState(true);
    const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
    const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

    // Profile fields state
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');

    // Password fields state
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Toast feedback state
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Fetch user details from database on mount
    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const res = await fetch('/api/auth/update-profile');
                if (res.ok) {
                    const data = await res.json();
                    if (data.user) {
                        setFullName(data.user.fullName || '');
                        setEmail(data.user.email || '');
                        setPhone(data.user.phone || '');
                    }
                }
            } catch (err) {
                console.error('Failed to fetch user details:', err);
                setToast({ message: 'Failed to load profile details.', type: 'error' });
            } finally {
                setLoadingDetails(false);
            }
        };
        fetchDetails();
    }, []);

    // Update Profile handler
    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fullName.trim() || !email.trim()) {
            setToast({ message: 'Fadlan geli magacaaga iyo email-kaaga.', type: 'error' });
            return;
        }

        setIsSubmittingProfile(true);
        try {
            const res = await fetch('/api/auth/update-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fullName, email, phone })
            });

            const data = await res.json();

            if (res.ok) {
                setToast({ message: 'Profile-kaaga waa la cusboonaysiiyay!', type: 'success' });
                
                // Update Next-Auth Session
                if (updateSession) {
                    await updateSession({ name: fullName, email: email });
                }

                // Update Local Context
                if (user) {
                    setUser({
                        ...user,
                        fullName,
                        email
                    });
                }
            } else {
                setToast({ message: data.error || 'Khalad ayaa dhacay inta la cusboonaysiinayay.', type: 'error' });
            }
        } catch (err) {
            console.error(err);
            setToast({ message: 'Xiriirka internet-ka ayaa go\'ay. Dib isku day.', type: 'error' });
        } finally {
            setIsSubmittingProfile(false);
        }
    };

    // Update Password handler
    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentPassword || !newPassword || !confirmPassword) {
            setToast({ message: 'Fadlan ku qor dhamaan meelaha banaan.', type: 'error' });
            return;
        }

        if (newPassword !== confirmPassword) {
            setToast({ message: 'Password-ka cusub iyo kan xaqiijinta isma laha.', type: 'error' });
            return;
        }

        if (newPassword.length < 6) {
            setToast({ message: 'Password-ka cusub waa inuu ugu yaraan yahay 6 xaraf.', type: 'error' });
            return;
        }

        setIsSubmittingPassword(true);
        try {
            const res = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword })
            });

            const data = await res.json();

            if (res.ok) {
                setToast({ message: 'Password-ka si guul leh ayaa loo beddelay!', type: 'success' });
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setShowPasswordForm(false);
            } else {
                setToast({ message: data.error || 'Khalad ayaa dhacay.', type: 'error' });
            }
        } catch (err) {
            console.error(err);
            setToast({ message: 'Xiriirka internet-ka ayaa go\'ay.', type: 'error' });
        } finally {
            setIsSubmittingPassword(false);
        }
    };

    return (
        <div className="flex flex-col gap-6 p-4 lg:p-6 min-h-screen pb-20 bg-slate-50/50 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/manufacturing" className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-200 text-slate-500 hover:text-emerald-600 transition-all">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <User className="text-emerald-600 animate-pulse" size={32} />
                            My Profile
                        </h1>
                        <p className="text-sm text-slate-500 font-medium">Manage your personal information and security details.</p>
                    </div>
                </div>
            </div>

            {loadingDetails ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4 card bg-white shadow-xl min-h-[300px]">
                    <Loader2 className="animate-spin text-emerald-500" size={40} />
                    <p className="text-sm text-slate-500 font-bold">Soo raraya macluumaadka...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                    {/* Left Card - Avatar & Basic Info */}
                    <div className="bg-white/60 backdrop-blur-xl p-8 rounded-3xl border border-white shadow-xl flex flex-col items-center text-center h-fit">
                        <div className="w-32 h-32 rounded-[2rem] bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-black text-5xl shadow-xl shadow-emerald-500/20 mb-6 relative group overflow-hidden">
                            {fullName?.slice(0, 1).toUpperCase() || 'U'}
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                <span className="text-[10px] uppercase font-black text-white tracking-widest">Live Profile</span>
                            </div>
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 leading-none mb-2">{fullName || 'User Name'}</h2>
                        <p className="text-xs font-black text-slate-400 mb-6 uppercase tracking-widest">{user?.role || 'Administrator'}</p>
                        
                        <div className="w-full space-y-4 pt-6 border-t border-slate-100 text-left">
                            <div className="flex items-center gap-3 text-slate-600 text-sm">
                                <Mail size={16} className="text-emerald-500" />
                                <span className="font-bold truncate">{email || 'email@example.com'}</span>
                            </div>
                            <div className="flex items-center gap-3 text-slate-600 text-sm">
                                <Phone size={16} className="text-emerald-500" />
                                <span className="font-bold">{phone || 'Ma jiro Telefoon'}</span>
                            </div>
                            <div className="flex items-center gap-3 text-slate-600 text-sm">
                                <Landmark size={16} className="text-emerald-500" />
                                <span className="font-bold text-xs truncate">Shirkadda: {user?.companyName || 'Not Provided'}</span>
                            </div>
                        </div>

                        <button 
                            onClick={() => signOut({ callbackUrl: '/login' })}
                            className="mt-8 w-full py-3 rounded-xl bg-rose-50 text-rose-600 font-black text-xs uppercase tracking-wider hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center gap-2 active:scale-95 shadow-md shadow-rose-100"
                        >
                            <LogOut size={16} /> Sign Out
                        </button>
                    </div>

                    {/* Right Card - Edit Form */}
                    <div className="md:col-span-2 space-y-6">
                        {/* Profile edit form */}
                        <div className="bg-white/60 backdrop-blur-xl p-8 rounded-3xl border border-white shadow-xl">
                            <h3 className="text-xl font-black text-slate-900 mb-6 border-b border-slate-100 pb-4 flex items-center gap-2">
                                <CheckCircle2 className="text-emerald-500" size={20} /> Personal Details
                            </h3>
                            
                            <form onSubmit={handleUpdateProfile} className="space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Full Name</label>
                                        <input 
                                            type="text" 
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            className="w-full p-4 rounded-2xl bg-white border border-slate-200 text-slate-700 font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-xs"
                                            placeholder="Your full name"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Email Address</label>
                                        <input 
                                            type="email" 
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full p-4 rounded-2xl bg-white border border-slate-200 text-slate-700 font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-xs"
                                            placeholder="yourname@company.com"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Phone Number</label>
                                    <input 
                                        type="tel" 
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="w-full p-4 rounded-2xl bg-white border border-slate-200 text-slate-700 font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-xs"
                                        placeholder="e.g. +251 900 000 000"
                                    />
                                </div>

                                <div className="pt-4 flex justify-end">
                                    <button 
                                        type="submit" 
                                        disabled={isSubmittingProfile}
                                        className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 disabled:opacity-50 active:scale-95"
                                    >
                                        {isSubmittingProfile ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                                        Update Profile
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Security Section */}
                        <div className="bg-white/60 backdrop-blur-xl p-8 rounded-3xl border border-white shadow-xl">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                                    <Key className="text-slate-400" size={20} /> Security & Account
                                </h3>
                                <button 
                                    onClick={() => setShowPasswordForm(!showPasswordForm)}
                                    className="text-xs font-black uppercase tracking-wider text-emerald-600 hover:text-emerald-700 transition-colors"
                                >
                                    {showPasswordForm ? 'Hide Forms' : 'Change Password'}
                                </button>
                            </div>

                            {!showPasswordForm ? (
                                <div className="flex items-center gap-3 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 text-emerald-800 text-xs font-bold">
                                    <ShieldCheck size={18} className="text-emerald-500 shrink-0" />
                                    <span>Akoonkaagu wuu ammaan yahay. Waxaad beddeli kartaa password-kaaga wakhti kasta.</span>
                                </div>
                            ) : (
                                <form onSubmit={handleUpdatePassword} className="space-y-4 animate-scale-in">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Current Password</label>
                                        <input 
                                            type="password" 
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            className="w-full p-4 rounded-2xl bg-white border border-slate-200 text-slate-700 font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-xs"
                                            placeholder="Enter current password"
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">New Password</label>
                                            <input 
                                                type="password" 
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                className="w-full p-4 rounded-2xl bg-white border border-slate-200 text-slate-700 font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-xs"
                                                placeholder="At least 6 characters"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Confirm New Password</label>
                                            <input 
                                                type="password" 
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="w-full p-4 rounded-2xl bg-white border border-slate-200 text-slate-700 font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-xs"
                                                placeholder="Repeat new password"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-4 flex justify-end gap-3">
                                        <button 
                                            type="button" 
                                            onClick={() => {
                                                setShowPasswordForm(false);
                                                setCurrentPassword('');
                                                setNewPassword('');
                                                setConfirmPassword('');
                                            }}
                                            className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs uppercase tracking-wider transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            type="submit" 
                                            disabled={isSubmittingPassword}
                                            className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 disabled:opacity-50 active:scale-95"
                                        >
                                            {isSubmittingPassword ? <Loader2 className="animate-spin" size={14} /> : <Key size={14} />}
                                            Save Password
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}
