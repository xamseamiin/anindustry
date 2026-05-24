'use client';

import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { signIn } from 'next-auth/react';
import Auth3DBackground from '@/components/Auth3DBackground';
import { useNotifications } from '@/contexts/NotificationContext';

export default function LoginPage() {
  const { addNotification } = useNotifications();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    const savedEmail = localStorage.getItem('an_industory_remembered_email');
    if (savedEmail) { setEmail(savedEmail); setRememberMe(true); }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      addNotification({ type: 'error', message: 'Fadlan gali email-kaaga iyo password-kaaga.' });
      return;
    }
    setLoading(true);
    try {
      const result = await signIn('credentials', { redirect: false, email: email.trim(), password });
      if (result?.ok) {
        if (rememberMe) localStorage.setItem('an_industory_remembered_email', email.trim());
        else localStorage.removeItem('an_industory_remembered_email');
        const response = await fetch('/api/auth/session');
        const session = await response.json();
        addNotification({ type: 'success', message: 'Si guul leh ayaad u soo gashay!' });
        setTimeout(() => {
          const isSuperAdmin = session?.user?.id === process.env.NEXT_PUBLIC_SUPER_ADMIN_ID;
          if (isSuperAdmin) {
            router.push('/admin/super-dashboard');
          } else {
            router.push('/manufacturing');
          }

        }, 500);
      } else {
        addNotification({ type: 'error', message: 'Email ama password-ku khalad yahay.' });
        setLoading(false);
      }
    } catch { addNotification({ type: 'error', message: 'Cilad ayaa dhacday.' }); setLoading(false); }
  };

  return (
    <div className="min-h-screen flex font-sans">
      {/* Left Side */}
      <div className={`w-full lg:w-1/2 xl:w-[45%] min-h-screen flex flex-col justify-center bg-white dark:bg-gray-950 relative z-10 transition-opacity duration-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
        <div className="w-full max-w-lg mx-auto px-8 sm:px-12 lg:px-16 py-12">

          {/* Logo */}
          <Link href="/" className="inline-flex items-center gap-2.5 mb-14">
            <div className="w-10 h-10 bg-brand-gradient rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <span className="text-white text-xl font-black tracking-tighter">AN</span>
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
                AN
              </span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                Industory
              </span>
            </div>
          </Link>

          {/* Header */}
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white tracking-tight leading-tight">
            Soo Dhowow
          </h1>
          <p className="mt-3 mb-12 text-base text-gray-400 dark:text-gray-500">
            Gali xogtaada si aad u maamusho wax-soo-saarka iyo hawlaha warshadaada
          </p>

          {/* Form */}
          <form className="space-y-7" onSubmit={handleSubmit}>
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2.5">
                Email-ka
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300 dark:text-gray-600" />
                <input
                  id="email" type="email" autoComplete="email" required value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl text-gray-900 dark:text-white text-base placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-200"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2.5">
                Password-ka
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300 dark:text-gray-600" />
                <input
                  id="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl text-gray-900 dark:text-white text-base placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-200"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-600 hover:text-gray-500 transition-colors">
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4.5 h-4.5 rounded-md border-gray-300 dark:border-gray-600 text-primary focus:ring-primary/30 bg-transparent cursor-pointer" />
                <span className="text-sm text-gray-500 dark:text-gray-400 select-none">I xasuuso</span>
              </label>
              <Link href="/forgot-password" className="text-sm font-semibold text-primary hover:text-blue-700 dark:hover:text-blue-400 transition-colors">
                Ma ilowday?
              </Link>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading}
              className="w-full py-4 rounded-2xl text-base font-bold text-white transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2.5 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30"
              style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 50%, #047857 100%)' }}>
              {loading ? <Loader2 className="animate-spin h-5 w-5" /> : <><span>Gal Akoonka</span><ArrowRight className="h-5 w-5" /></>}
            </button>
          </form>

          {/* Signup link */}
          <p className="mt-12 text-sm text-gray-400 dark:text-gray-500">
            Wali ma lihid akoon?{' '}
            <Link href="/signup" className="font-bold text-primary hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              Is Diwaangali Hadda
            </Link>
          </p>
        </div>
      </div>

      {/* Right Side */}
      <div className="hidden lg:block lg:w-1/2 xl:w-[55%] relative bg-gray-900 overflow-hidden">
        <Auth3DBackground />
      </div>
    </div>
  );
}