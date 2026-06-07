'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Briefcase, DollarSign, Warehouse, Users, Truck, LineChart, Zap, LayoutDashboard, Coins, ChevronRight, ShieldCheck,
  Award, RefreshCw, Smartphone, Cloud, Bell, Mail, MapPin, Phone, MessageSquare, Plus, CheckCircle,
  Menu, X, Factory, Landmark, MessageCircle, Package, BarChart3, Download, Play, PlayCircle, Star, ArrowRight, Check,
  CreditCard, Globe, Lock, TrendingUp, HelpCircle, ChevronDown, Clock, Building
} from 'lucide-react';
import PWAInstallButton from '@/components/PWAInstallButton';
import LiveReviews from '@/components/LiveReviews';
import { ScrollReveal } from '@/components/ScrollReveal';
import ScrollProgressBar from '@/components/ScrollProgressBar';
import ParallaxBackground from '@/components/ParallaxBackground';
import { useNotifications } from '@/contexts/NotificationContext';
import dynamic from 'next/dynamic';
import { Sticky3DSection } from '@/components/Sticky3DSection';
import BusinessSolutionSelector from '@/components/BusinessSolutionSelector';

const Hero3DCube = dynamic(() => import('@/components/Hero3DCube'), { ssr: false });

// --- Components ---

/** 
 * Navbar Component 
 * Solid, authoritative, and branded.
 */
const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Astaamaha', href: '#features' },
    { name: 'Xalka', href: '#solutions' },
    { name: 'Qiimaha', href: '#pricing' },
    { name: 'FAQ', href: '#faq' },
  ];

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm py-3 dark:bg-gray-900/95' : 'bg-transparent py-4 md:py-6 dark:bg-gray-900'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo Section */}
          <Link href="/" className="flex items-center gap-2 group z-50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-brand-gradient rounded-lg flex items-center justify-center shadow-md shadow-emerald-500/20">
                <span className="text-white text-base font-black tracking-tighter">AN</span>
              </div>
              <div className="flex flex-col leading-none">
                <span className={`text-lg font-black tracking-tight ${scrolled ? 'text-slate-900 dark:text-white' : 'text-slate-900 dark:text-white'}`}>
                  AN
                </span>
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-primary">
                  Industory
                </span>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`text-sm font-bold hover:text-primary transition-colors hover:scale-105 transform duration-200 ${scrolled ? 'text-mediumGray dark:text-gray-300' : 'text-darkGray dark:text-gray-300'}`}
              >
                {link.name}
              </Link>
            ))}
            <Link href="/download" className="text-sm font-bold hover:text-primary transition-colors text-mediumGray dark:text-gray-300">
              Ku Shubo
            </Link>
          </div>

          {/* CTA Buttons - Desktop */}
          <div className="hidden md:flex items-center gap-4">
            <Link href="/login" className="text-sm font-bold hover:text-primary transition-colors text-darkGray dark:text-gray-200">
              Gal (Login)
            </Link>
            <Link href="/signup" className="relative overflow-hidden bg-primary text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-lg hover:shadow-primary/40 hover:-translate-y-0.5 transition-all group">
              <span className="relative z-10 flex items-center gap-2 text-nowrap">Bilaaw Hadda <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" /></span>
              <div className="absolute inset-0 bg-secondary opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center z-50">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-darkGray dark:text-white p-2.5 -mr-2 rounded-xl focus:bg-gray-100 dark:focus:bg-gray-800 transition-all active:scale-95"
              aria-label="Menu"
            >
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div className={`fixed inset-0 bg-white dark:bg-gray-900 z-40 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'} md:hidden flex flex-col pt-24 px-6`}>
        <div className="space-y-6">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="block text-2xl font-bold text-darkGray dark:text-white hover:text-primary border-b border-gray-100 dark:border-gray-800 pb-4"
              onClick={() => setIsOpen(false)}
            >
              {link.name}
            </Link>
          ))}
          <Link href="/download" className="block text-2xl font-bold text-darkGray dark:text-white hover:text-primary pb-4">Ku Shubo</Link>

          <div className="pt-8 flex flex-col gap-4">
            <Link href="/login" className="w-full text-center text-lg font-bold py-4 bg-gray-100 dark:bg-gray-800 text-darkGray dark:text-white rounded-2xl active:scale-95 transition-transform" onClick={() => setIsOpen(false)}>
              Gal (Login)
            </Link>
            <Link href="/signup" className="w-full text-center text-lg bg-primary text-white py-4 rounded-2xl font-bold shadow-xl active:scale-95 transition-transform" onClick={() => setIsOpen(false)}>
              Bilaaw Hadda
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

const Hero = () => {
  return (
    <Sticky3DSection index={1} className="bg-white dark:bg-gray-900/50">
      <div className="relative w-full h-full flex flex-col justify-center pt-20 pb-6 lg:pt-32 lg:pb-20">

        {/* Background Gradients */}
        <div className="absolute top-0 right-0 w-[300px] lg:w-[500px] h-[300px] lg:h-[500px] bg-primary/5 rounded-full blur-[80px] lg:blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[300px] lg:w-[500px] h-[300px] lg:h-[500px] bg-secondary/5 rounded-full blur-[80px] lg:blur-[100px] translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full h-full flex flex-col justify-center">

          <div className="flex flex-col lg:grid lg:grid-cols-2 gap-4 lg:gap-8 items-center h-full sm:h-auto justify-center">

            {/* Left Column: Content */}
            <div className="flex flex-col items-center lg:items-start text-center lg:text-left animate-fade-in-up w-full relative z-10">

              {/* Ambient Glow */}
              <div className="absolute -left-20 -top-20 w-72 h-72 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none -z-10"></div>

              {/* Badge - Slogan (ERP Style) */}
              <div className="inline-flex items-center gap-3 p-1.5 pr-5 rounded-full bg-white dark:bg-white/5 border border-primary/20 dark:border-primary/20 shadow-[0_2px_15px_-3px_rgba(var(--primary-rgb),0.1)] hover:border-primary hover:shadow-primary/20 transition-all duration-300 group cursor-default mb-6 transform scale-95 sm:scale-100">
                {/* Blinking Dot (Red for Live/Action) */}
                <div className="relative flex h-3 w-3 ml-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>

                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </div>

                {/* Text Content - Always Colored */}
                <div className="flex items-center gap-2 text-xs sm:text-sm">
                  <span className="font-black text-primary tracking-tight uppercase">MRP</span>
                  <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                  <span className="font-bold text-secondary group-hover:text-primary transition-colors">
                    Manufacturing Resource Planning
                  </span>
                </div>
              </div>

              {/* Headline */}
              <h1 className="flex flex-col items-center lg:items-start mb-4 lg:mb-6 w-full">
                <span className="text-[10px] sm:text-xs md:text-sm font-bold text-secondary uppercase tracking-[0.2em] mb-2">
                  Maamulka Warshada Oo Hufan
                </span>
                <span className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-black text-darkGray dark:text-white leading-[1.1] tracking-tight">
                  Wax-soo-saar <span className="text-primary relative inline-block">
                    Dhab Ah
                    {/* Underline decoration */}
                    <svg className="absolute w-full h-2 lg:h-3 -bottom-1 left-0 text-secondary/30 -z-10" viewBox="0 0 100 10" preserveAspectRatio="none">
                      <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" />
                    </svg>
                  </span> <br className="hidden lg:block" />
                  Oo La Hubo.
                </span>
              </h1>

              {/* Subtext - Modernized Design */}
              <div className="max-w-xl mx-auto lg:mx-0 mb-8 lg:mb-10 lg:pl-6 lg:border-l-4 border-emerald-500/20">
                <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 leading-relaxed md:leading-loose font-medium">
                  AN-Industory waa <span className="text-darkGray dark:text-white font-extrabold text-lg sm:text-xl md:text-2xl">maskaxda</span> warshadaada. Waxaan kuu fududaynay maamulka alaabta ceeriin, khadka wax-soo-saarka (production line), costing-ka dhabta ah, iyo xisaabaadka oo dhan.
                </p>
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto mb-6 items-center sm:items-stretch">
                <Link href="/signup" className="group relative flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white px-8 py-3 rounded-full font-bold text-sm sm:text-base shadow-xl shadow-emerald-500/30 transition-all hover:scale-[1.02] active:scale-95 w-full sm:w-auto overflow-hidden">
                  <span className="relative z-10 flex items-center gap-2">Ku Bilaaw Bilaash <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" /></span>
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                </Link>

                <PWAInstallButton />

                <Link href="/demo" className="group flex items-center justify-center gap-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 px-8 py-3 rounded-full font-bold text-sm sm:text-base hover:border-emerald-400 dark:hover:border-emerald-800 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50/30 dark:hover:bg-emerald-900/20 transition-all active:scale-95 w-full sm:w-auto shadow-sm">
                  <PlayCircle size={18} className="text-gray-400 group-hover:text-emerald-500 transition-colors" /> Daawo Demo
                </Link>
              </div>

              {/* Trust Indicator */}
              <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50 p-1.5 pr-3 rounded-full border border-gray-100 dark:border-gray-700/50 animate-fade-in animation-delay-300 transform scale-90 sm:scale-100">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className={`w-6 h-6 rounded-full border-2 border-white dark:border-gray-800 bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden`}>
                      <Users size={10} className="text-gray-400" />
                    </div>
                  ))}
                </div>
                <p className="text-xs font-medium text-mediumGray dark:text-gray-400">
                  <span className="font-bold text-darkGray dark:text-white">Kusoo biir AN-Industory</span> oo maanta isticmaal
                </p>
              </div>
            </div>

            {/* Right Column: 3D Cube */}
            <div className="relative h-[220px] sm:h-[300px] lg:h-[500px] w-full flex items-center justify-center lg:justify-end animate-fade-in-up mt-4 lg:mt-0" style={{ animationDelay: '200ms' }}>
              <Hero3DCube />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-radial from-blue-50/50 to-transparent dark:from-blue-900/10 -z-10 blur-3xl pointer-events-none"></div>
            </div>

          </div>

        </div>
      </div>
    </Sticky3DSection>
  );
};

// --- Statistics Section (Animated & Modern) ---
// --- Statistics Section (Compact & Animated) ---
const AnimatedCounter = ({ to, decimals = 0, suffix = '', prefix = '' }: { to: number, decimals?: number, suffix?: string, prefix?: string }) => {
  const [count, setCount] = React.useState(0);
  const nodeRef = React.useRef<HTMLSpanElement>(null);
  const [hasAnimated, setHasAnimated] = React.useState(false);

  React.useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !hasAnimated) {
        setHasAnimated(true);
        let start = 0;
        const end = to;
        const duration = 2000;
        const startTime = performance.now();

        const animate = (currentTime: number) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
          setCount(start + (end - start) * ease);
          if (progress < 1) requestAnimationFrame(animate);
          else setCount(end);
        };
        requestAnimationFrame(animate);
      }
    }, { threshold: 0.1 });
    if (nodeRef.current) observer.observe(nodeRef.current);
    return () => observer.disconnect();
  }, [to, hasAnimated]);

  return <span ref={nodeRef}>{prefix}{count.toFixed(decimals)}{suffix}</span>;
}

const DashboardPreview = () => {
  const slides = [
    {
      id: 1,
      tag: "Live Production Line",
      colorClass: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30",
      dotClass: "bg-emerald-500",
      title: <>Qorshaha Wax-soo-saarka <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-600">Iyo BOM.</span></>,
      desc: "Ku maamul amarrada wax-soo-saarka (Production Orders) iyo khadka shaqada si toos ah. Hubi yield-ka oo yaree khasaaraha adigoo isticmaalaya Bill of Materials (BOM) sugan.",
      features: ['Production Orders (Live)', 'Bill of Materials (BOM)', 'Standard vs Actual Costing'],
      image: "/factory-preview.png",
    },
    {
      id: 2,
      tag: "Raw Stock & Procurement",
      colorClass: "text-blue-600 bg-blue-100 dark:bg-blue-900/30",
      dotClass: "bg-blue-600",
      title: <>Alaabta Ceeriin & <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Adeegga Iibsiga.</span></>,
      desc: "La soco xaalada kaydka alaabta ceeriin sida Plastic Resin (DH) ama Bottle Caps (Fur). Si toos ah u maamul amarrada iibsiga iyo xiriirka alaab-qeybiyeyaasha (Vendors).",
      features: ['Dabagalka KG iyo Xabbadaha', 'Tirada ugu hooseysa (Low Stock)', 'Supplier Purchases Ledger'],
      image: "/inventory-dashboard.png",
    },
    {
      id: 3,
      tag: "Finished Goods Inventory",
      colorClass: "text-cyan-600 bg-cyan-100 dark:bg-cyan-900/30",
      dotClass: "bg-cyan-500",
      title: <>Badeecadaha Diyaarsan <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-cyan-600">Iyo Baakadaha.</span></>,
      desc: "Maamul badeecadaha kuu dhamaaday ee diyaarka u ah iibka sida Dairy Bottle 1L ama 500ml. Ogow baakadeynta, awooda kaydka, iyo socodka alaabta.",
      features: ['Finished Goods Variant Tracking', 'Capacity & Yield Management', 'Stock Movement Logs'],
      image: "/dashboard-preview.png",
    },
    {
      id: 4,
      tag: "Business Hub & Sales",
      colorClass: "text-purple-600 bg-purple-100 dark:bg-purple-900/30",
      dotClass: "bg-purple-600",
      title: <>Iibka & Xisaabaadka, <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">Si Fudud.</span></>,
      desc: "U samee macaamiishaada invoices leh AN- prefix rami ah. La soco mushaharka shaqaalaha (Payroll), kharashyada warshada (Expenses), iyo audit logs-ka amniga.",
      features: ['Invoices wata AN- Prefix', 'Audit Logs & User Roles', 'Payroll & Attendance Hub'],
      image: "/shop-preview.png",
    }
  ];

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000); // Slower interval for better readability
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <Sticky3DSection index={2} className="bg-white dark:bg-gray-900 overflow-hidden min-h-[800px] lg:min-h-[700px] flex items-center">
      <div className="w-full h-full flex items-center justify-center p-4 py-8 lg:py-0">

        {/* Dynamic Background Glow */}
        <div className={`absolute top-0 right-0 w-[300px] md:w-[600px] h-[300px] md:h-[600px] rounded-full blur-[120px] opacity-20 transition-colors duration-1000 
          ${currentSlide === 0 ? 'bg-primary' : currentSlide === 1 ? 'bg-secondary' : currentSlide === 2 ? 'bg-accent' : 'bg-purple-600'} 
          -translate-y-1/2 translate-x-1/2 pointer-events-none`}></div>

        <div className="max-w-7xl mx-auto w-full relative z-10">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">

            {/* Content Container - Uses CSS Grid Stack to prevent layout shifts */}
            <div className="relative grid grid-cols-1">
              {slides.map((s, index) => (
                <div
                  key={s.id}
                  className={`row-start-1 col-start-1 transition-all duration-700 ease-in-out flex flex-col justify-center
                     ${index === currentSlide ? 'opacity-100 translate-x-0 relative z-10' : 'opacity-0 -translate-x-8 absolute pointer-events-none z-0'}
                   `}
                >
                  {/* Badge */}
                  <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4 md:mb-6 w-fit transition-all duration-500 ${s.colorClass}`}>
                    <span className={`w-2 h-2 rounded-full animate-pulse ${s.dotClass}`}></span>
                    <span className="text-xs md:text-sm font-bold uppercase tracking-wider">{s.tag}</span>
                  </div>

                  {/* Title */}
                  <h2 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-extrabold text-darkGray dark:text-white mb-4 md:mb-6 leading-[1.1]">
                    {s.title}
                  </h2>

                  {/* Description */}
                  <p className="text-sm md:text-lg text-gray-600 dark:text-gray-300 mb-6 md:mb-8 leading-relaxed max-w-lg">
                    {s.desc}
                  </p>

                  {/* Features List */}
                  <ul className="space-y-3 md:space-y-4 mb-6 md:mb-8">
                    {s.features.map((item, i) => (
                      <li key={i} className="flex items-start md:items-center gap-3 text-darkGray dark:text-gray-200 font-medium text-xs md:text-base">
                        <div className={`w-5 h-5 md:w-6 md:h-6 min-w-[20px] md:min-w-[24px] rounded-full flex items-center justify-center mt-0.5 md:mt-0 ${s.colorClass.split(' ')[1]} ${s.colorClass.split(' ')[0]}`}>
                          <Check size={12} className="md:w-3.5 md:h-3.5" strokeWidth={3} />
                        </div>
                        <span className="flex-1">{item}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <div className="pt-2">
                    <Link href="/demo" className={`font-bold hover:underline inline-flex items-center gap-2 transition-colors text-base md:text-lg ${s.colorClass.split(' ')[0]}`}>
                      Si qoto dheer u eeg <ArrowRight size={18} className="md:w-5 md:h-5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Images Container - Also Grid Stack for smooth transitions */}
            <div className="relative h-[300px] sm:h-[400px] lg:h-[500px] w-full flex items-center justify-center lg:justify-end mt-8 lg:mt-0 perspective-1000">
              {slides.map((s, index) => (
                <div
                  key={s.id}
                  className={`absolute inset-0 w-full h-full flex items-center justify-center lg:justify-end transition-all duration-1000 ease-out
                    ${index === currentSlide
                      ? 'opacity-100 translate-y-0 rotate-y-0 scale-100 blur-0'
                      : 'opacity-0 translate-y-8 rotate-y-6 scale-95 blur-sm pointer-events-none'}
                  `}
                >
                  <div className="relative w-full max-w-lg lg:max-w-xl transition-transform duration-500 hover:scale-[1.02]">
                    <Image
                      src={s.image}
                      alt={s.tag}
                      width={800}
                      height={600}
                      className="w-full h-auto object-contain drop-shadow-2xl rounded-2xl border border-white/20 dark:border-white/10 bg-white/5 backdrop-blur-sm"
                      priority={index === 0}
                    />
                    {/* Glow effect matching the slide color */}
                    <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] blur-[60px] md:blur-[80px] -z-10 rounded-full opacity-50 
                       ${s.dotClass.replace('bg-', 'bg-')}/50`}>
                    </div>
                  </div>
                </div>
              ))}

              {/* Slider Navigation Dots - Positioned below image on mobile, or bottom-left of image area */}
              <div className="absolute -bottom-8 lg:-bottom-12 left-1/2 lg:left-auto lg:right-1/2 transform -translate-x-1/2 lg:translate-x-1/2 flex gap-3 z-30">
                {slides.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentSlide(i)}
                    className={`h-2.5 rounded-full transition-all duration-300 ${i === currentSlide ? `w-8 ${s.dotClass}` : 'w-2.5 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400'
                      }`}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </Sticky3DSection>
  );
};

// --- Core Values Section (No Fake Numbers) ---
const Statistics = () => {
  const values = [
    { label: 'Taageero', title: '24/7', desc: 'Caawinaad joogto ah', icon: Clock },
    { label: 'Amniga', title: '100%', desc: 'Xogtaadu waa amaan', icon: ShieldCheck },
    { label: 'Luqadda', title: 'Af-Soomaali & English', desc: 'Midkii kuu fudud ', icon: Globe },
    { label: 'Isticmaalka', title: 'Fudud', desc: 'Barasho uma baahna', icon: CheckCircle }
  ];

  return (
    <Sticky3DSection index={3} className="bg-darkGray dark:bg-black">
      <section className="relative z-20 text-white border-y border-white/5 py-12 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <ScrollReveal width="100%" direction="up" delay={0.1} distance={20}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 divide-x-0 md:divide-x divide-white/10">
              {values.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} className="flex flex-col items-center text-center group cursor-default">
                    <div className="mb-4 p-3 rounded-xl bg-white/5 text-gray-400 group-hover:text-primary group-hover:bg-white/10 group-hover:scale-110 transition-all duration-300">
                      <Icon size={24} />
                    </div>
                    <div className="text-2xl md:text-3xl font-black mb-2 tracking-tight text-white group-hover:text-primary transition-colors">
                      {item.title}
                    </div>
                    <div className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">{item.label}</div>
                    <div className="text-xs text-gray-500 font-medium">{item.desc}</div>
                  </div>
                );
              })}
            </div>
          </ScrollReveal>
        </div>
      </section>
    </Sticky3DSection>
  );
};




const HowItWorks = () => {
  const steps = [
    { id: 1, title: 'Is-diiwaangeli', desc: 'Koonto sameyso daqiiqado gudahood. Waa bilaash in la bilaabo.', icon: Users },
    { id: 2, title: 'Habee Warshadaada', desc: 'Geli alaabta ceeriin (Raw Materials), qorshaha BOM-ka, iyo macaamiishaada.', icon: Factory },
    { id: 3, title: 'Bilow Maamulka', desc: 'La soco dhaqdhaqaaqa, iibka, iyo wax-soo-saarka si toos ah dashboard-kaaga.', icon: LineChart },
  ];

  return (
    <Sticky3DSection index={5} className="bg-gray-50 dark:bg-gray-800/30">
      <div id="how-it-works" className="py-20 md:py-28 h-full flex flex-col justify-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Sticky Header */}
          <div className="sticky top-[80px] z-30 bg-gray-50/90 dark:bg-gray-800/90 backdrop-blur-md py-4 rounded-xl mb-12 shadow-sm text-center">
            <ScrollReveal width="100%" direction="up" delay={0.1}>
              <h2 className="text-primary font-bold tracking-wide uppercase text-sm mb-1">Habsami u Socodka</h2>
              <h3 className="text-3xl md:text-4xl font-extrabold text-darkGray dark:text-white">Saddex Tallaabo</h3>
            </ScrollReveal>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative mt-16">
            <div className="hidden md:block absolute top-24 left-[16%] right-[16%] h-0.5 bg-gray-200 dark:bg-gray-700 -z-10"></div>

            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <ScrollReveal key={step.id} width="100%" direction="up" delay={0.2 + (index * 0.1)} className="h-full">
                  <div className="relative flex flex-col items-center text-center group h-full">
                    <div className="w-20 h-20 bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 flex items-center justify-center mb-6 text-primary group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-300 relative z-10">
                      <Icon size={32} />
                      <div className="absolute -top-3 -right-3 w-8 h-8 bg-secondary rounded-full flex items-center justify-center text-white font-bold text-sm border-4 border-gray-50 dark:border-gray-800">
                        {step.id}
                      </div>
                    </div>
                    <h4 className="text-xl font-bold text-darkGray dark:text-white mb-3">{step.title}</h4>
                    <p className="text-mediumGray dark:text-gray-400 max-w-xs leading-relaxed">{step.desc}</p>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </div>
    </Sticky3DSection>
  );
};

const FeatureCard = ({ icon, title, desc, delay }: { icon: any, title: string, desc: string, delay: number }) => (
  <ScrollReveal width="100%" direction="up" delay={delay} className="h-full">
    <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-transparent hover:border-primary/20 hover:bg-white dark:hover:bg-gray-750 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group h-full">
      <div className="w-12 h-12 bg-white dark:bg-gray-700/50 rounded-xl flex items-center justify-center text-primary shadow-sm mb-4 group-hover:bg-primary group-hover:text-white transition-all">
        {React.cloneElement(icon, { size: 24 })}
      </div>
      <h4 className="text-lg font-bold text-darkGray dark:text-white mb-2">{title}</h4>
      <p className="text-mediumGray dark:text-gray-400 text-sm leading-relaxed">{desc}</p>
    </div>
  </ScrollReveal>
);

const Features = () => {
  return (
    <Sticky3DSection index={6} className="bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
      <div id="features" className="py-24 h-full flex flex-col justify-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-5 gap-12 lg:gap-20">
            {/* Left Header with Sticky Effect */}
            <div className="lg:col-span-2">
              <div className="sticky top-32">
                <ScrollReveal width="100%" direction="right" delay={0.2}>
                  <h2 className="text-primary font-bold tracking-wide uppercase text-sm mb-4">Awoodaha Nidaamka</h2>
                  <h3 className="text-4xl md:text-5xl font-extrabold text-darkGray dark:text-white mb-6 leading-tight">
                    Wax Walba <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Hal Meel.</span>
                  </h3>
                  <p className="text-xl text-mediumGray dark:text-gray-400 mb-8 leading-relaxed">
                    Ka guuro waraaqaha iyo Excel-ka. AN-Industory wuxuu isugu keenay wax walba oo shaqadaadu u baahan tahay, laga bilaabo wax-soo-saarka ilaa xisaabaadka iyo HR.
                  </p>
                  <Link href="/signup" className="hidden lg:inline-flex items-center gap-2 text-primary font-bold text-lg hover:gap-3 transition-all">
                    Arag Dhammaan Astaamaha <ArrowRight size={20} />
                  </Link>
                </ScrollReveal>
              </div>
            </div>

            {/* Right Grid */}
            <div className="lg:col-span-3 grid sm:grid-cols-2 gap-6">
              <FeatureCard icon={<Briefcase />} title="Maamulka Mashruuca" desc="Jadwalka, Miisaaniyadda, iyo Hawlaha." delay={0} />
              <FeatureCard icon={<Factory />} title="Warshadaha" desc="Production, Raw Materials, iyo Costing." delay={0.1} />
              <FeatureCard icon={<Landmark />} title="Xisaabaadka" desc="Invoicing, Payroll, iyo Warbixino Maaliyadeed." delay={0.2} />
              <FeatureCard icon={<Zap />} title="Sirdoonka Macmalka (AI)" desc="Scan-garee rasiidadka, helna gorfayn AI ah." delay={0.3} />
              <FeatureCard icon={<ShieldCheck />} title="Ammaan & Dabagal" desc="Audit Logs, xakamayn adag, iyo difaac." delay={0.4} />
              <FeatureCard icon={<Globe />} title="Cloud & Luqado Badan" desc="Somali/English, meel kasta ka shaqee." delay={0.5} />
            </div>

            <div className="lg:hidden text-center mt-8">
              <Link href="/signup" className="inline-flex items-center gap-2 text-primary font-bold text-lg">
                Arag Dhammaan Astaamaha <ArrowRight size={20} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Sticky3DSection>
  );
};

const Solutions = () => {
  const items = [
    {
      title: 'Warshado',
      desc: 'Xisaabi qiimaha dhabta ah (Cost Per Unit) oo yaree khasaaraha alaabta.',
      icon: <Factory />,
    },
    {
      title: 'Dhismaha',
      desc: 'Maamul boqolaalka shaqaale, qalabka, iyo kharashka goobta shaqada.',
      icon: <Warehouse />,
    },
    {
      title: 'Adeeg Bixinta',
      desc: 'Qandaraasyada iyo biilasha macaamiisha hal meel ku maamul.',
      icon: <Briefcase />,
    },
  ];

  return (
    <Sticky3DSection index={7} className="bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 text-center">
      <div id="solutions" className="py-24 h-full flex flex-col justify-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Sticky Header */}
          <div className="sticky top-[80px] z-30 bg-gray-50/90 dark:bg-gray-800/90 backdrop-blur-md py-4 rounded-xl mb-12 shadow-sm inline-block px-8 w-full max-w-4xl">
            <ScrollReveal width="100%" direction="up" delay={0.1}>
              <h2 className="text-primary font-bold tracking-wide uppercase text-sm mb-3">Xalka AN-Industory</h2>
              <h3 className="text-3xl md:text-4xl font-extrabold text-darkGray dark:text-white">Nidaam Ku Habboon Warshadaha & Mashaariicda Waaweyn</h3>
            </ScrollReveal>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-12">
            {items.map((item, idx) => (
              <ScrollReveal key={item.title} width="100%" direction="up" delay={0.2 + (idx * 0.1)} className="h-full">
                <div
                  className="p-8 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-2xl transition-all duration-300 group text-left h-full"
                >
                  <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                    {React.cloneElement(item.icon as any, { size: 28 })}
                  </div>
                  <h4 className="text-2xl font-bold text-darkGray dark:text-white mb-3">{item.title}</h4>
                  <p className="text-mediumGray dark:text-gray-400 leading-relaxed font-medium">{item.desc}</p>
                  <Link href="/signup" className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800 flex items-center text-primary font-bold text-sm cursor-pointer hover:underline">
                    Baro Sida <ChevronRight size={16} />
                  </Link>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </div>
    </Sticky3DSection>
  );
};

const Pricing = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const plans = [
    {
      name: 'Starter (Tijaabo)',
      target: 'Ganacsiyada raba inay tijaabiyaan',
      price: '14',
      period: ' Cisho',
      description: 'Tijaabi awooda nidaamka oo dhan muddo 14 cisho ah adiga oo aan wax lacag ah bixin.',
      buttonText: 'Bilaaw Tijaabada',
      buttonColor: 'bg-white text-darkGray border border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-white dark:border-gray-700',
      popular: false,
      features: [
        { name: 'Dhammaan Astaamaha', included: true },
        { name: 'AI Scanner & Chat', included: true },
        { name: 'Luqadaha (Somali/English)', included: true },
        { name: '14 Cisho oo Tijaabo ah', included: true },
        { name: 'Xisaabaadka & Warshadaha', included: true },
        { name: 'Bilaa Credit Card', included: true },
        { name: 'Dedicated Support', included: false },
        { name: 'On-premise Installation', included: false },
      ]
    },
    {
      name: 'Professional (Warshada Dhexe)',
      target: 'Warshadaha iyo Shirkadaha Wax-soo-saarka',
      price: billingCycle === 'monthly' ? '$30' : '$288',
      period: billingCycle === 'monthly' ? '/bishii' : '/sanadkii',
      description: 'Qorshe dhamaystiran oo lagu maamulo kaydka alaabta, wax-soo-saarka, iyo xisaabaadka.',
      buttonText: 'Tijaabi 14 Maalmood',
      buttonColor: 'bg-primary text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/30',
      popular: true,
      features: [
        { name: 'Wax walba oo Starter ah', included: true },
        { name: '5 User Accounts', included: true },
        { name: 'Inventory & Raw Stock (DH/caps)', included: true },
        { name: 'Manufacturing & BOM Line', included: true },
        { name: 'HR & Payroll (Mushaharka)', included: true },
        { name: 'Accounting & Expenses Ledger', included: true },
        { name: 'Sales & Invoicing Hub', included: true },
        { name: 'API Access', included: false },
      ]
    },
    {
      name: 'Enterprise (Shirkadaha Waaweyn)',
      target: 'Warshadaha Multi-Line & Hawlaha Waaweyn',
      price: 'Heshiis',
      period: '',
      description: 'Nidaam gaar ah oo loogu talagalay warshadaha heerkoodu aadka u sarreeyo.',
      buttonText: 'La Hadal Sales-ka',
      buttonColor: 'bg-darkGray text-white hover:bg-black dark:bg-white dark:text-black',
      popular: false,
      features: [
        { name: 'Wax walba oo Professional ah', included: true },
        { name: 'Unlimited Users', included: true },
        { name: 'Multi-Line Production Control', included: true },
        { name: 'Automatic Yield & Waste Costing', included: true },
        { name: 'Advanced Supply Chain Management', included: true },
        { name: 'Custom ERP Modules', included: true },
        { name: 'Dedicated Support Manager', included: true },
        { name: 'On-premise / Local Installation', included: true },
      ]
    }
  ];

  return (
    <Sticky3DSection index={8} className="bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-black border-t border-gray-100 dark:border-gray-800 relative">
      <div id="pricing" className="py-24 lg:py-32 h-full flex flex-col justify-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">

          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <ScrollReveal width="fit-content" direction="up" delay={0.1}>
              <h2 className="text-primary font-bold tracking-wide uppercase text-sm mb-3">Qiimaha & Qorshayaasha</h2>
              <h3 className="text-4xl md:text-5xl font-extrabold text-darkGray dark:text-white mb-6">
                Doorasho Ku Habboon <br className="hidden md:block" /> Ganacsi Kasta.
              </h3>
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-10">
                Ma jirto qarsoodi. Dooro qorshaha adiga kuu shaqeynaya. Iska bedel wakhti kasta.
              </p>

              {/* Billing Toggle */}
              <div className="inline-flex bg-gray-100 dark:bg-gray-800 p-1 rounded-full relative">
                <div className={`absolute w-1/2 h-[calc(100%-8px)] top-1 bg-white dark:bg-gray-700 rounded-full shadow-sm transition-all duration-300 ${billingCycle === 'monthly' ? 'left-1' : 'left-[calc(50%-4px)] translate-x-full'}`}></div>
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`relative z-10 px-6 py-2 rounded-full text-sm font-bold transition-colors ${billingCycle === 'monthly' ? 'text-primary' : 'text-gray-500 hover:text-darkGray dark:hover:text-white'}`}
                >
                  Bille (Monthly)
                </button>
                <button
                  onClick={() => setBillingCycle('yearly')}
                  className={`relative z-10 px-6 py-2 rounded-full text-sm font-bold transition-colors ${billingCycle === 'yearly' ? 'text-primary' : 'text-gray-500 hover:text-darkGray dark:hover:text-white'}`}
                >
                  Sanadle (Yearly) <span className="text-[10px] text-green-500 ml-1">-20%</span>
                </button>
              </div>
            </ScrollReveal>
          </div>

          {/* Cards Grid */}
          <div className="grid lg:grid-cols-3 gap-8 lg:gap-8 items-start">
            {plans.map((plan, index) => (
              <ScrollReveal key={plan.name} width="100%" direction="up" delay={0.2 + (index * 0.1)}>
                <div
                  className={`relative p-6 sm:p-8 rounded-[2rem] border transition-all duration-300 flex flex-col h-full
                    ${plan.popular
                      ? 'bg-white dark:bg-gray-800 border-primary shadow-2xl shadow-blue-900/10 scale-100 lg:scale-105 z-10 border-2 my-6 lg:my-0'
                      : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 shadow-lg hover:shadow-xl hover:-translate-y-1'
                    }
                  `}
                >
                  {plan.popular && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white px-6 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg whitespace-nowrap z-20">
                      Ugu Caansan
                    </div>
                  )}

                  <div className="mb-6 lg:mb-8">
                    <h4 className="text-xl sm:text-2xl font-bold text-darkGray dark:text-white mb-2">{plan.name}</h4>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium mb-4 sm:mb-6">{plan.target}</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl lg:text-5xl font-black text-darkGray dark:text-white tracking-tight">
                        {plan.price}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400 font-medium">{plan.period}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-4 leading-relaxed">{plan.description}</p>
                  </div>

                  <div className="space-y-4 mb-8 flex-1">
                    <div className="h-px w-full bg-gray-100 dark:bg-gray-700 mb-6"></div>
                    {plan.features.map((feature, i) => (
                      <div key={i} className="flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 min-w-[1.25rem] rounded-full flex items-center justify-center ${feature.included ? 'bg-green-100 text-green-600 dark:bg-green-900/30' : 'bg-gray-100 text-gray-400 dark:bg-gray-800'}`}>
                            {feature.included ? <Check size={12} strokeWidth={3} /> : <X size={12} />}
                          </div>
                          <span className={`text-sm font-medium ${feature.included ? 'text-gray-700 dark:text-gray-200' : 'text-gray-400 dark:text-gray-600'}`}>
                            {feature.name}
                          </span>
                        </div>
                        {feature.included && <div className="w-1.5 h-1.5 rounded-full bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>}
                      </div>
                    ))}
                  </div>

                  <Link
                    href="/signup"
                    className={`w-full py-3 sm:py-4 rounded-xl font-bold text-center transition-all duration-300 transform active:scale-95 ${plan.buttonColor}`}
                  >
                    {plan.buttonText}
                  </Link>
                </div>
              </ScrollReveal>
            ))}
          </div>

          <div className="mt-16 text-center">
            <p className="text-gray-500 text-sm">
              Ma u baahantahay caawimaad? <Link href="/contact" className="text-primary font-bold hover:underline">Nala soo xiriir</Link> kooxdayada taageerada.
            </p>
          </div>

        </div>
      </div>
    </Sticky3DSection>
  );
};

// --- FAQ Section (NEW) ---
const FAQ = () => {
  const faqs = [
    { q: "Ma u baahanahay internet joogto ah?", a: "Maya. AN-Industory wuxuu leeyahay 'Offline Mode'. Waad shaqayn kartaa internet la'aan, markaad hesho internet-na xogta ayaa synchronise samaynaysa." },
    { q: "Ma isticmaali karaa Mobile?", a: "Haa. AN-Industory waa PWA (Progressive Web App). Waxaad ku shuban kartaa mobile-kaaga (Android & iOS) adigoo ka heleya khibrad sare." },
    { q: "Xogtaydu ma ammaan baa?", a: "Haa. Xogtaada waxaa lagu keydiyaa Cloud Servers oo aad u ammaan ah (Encrypted). Adiga kaliya ayaa geli kara." },
    { q: "Ma jiraan kharashyo qarsoon?", a: "Maya. Qiimaha aad aragto waa kaas. Ma jiraan wax qarsoon. Support-kuna waa bilaash." }
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <Sticky3DSection index={9} className="bg-gray-50 dark:bg-gray-800/30">
      <div id="faq" className="py-24 h-full flex flex-col justify-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          {/* Sticky Header */}
          <div className="sticky top-[80px] z-30 bg-gray-50/90 dark:bg-gray-800/90 backdrop-blur-md py-4 rounded-xl mb-12 shadow-sm text-center">
            <ScrollReveal width="100%" direction="up" delay={0.1}>
              <h3 className="text-3xl font-bold text-darkGray dark:text-white">Su'aalaha Badanaa La Iswaydiiyo</h3>
            </ScrollReveal>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <ScrollReveal key={i} width="100%" direction="up" delay={0.2 + (i * 0.1)}>
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
                  <button
                    onClick={() => setOpenIndex(openIndex === i ? null : i)}
                    className="w-full flex items-center justify-between p-6 text-left"
                  >
                    <span className="font-bold text-lg text-darkGray dark:text-white">{faq.q}</span>
                    <ChevronDown size={20} className={`text-mediumGray transition-transform duration-300 ${openIndex === i ? 'rotate-180' : ''}`} />
                  </button>
                  <div className={`transition-all duration-300 ease-in-out ${openIndex === i ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <p className="px-6 pb-6 text-mediumGray dark:text-gray-400 leading-relaxed">
                      {faq.a}
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </div>
    </Sticky3DSection>
  );
};

// --- Final CTA Section (NEW) ---
const FinalCTA = () => (
  <Sticky3DSection index={12} className="bg-primary text-white relative overflow-hidden">
    <div className="py-24 h-full flex flex-col justify-center relative">
      {/* Abstract Backgrounds */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-black/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <ScrollReveal width="100%" direction="up" delay={0.1}>
          <h2 className="text-4xl md:text-5xl font-black mb-8 leading-tight">Diyaar Ma U Tahay Inaad Kobciso Warshadaada?</h2>
          <p className="text-xl md:text-2xl text-emerald-100 mb-10 max-w-2xl mx-auto">Kusoo biir AN-Industory oo maanta isticmaal nidaamka. Waa bilaash in la tijaabiyo.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/signup" className="bg-white text-primary px-10 py-4 rounded-2xl font-bold text-xl hover:bg-gray-100 shadow-xl transition-transform hover:-translate-y-1">
              Bilaaw Hadda
            </Link>
            <Link href="/contact" className="bg-transparent border-2 border-white text-white px-10 py-4 rounded-2xl font-bold text-xl hover:bg-white/10 transition-colors">
              Nala Soo Xiriir
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </div>
  </Sticky3DSection>
);

const PWAInstall = () => {
  return (
    <Sticky3DSection index={10} className="bg-gradient-to-br from-primary/5 to-secondary/5 dark:from-gray-900 dark:to-gray-800">
      <div id="download" className="py-24 h-full flex flex-col justify-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <ScrollReveal width="100%" direction="left" delay={0.2}>
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-primary text-xs font-bold uppercase tracking-wider mb-6">
                  <Smartphone size={14} /> Mobile & Desktop
                </div>
                <h3 className="text-3xl md:text-5xl font-bold text-darkGray dark:text-white mb-6">
                  Ku shubo AN-Industory <br />
                  <span className="text-secondary">Qalab Kasta.</span>
                </h3>
                <p className="text-lg text-mediumGray dark:text-gray-400 mb-8 leading-relaxed">
                  AN-Industory waa **Progressive Web App (PWA)**. Taas macnaheedu waa inaad ku isticmaali karto Computer-kaaga, Tablet-kaaga, ama Smart Phone-kaaga adiga oo aan u baahnayn App Store.
                </p>

                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-md text-primary">
                      <Cloud size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-darkGray dark:text-white text-lg">Wuxuu Shaqeeyaa Offline</h4>
                      <p className="text-mediumGray dark:text-gray-400">Xitaa haddii internet-ku go'o, shaqadaadu ma istaagayso. Xogtu way synchronise-gareysaa marka aad online noqoto.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-md text-secondary">
                      <Zap size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-darkGray dark:text-white text-lg">Xawaare Sare</h4>
                      <p className="text-mediumGray dark:text-gray-400">Waxaa loo dhisay inuu ahaado mid fudud oo degdeg ah, iyadoo aan culeys saarayn qalabkaaga.</p>
                    </div>
                  </div>
                </div>

                <div className="mt-10 flex gap-4">
                  <button className="bg-darkGray text-white px-6 py-3 rounded-lg font-bold hover:bg-black transition-colors flex items-center gap-2">
                    <Download size={20} /> Ku Shubo App-ka
                  </button>
                </div>
              </div>
            </ScrollReveal>

            {/* Visual representation of Cross-platform */}
            <ScrollReveal width="100%" direction="right" delay={0.4}>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary to-secondary rounded-full filter blur-[100px] opacity-20"></div>
                <div className="relative bg-black border border-gray-800 rounded-[2.5rem] shadow-2xl p-2 transform rotate-2 hover:rotate-0 transition-all duration-500 max-w-sm mx-auto">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 h-6 w-32 bg-black rounded-b-2xl z-20"></div>
                  <div className="relative aspect-[9/19.5] bg-gray-900 rounded-[2rem] overflow-hidden border border-gray-800">
                    <Image
                      src="/pwa-preview.png"
                      alt="Revlo Mobile App Interface"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </Sticky3DSection>
  );
};

// Forced update for PWA image

const Reviews = () => {
  return (
    <Sticky3DSection index={11} className="bg-white dark:bg-gray-900">
      <div className="py-24 h-full flex flex-col justify-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal width="100%" direction="up" delay={0.1}>
            <div className="text-center mb-16">
              <h3 className="text-3xl font-bold text-darkGray dark:text-white mb-4">Waxa Ay Macaamiishu Dhahaan</h3>
              <p className="text-mediumGray dark:text-gray-400">Ku biir boqolaal shirkadood oo ku horumaray isticmaalka AN-Industory</p>
            </div>
          </ScrollReveal>

          {/* Re-integrated the original component logic here or import it if compatible */}
          <ScrollReveal width="100%" direction="up" delay={0.2}>
            <div className="bg-lightGray/20 dark:bg-gray-800 p-8 rounded-3xl">
              <LiveReviews />
            </div>
          </ScrollReveal>
        </div>
      </div>
    </Sticky3DSection>
  );
};

const Footer = () => {
  const { addNotification } = useNotifications();

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    addNotification({
      type: 'success',
      message: `${type} copied to clipboard!`
    });
  };

  return (
    <footer className="bg-darkGray text-white py-16 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="col-span-1 md:col-span-2">
          <Link href="/" className="text-3xl font-bold mb-6 block">AN-Industory<span className="text-primary">.</span></Link>
          <p className="text-gray-400 max-w-sm mb-6 leading-relaxed">
            Nidaamka koowaad ee ERP ee loogu talagalay horumarinta warshadaha iyo hawlaha wax-soo-saarka ee Bariga Afrika.
            Tayada, Hufnaanta, iyo Tiknoolajiyadda.
          </p>
          <div className="flex gap-4">
            {/* Socials placeholder */}
            <Link href="https://merry-zuccutto-cc1bd1.netlify.app" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-primary transition-colors cursor-pointer"><Globe size={20} /></Link>
            <Link href="mailto:info@an-industory.com" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-primary transition-colors cursor-pointer"><Mail size={20} /></Link>
          </div>
        </div>

        <div>
          <h4 className="font-bold text-lg mb-6 text-white border-b border-gray-700 pb-2 inline-block">Bogagga</h4>
          <ul className="space-y-3 text-gray-400">
            <li><Link href="/#features" className="hover:text-primary transition-colors">Astaamaha</Link></li>
            <li><Link href="/#pricing" className="hover:text-primary transition-colors">Qiimaha</Link></li>
            <li><Link href="/login" className="hover:text-primary transition-colors">Gal (Login)</Link></li>
            <li><Link href="/signup" className="hover:text-primary transition-colors">Isdiiwaangeli</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-lg mb-6 text-white border-b border-gray-700 pb-2 inline-block">Nala Xiriir</h4>
          <ul className="space-y-3 text-gray-400">
            <li
              onClick={() => handleCopy('info@an-industory.com', 'Email')}
              className="flex items-center gap-3 cursor-pointer hover:text-white transition-colors"
            >
              <Mail size={18} className="text-primary" /> info@an-industory.com
            </li>
            <li
              onClick={() => handleCopy('+251 929 475 332', 'Phone number')}
              className="flex items-center gap-3 cursor-pointer hover:text-white transition-colors"
            >
              <Phone size={18} className="text-primary" /> +251 929 475 332
            </li>
            <li className="flex items-center gap-3"><MapPin size={18} className="text-primary" /> Jigjiga, Somali Region</li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pt-8 border-t border-gray-800 text-center text-gray-500 text-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <p>&copy; {new Date().getFullYear()} AN-Industory. Xuquuqda oo dhan waa ay xifdisan tahay.</p>
        <div className="flex gap-6">
          <Link href="/terms" className="hover:text-white">Shuruudaha (Terms)</Link>
          <Link href="/privacy" className="hover:text-white">Xog-dhawrka (Privacy)</Link>
        </div>
      </div>
    </footer>
  );
};


export default function HomePage() {
  return (
    <main className="min-h-screen bg-white dark:bg-gray-900 font-sans selection:bg-primary/30 selection:text-primary overflow-x-hidden">
      <ScrollProgressBar />
      {/* Navbar moved inside specific relative container if needing sticky? No, Navbar is fixed. */}
      <Navbar />

      {/* Background Elements */}
      <ParallaxBackground />

      <Hero />
      <DashboardPreview />
      <Statistics />
      <Sticky3DSection index={4} className="bg-white dark:bg-gray-900">
        <BusinessSolutionSelector />
      </Sticky3DSection>
      <div className="relative">
        <HowItWorks />
        <Features />
        <Solutions />
        <Pricing />
        <FAQ />
      </div>
      <PWAInstall />
      <Reviews />
      <FinalCTA />
      <Footer />
    </main>
  );
}