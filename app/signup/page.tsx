'use client';

import Link from 'next/link';
import Image from 'next/image';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, Building, Eye, EyeOff, UserPlus, Briefcase, Factory, Store, Loader2, Check, Smartphone } from 'lucide-react';
import { signIn } from 'next-auth/react';
import Auth3DBackground from '@/components/Auth3DBackground';
import { useNotifications } from '@/contexts/NotificationContext';



const InputField = ({ id, label, icon: Icon, type = 'text', placeholder, value, onChange, isPassword, showPw, togglePw }: any) => (
  <div className="group">
    <label htmlFor={id} className="block text-[13px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5 ml-1 transition-colors group-focus-within:text-primary">
      {label}
    </label>
    <div className="relative">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center rounded-xl bg-gray-50 dark:bg-gray-800/50 text-gray-400 group-focus-within:text-primary group-focus-within:bg-primary/5 transition-all duration-300">
        <Icon size={18} />
      </div>
      <input
        id={id}
        type={type}
        required
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full pl-16 pr-4 py-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl text-gray-900 dark:text-white text-[15px] placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary shadow-sm hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-300"
      />
      {isPassword && (
        <button
          type="button"
          onClick={togglePw}
          tabIndex={-1}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors p-2"
        >
          {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      )}
    </div>
  </div>
);

export default function SignUpPage() {
  const { addNotification } = useNotifications();
  useEffect(() => {
    // Custom style for autofill
    const style = document.createElement('style');
    style.innerHTML = `
      input:-webkit-autofill,
      input:-webkit-autofill:hover,
      input:-webkit-autofill:focus,
      input:-webkit-autofill:active {
        -webkit-box-shadow: 0 0 0 1000px white inset !important;
        -webkit-text-fill-color: #111827 !important;
        transition: background-color 5000s ease-in-out 0s;
      }
      .dark input:-webkit-autofill,
      .dark input:-webkit-autofill:hover,
      .dark input:-webkit-autofill:focus,
      .dark input:-webkit-autofill:active {
        -webkit-box-shadow: 0 0 0 1000px #111827 inset !important;
        -webkit-text-fill-color: white !important;
      }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);
  const [companyName, setCompanyName] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => { setMounted(true); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) { addNotification({ type: 'error', message: 'Password-yadu isma mid aha.' }); return; }
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    if (password.length < 8 || !hasUpper || !hasNumber) { 
      addNotification({ type: 'error', message: 'Fadlan hubi in password-ku waafaqsan yahay dhammaan shuruudaha.' }); 
      return; 
    }
    setLoading(true);
    try {
      const response = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ companyName, fullName, email, phone, password, planType: 'FACTORIES_ONLY' }) });
      const data = await response.json();
      if (response.ok) {
        addNotification({ type: 'success', message: 'Akoonkaaga si guul leh ayaa loo sameeyay!' });
        await signIn('credentials', { redirect: false, email, password });
        setTimeout(() => router.push('/manufacturing'), 1000);

      } else { addNotification({ type: 'error', message: data.message || 'Diiwaan gelintu waa ay guuldareysatay.' }); }
    } catch { addNotification({ type: 'error', message: 'Cilad ayaa dhacday.' }); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center font-sans bg-gray-50 dark:bg-gray-950 relative p-4">
      <div className={`w-full max-w-xl bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl shadow-emerald-500/10 border border-gray-100 dark:border-gray-800 p-8 sm:p-12 relative z-10 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="w-full mx-auto">

          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Link href="/" className="inline-flex justify-center items-center group">
              <div className="relative w-32 h-32 rounded-2xl overflow-hidden shadow-xl shadow-emerald-500/20 transition-transform duration-300 group-hover:scale-105 border border-gray-100 dark:border-gray-800 bg-white">
                <Image 
                  src="/an-logo-combined.png" 
                  alt="AN Industory Logo" 
                  fill 
                  className="object-contain p-2"
                />
              </div>
            </Link>
          </div>

          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-3xl lg:text-4xl font-black text-gray-900 dark:text-white tracking-tight">Diiwaangeli Warshadaada</h1>
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">U samee akoon casri ah AN-Industory si aad u maamusho wax-soo-saarkaaga</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit} autoComplete="off">
            {/* Company + Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <InputField id="companyName" label="Shirkadda" icon={Building} placeholder="Magaca Shirkadda" value={companyName} onChange={(e: any) => setCompanyName(e.target.value)} />
              <InputField id="fullName" label="Magacaaga" icon={User} placeholder="Magacaaga Buuxa" value={fullName} onChange={(e: any) => setFullName(e.target.value)} />
            </div>

            {/* Email + Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <InputField id="email" type="email" label="Email-ka" icon={Mail} placeholder="name@company.com" value={email} onChange={(e: any) => setEmail(e.target.value)} />
              <InputField id="phone" type="tel" label="Lambarka Tel" icon={Smartphone} placeholder="061xxxxxxx" value={phone} onChange={(e: any) => setPhone(e.target.value)} />
            </div>

            {/* Passwords */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <InputField id="password" type={showPassword ? 'text' : 'password'} label="Password-ka" icon={Lock} placeholder="••••••••" value={password} onChange={(e: any) => setPassword(e.target.value)} isPassword showPw={showPassword} togglePw={() => setShowPassword(!showPassword)} />
              <InputField id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} label="Xaqiiji" icon={Lock} placeholder="••••••••" value={confirmPassword} onChange={(e: any) => setConfirmPassword(e.target.value)} isPassword showPw={showConfirmPassword} togglePw={() => setShowConfirmPassword(!showConfirmPassword)} />
            </div>

            {/* Password hints */}
            {password.length > 0 && (
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-[11px] font-medium">
                <span className={password.length >= 8 ? 'text-emerald-500' : 'text-gray-400'}>
                  {password.length >= 8 ? '✓' : '○'} 8+ xaraf
                </span>
                <span className={/[A-Z]/.test(password) ? 'text-emerald-500' : 'text-gray-400'}>
                  {/[A-Z]/.test(password) ? '✓' : '○'} Xaraf weyn
                </span>
                <span className={/[0-9]/.test(password) ? 'text-emerald-500' : 'text-gray-400'}>
                  {/[0-9]/.test(password) ? '✓' : '○'} Lambar
                </span>
                {confirmPassword.length > 0 && (
                  <span className={password === confirmPassword ? 'text-emerald-500' : 'text-red-400'}>
                    {password === confirmPassword ? '✓' : '✗'} Isku mid
                  </span>
                )}
              </div>
            )}



            {/* Submit */}
            <button type="submit" disabled={loading}
              className="w-full py-4 rounded-2xl text-base font-bold text-white transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2.5 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 mt-4"
              style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 50%, #047857 100%)' }}>
              {loading ? <Loader2 className="animate-spin h-5 w-5" /> : <><UserPlus className="h-5 w-5" /><span>Sameyso Akoon</span></>}
            </button>
          </form>

          {/* Footer */}
          <p className="mt-10 text-sm text-gray-400 dark:text-gray-500">
            Hore ma ku lahayd akoon?{' '}
            <Link href="/login" className="font-bold text-primary hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors">Gasho Hadda</Link>
          </p>
        </div>
      </div>


    </div>
  );
}