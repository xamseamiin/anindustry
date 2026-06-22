'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Phone, Mail, MapPin, Clock, ChevronDown, ArrowRight,
  Droplets, Award, ShieldCheck, ChevronRight, Menu, X,
  Globe, Star, Send, Heart, Eye, Milk,
  Sparkles, Package, CheckCircle
} from 'lucide-react';

// =============================================
// ANIMATED COUNTER COMPONENT
// =============================================
const AnimatedCounter = ({ to, suffix = '', prefix = '' }: { to: number; suffix?: string; prefix?: string }) => {
  const [count, setCount] = useState(0);
  const nodeRef = useRef<HTMLSpanElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !hasAnimated) {
        setHasAnimated(true);
        const end = to;
        const duration = 2000;
        const startTime = performance.now();

        const animate = (currentTime: number) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
          setCount(Math.floor(end * ease));
          if (progress < 1) requestAnimationFrame(animate);
          else setCount(end);
        };
        requestAnimationFrame(animate);
      }
    }, { threshold: 0.1 });
    if (nodeRef.current) observer.observe(nodeRef.current);
    return () => observer.disconnect();
  }, [to, hasAnimated]);

  return <span ref={nodeRef}>{prefix}{count}{suffix}</span>;
};

// =============================================
// SCROLL REVEAL WRAPPER
// =============================================
const Reveal = ({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setTimeout(() => setVisible(true), delay * 1000);
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.1 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}
    >
      {children}
    </div>
  );
};

// =============================================
// NAVBAR
// =============================================
const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', href: '#' },
    { name: 'About Us', href: '#about' },
    { name: 'Products', href: '#products' },
    { name: 'Industries', href: '#sectors' },
    { name: 'Contact Us', href: '#contact' },
  ];

  return (
    <nav className={`fixed w-full z-50 transition-all duration-500 ${scrolled
      ? 'bg-slate-950/90 backdrop-blur-xl border-b border-white/5 py-3 shadow-lg'
      : 'bg-transparent py-5'
      }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center group z-50">
            <div className={`relative transition-all duration-500 ${
              scrolled ? 'w-24 h-12' : 'w-32 h-16'
            }`}>
              <Image 
                src="/logo.png" 
                alt="AN Industries Logo" 
                fill 
                className="object-contain"
                priority
              />
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`text-xs font-semibold hover:text-emerald-400 transition-colors relative group text-white/80`}
              >
                {link.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-emerald-500 group-hover:w-full transition-all duration-300" />
              </Link>
            ))}
          </div>

          {/* Right Area buttons */}
          <div className="hidden lg:flex items-center gap-4">
            <a
              href="tel:+251913437741"
              className="flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-full border border-white/10 hover:border-emerald-500/30 text-white/95 hover:text-emerald-400 hover:bg-white/5 transition-all"
            >
              <Phone size={12} />
              <span>+251 91 343 7741</span>
            </a>
            <Link
              href="#contact"
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs px-5 py-2.5 rounded-full flex items-center gap-2 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/35 transition-all"
            >
              <span>Get a Quote</span>
              <ArrowRight size={12} />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2 rounded-xl z-50 text-white hover:text-emerald-400 transition-colors"
            aria-label="Menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown (Floating Glass Card) */}
      <div className={`fixed top-24 left-4 right-4 bg-slate-950/85 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl transition-all duration-300 lg:hidden flex flex-col z-40 ${
        isOpen 
          ? 'opacity-100 translate-y-0 pointer-events-auto' 
          : 'opacity-0 -translate-y-4 pointer-events-none'
      }`}>
        <div className="space-y-4">
          {navLinks.map((link, i) => (
            <Link
              key={link.name}
              href={link.href}
              className={`block text-xl font-bold text-white hover:text-emerald-400 transition-all duration-300 ${
                isOpen ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'
              }`}
              style={{ transitionDelay: `${i * 50}ms` }}
              onClick={() => setIsOpen(false)}
            >
              {link.name}
            </Link>
          ))}
          <div className="pt-4 border-t border-white/10 flex flex-col gap-4">
            <a
              href="tel:+251913437741"
              className="flex items-center gap-2 text-sm font-semibold text-white/80 hover:text-emerald-400 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <Phone size={14} className="text-emerald-400" /> +251 91 343 7741
            </a>
            <Link
              href="#contact"
              className="bg-emerald-500 hover:bg-emerald-600 text-white text-center font-bold text-sm py-2.5 rounded-full shadow-lg shadow-emerald-500/20 transition-all"
              onClick={() => setIsOpen(false)}
            >
              Get a Quote
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

// =============================================
// HERO SECTION
// =============================================
const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-24 lg:pt-32 pb-12 overflow-hidden bg-slate-950">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-right lg:bg-center bg-no-repeat opacity-95" 
        style={{ backgroundImage: "url('/hero-bottles.png')" }} 
      />
      
      {/* Dark gradient overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/70 to-slate-950/20 lg:from-slate-950 via-slate-950/60 lg:to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-slate-950/10 pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* Left - Content */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <Reveal>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-sm mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400 text-[10px] font-black uppercase tracking-widest">Premium PET Bottles</span>
              </div>
            </Reveal>

            {/* Headline */}
            <Reveal delay={0.1}>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white leading-[1.1] tracking-tight mb-6">
                Tayada Alaabtaadu
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-sky-400">
                  Waa Mudnaanteenna.
                </span>
              </h1>
            </Reveal>

            {/* Subtext */}
            <Reveal delay={0.2}>
              <p className="text-sm md:text-base text-white/60 max-w-lg mx-auto lg:mx-0 mb-8 leading-relaxed">
                AN Industries Partnership waxay soo saartaa caagadaha PET ee 1L iyo 0.5L kuwaas oo ilaalinaya nadaafadda, badbaadada iyo tayada wax-soo-saarkaaga, si alaabtaadu u gaarto macaamiisha iyadoo kalsooni buuxda leh.
              </p>
            </Reveal>

            {/* CTA */}
            <Reveal delay={0.3}>
              <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                <Link
                  href="#products"
                  className="group relative inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3.5 rounded-full font-bold text-sm shadow-xl shadow-emerald-500/10 hover:shadow-emerald-500/25 hover:-translate-y-0.5 transition-all duration-200"
                >
                  <span>Badeecadaha Arag</span>
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="#contact"
                  className="inline-flex items-center justify-center gap-2 bg-slate-950 border border-white/15 text-white px-6 py-3.5 rounded-full font-bold text-sm hover:bg-slate-905 hover:-translate-y-0.5 transition-all duration-200"
                >
                  <Phone size={16} />
                  <span>Nala Soo Xiriir</span>
                </Link>
              </div>
            </Reveal>

            {/* Small inline badges */}
            <Reveal delay={0.4}>
              <div className="flex flex-wrap gap-x-6 gap-y-3 mt-8 pt-6 border-t border-white/10 justify-center lg:justify-start">
                <div className="flex items-center gap-2 text-white/70">
                  <ShieldCheck size={16} className="text-emerald-400" />
                  <span className="text-xs font-semibold">Food Grade</span>
                  <span className="text-[10px] text-white/40">/ Amaan & Nadiif</span>
                </div>
                <div className="flex items-center gap-2 text-white/70">
                  <Award size={16} className="text-emerald-400" />
                  <span className="text-xs font-semibold">ISO Certified</span>
                  <span className="text-[10px] text-white/40">/ 9001:2015</span>
                </div>
                <div className="flex items-center gap-2 text-white/70">
                  <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 11V7a5 5 0 0 1 8.2-3.8l2.3 2.3M17 11V7M21 13h-4a5 5 0 0 0-8.2 3.8l-2.3-2.3M7 13h4M17 13v4a5 5 0 0 1-8.2 3.8l-2.3-2.3M7 17v-4" />
                  </svg>
                  <span className="text-xs font-semibold">100% Recyclable</span>
                  <span className="text-[10px] text-white/40">/ Eco Friendly</span>
                </div>
              </div>
            </Reveal>
          </div>

          {/* Right - Empty Spacer Column (to let the background image's bottles show on the right) */}
          <div className="hidden lg:block h-[450px] pointer-events-none" />
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
        <span className="text-white/30 text-xs font-medium">Hoos u dhaadhac</span>
        <ChevronDown size={20} className="text-white/30" />
      </div>
    </section>
  );
};

// =============================================
// PRODUCTS SECTION
// =============================================
const Products = () => {
  const products = [
    {
      name: 'Caagada 0.5 Litir',
      size: '500ml',
      image: '/bottle.png?v=2',
      desc: 'Ku habboon biyaha iyo cabitaannada. Fudud, adag, oo la qaadan karo.',
      specs: { material: 'PET (Food Grade)', weight: '18g', usage: 'Biyaha & Juuska' },
      badge: 'Ugu Caansan',
      badgeColor: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
      sizeBadgeBg: 'bg-sky-500',
    },
    {
      name: 'Caagada 1.0 Litir',
      size: '1000ml',
      image: '/bottle.png?v=2',
      desc: 'Ku habboon caanaha, biyaha iyo cabitaannada kale ee waaweyn.',
      specs: { material: 'PET (Food Grade)', weight: '28g', usage: 'Caanaha & Cabitaannada' },
      badge: 'Tayo Sare',
      badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      sizeBadgeBg: 'bg-emerald-500',
    },
  ];

  return (
    <section id="products" className="relative py-24 lg:py-32 bg-transparent overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 lg:mb-20">
          <Reveal>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-bold uppercase tracking-widest mb-6">
              <Package size={14} />
              Badeecadahayaga
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="text-3xl md:text-5xl font-black text-white mb-6 leading-tight">
              Caagado Nadiif Ah Oo{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-sky-400">Tayo Sare Leh</span>
            </h2>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="text-base text-white/70 leading-relaxed">
              Waxaan soo saarnaa caagado PET ah oo tayo leh, kuna habboon baahiyaha ganacsi ee kala duwan.
            </p>
          </Reveal>
        </div>

        {/* Products Grid */}
        <div className="grid md:grid-cols-2 gap-8 lg:gap-10 max-w-4xl mx-auto">
          {products.map((product, idx) => (
            <Reveal key={product.name} delay={0.1 + idx * 0.1}>
              <div className={`group relative bg-slate-950/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 transition-all duration-500 hover:-translate-y-2 flex flex-col justify-between h-full ${
                idx === 0 
                  ? 'hover:shadow-[0_0_30px_rgba(14,165,233,0.2)] hover:border-sky-500/30' 
                  : 'hover:shadow-[0_0_30px_rgba(16,185,129,0.2)] hover:border-emerald-500/30'
              }`}>
                <div>
                  {/* Badge */}
                  <div className="absolute top-4 right-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${product.badgeColor}`}>
                      {product.badge}
                    </span>
                  </div>

                  {/* Product Image */}
                  <div className="relative h-56 flex items-center justify-center mb-6">
                    <div className="absolute inset-0 bg-white/5 rounded-full blur-3xl" />
                    <Image
                      src={product.image}
                      alt={product.name}
                      width={220}
                      height={220}
                      className="relative z-10 w-auto h-full object-contain drop-shadow-xl group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>

                  {/* Size Badge */}
                  <div className={`inline-flex items-center gap-2 px-3 py-1 ${product.sizeBadgeBg} text-white rounded-full text-xs font-bold mb-4`}>
                    {product.size}
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-lg font-bold text-white mb-2">{product.name}</h3>
                  <p className="text-white/60 text-xs leading-relaxed mb-6">{product.desc}</p>
                </div>

                {/* Specs Table/List */}
                <div className="pt-4 border-t border-white/10 space-y-2">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-white/40 font-medium">Maaddada:</span>
                    <span className="text-white/90 font-bold">{product.specs.material}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-white/40 font-medium">Miisaanka:</span>
                    <span className="text-white/90 font-bold">{product.specs.weight}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-white/40 font-medium">Ujeeddada:</span>
                    <span className="text-white/90 font-bold">{product.specs.usage}</span>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

// =============================================
// SECTORS WE SERVE (QAYBAHA AAN U ADEEGNO)
// =============================================
const Sectors = () => {
  const sectors = [
    {
      title: 'Warshadaha Biyaha',
      desc: 'Caagado badbaado leh oo loogu talagalay biyaha la cabbo.',
      icon: <Droplets size={24} className="text-sky-400" />,
      badge: 'Biyaha'
    },
    {
      title: 'Cabitaannada & Juusaska',
      desc: 'Caagado loogu talagalay dhammaan noocyada juusaska.',
      icon: <Sparkles size={24} className="text-sky-400" />,
      badge: 'Juus'
    },
    {
      title: 'Warshadaha Caanaha',
      desc: 'Caagado ku habboon caanaha iyo waxyaabaha laga dhigo.',
      icon: <Milk size={24} className="text-emerald-400" />,
      badge: 'Caanaha'
    },
    {
      title: 'Nadiifinta & Kiimikada',
      desc: 'Caagado adag oo loogu talagalay saabuunta iyo kiimikooyinka.',
      icon: <ShieldCheck size={24} className="text-emerald-400" />,
      badge: 'Kiimikada'
    }
  ];

  return (
    <section id="sectors" className="relative py-24 lg:py-32 bg-transparent overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 lg:mb-20">
          <Reveal>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-bold uppercase tracking-widest mb-6">
              <CheckCircle size={14} />
              Adeegyada & Qaybaha
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="text-3xl md:text-5xl font-black text-white mb-6 leading-tight">
              Qaybaha aan u Adeegno{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-sky-400">Iyo Warshadaha</span>
            </h2>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="text-base text-white/70 leading-relaxed">
              Waxaan caagado u soo saarnaa warshadaha biyaha, cabitaannada, caanaha iyo agabka nadiifinta.
            </p>
          </Reveal>
        </div>

        {/* Sectors Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {sectors.map((sector, idx) => (
            <Reveal key={sector.title} delay={0.1 + idx * 0.1}>
              <div className={`group relative bg-slate-950/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 transition-all duration-500 hover:-translate-y-2 flex flex-col justify-between h-full ${
                idx < 2 
                  ? 'hover:shadow-[0_0_25px_rgba(14,165,233,0.15)] hover:border-sky-500/30' 
                  : 'hover:shadow-[0_0_25px_rgba(16,185,129,0.15)] hover:border-emerald-500/30'
              }`}>
                <div>
                  {/* Icon Wrapper */}
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    {sector.icon}
                  </div>
                  
                  <h3 className={`text-lg font-bold text-white mb-3 transition-colors ${idx < 2 ? 'group-hover:text-sky-400' : 'group-hover:text-emerald-400'}`}>
                    {sector.title}
                  </h3>
                  <p className="text-white/60 text-xs leading-relaxed">
                    {sector.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{sector.badge}</span>
                  <ChevronRight size={16} className={`text-white/30 group-hover:translate-x-1 transition-all ${idx < 2 ? 'group-hover:text-sky-400' : 'group-hover:text-emerald-400'}`} />
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

// =============================================
// ABOUT US SECTION
// =============================================
const AboutUs = () => {
  const values = [
    { icon: <Award size={24} />, title: 'Tayo', desc: 'Caagado tayo leh', hoverColor: 'group-hover:bg-sky-500 text-sky-400' },
    { icon: <Heart size={24} />, title: 'Kalsooni', desc: 'U adeegidda macaamiisha', hoverColor: 'group-hover:bg-sky-500 text-sky-400' },
    { icon: <Star size={24} />, title: 'Horumar', desc: 'Cusboonaysiinta wax-soo-saarka', hoverColor: 'group-hover:bg-emerald-500 text-emerald-400' },
    { icon: <ShieldCheck size={24} />, title: 'Ammaan', desc: 'Caagado u badbaado leh caafimaadka', hoverColor: 'group-hover:bg-emerald-500 text-emerald-400' },
  ];

  return (
    <section id="about" className="relative py-24 lg:py-32 bg-transparent overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Reveal>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-bold uppercase tracking-widest mb-6">
              <Eye size={14} />
              Naga Ogow
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="text-3xl md:text-5xl font-black text-white mb-6 leading-tight">
              Shirkad Ku Dhisan{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-sky-400">Tayo, Nadaafad & Kalsooni</span>
            </h2>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="text-base text-white/70 leading-relaxed">
              AN-Industory waxay soo saartaa caagado PET ah oo tayo iyo nadaafad leh, kuwaas oo loogu talagalay warshadaha kala duwan.
            </p>
          </Reveal>
        </div>

        {/* Mission & Vision */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <Reveal delay={0.1}>
            <div className="relative p-8 md:p-10 rounded-3xl bg-slate-950/40 backdrop-blur-xl border border-white/10 overflow-hidden group hover:shadow-[0_0_25px_rgba(14,165,233,0.15)] hover:border-sky-500/30 transition-all duration-500">
              <div className="absolute top-0 right-0 w-40 h-40 bg-sky-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
              <div className="relative z-10">
                <h3 className="text-lg font-bold uppercase tracking-widest mb-4 text-sky-400">Hadafkayaga</h3>
                <p className="text-xl md:text-2xl font-bold leading-relaxed text-white">
                  Inaan macaamiisheena siino caagado tayo leh oo badbaado ah, kuna yimaada qiimo macquul ah.
                </p>
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="relative p-8 md:p-10 rounded-3xl bg-slate-950/40 backdrop-blur-xl border border-white/10 overflow-hidden group hover:shadow-[0_0_25px_rgba(16,185,129,0.15)] hover:border-emerald-500/30 transition-all duration-500">
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-emerald-500/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
              <div className="relative z-10">
                <h3 className="text-lg font-bold uppercase tracking-widest mb-4 text-emerald-400">Aragtidayada</h3>
                <p className="text-xl md:text-2xl font-bold leading-relaxed text-white">
                  Inaan daboolno baahida caagadaha ee warshadaha kala duwan ee deegaanka.
                </p>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Values Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((value, idx) => (
            <Reveal key={value.title} delay={0.1 + idx * 0.1}>
              <div className={`text-center p-6 rounded-2xl bg-slate-950/40 backdrop-blur-xl border border-white/10 transition-all duration-500 group ${
                idx < 2
                  ? 'hover:shadow-[0_0_20px_rgba(14,165,233,0.15)] hover:border-sky-500/30'
                  : 'hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] hover:border-emerald-500/30'
              }`}>
                <div className={`w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center transition-all bg-white/5 border border-white/10 ${value.hoverColor} group-hover:text-white`}>
                  {value.icon}
                </div>
                <h4 className="text-lg font-bold text-white mb-2">{value.title}</h4>
                <p className="text-xs text-white/60">{value.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

// =============================================
// CONTACT SECTION
// =============================================
const Contact = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    // Simulate sending
    await new Promise((r) => setTimeout(r, 1500));
    setSending(false);
    setFormData({ name: '', email: '', message: '' });
    alert('Farriintaada waa la diray! Mahadsanid.');
  };

  const contactInfo = [
    { icon: <Phone size={20} />, label: 'Telefon', value: '+251 91 343 7741', href: 'tel:+251913437741' },
    { icon: <Mail size={20} />, label: 'Email', value: 'info@an-industory.com', href: 'mailto:info@an-industory.com' },
    { icon: <MapPin size={20} />, label: 'Goobta', value: 'Jigjiga, Somali Region, Ethiopia', href: '#' },
    { icon: <Clock size={20} />, label: 'Saacadaha', value: 'Subax 6:00 - Fiidkii 6:00', href: '#' },
  ];

  return (
    <section id="contact" className="relative py-24 lg:py-32 bg-transparent overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Reveal>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-bold uppercase tracking-widest mb-6">
              <Mail size={14} />
              Nala Soo Xiriir
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="text-3xl md:text-5xl font-black text-white mb-6 leading-tight">
              Waxaad Nala{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-sky-400">Soo Xiriiri Kartaa</span>
            </h2>
          </Reveal>
        </div>

        <div className="grid lg:grid-cols-5 gap-12 lg:gap-16">
          {/* Contact Info */}
          <div className="lg:col-span-2 space-y-6">
            {contactInfo.map((info, idx) => (
              <Reveal key={info.label} delay={0.1 + idx * 0.1}>
                <a
                  href={info.href}
                  className={`flex items-start gap-4 p-5 rounded-2xl bg-slate-950/40 backdrop-blur-xl border border-white/10 transition-all duration-500 group ${
                    idx % 2 === 0
                      ? 'hover:shadow-[0_0_20px_rgba(14,165,233,0.15)] hover:border-sky-500/30'
                      : 'hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] hover:border-emerald-500/30'
                  }`}
                >
                  <div className={`w-12 h-12 min-w-[48px] rounded-xl flex items-center justify-center transition-all bg-white/5 border border-white/10 group-hover:text-white ${
                    idx % 2 === 0 ? 'text-sky-400 group-hover:bg-sky-500' : 'text-emerald-400 group-hover:bg-emerald-500'
                  }`}>
                    {info.icon}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white/40 uppercase tracking-wider mb-1">{info.label}</div>
                    <div className="text-base font-semibold text-white">{info.value}</div>
                  </div>
                </a>
              </Reveal>
            ))}

            {/* WhatsApp Button */}
            <Reveal delay={0.5}>
              <a
                href="https://wa.me/251913437741"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl bg-green-500 hover:bg-green-600 text-white font-bold text-base transition-all shadow-lg shadow-green-500/20 hover:shadow-green-500/40 hover:-translate-y-0.5"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp-ka Noo Soo Dir
              </a>
            </Reveal>
          </div>

          {/* Contact Form */}
          <Reveal delay={0.2} className="lg:col-span-3">
            <form onSubmit={handleSubmit} className="p-8 md:p-10 rounded-3xl bg-slate-950/40 backdrop-blur-xl border border-white/10 shadow-[0_0_35px_rgba(16,185,129,0.05)]">
              <h3 className="text-xl font-bold text-white mb-6">Noo Soo Dir Fariin</h3>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-white/70 mb-2">Magacaaga</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-5 py-3.5 rounded-xl bg-slate-900/50 backdrop-blur-sm border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                    placeholder="Magacaaga geli..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white/70 mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-5 py-3.5 rounded-xl bg-slate-900/50 backdrop-blur-sm border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                    placeholder="email@tusaale.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white/70 mb-2">Fariintaada</label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={5}
                    className="w-full px-5 py-3.5 rounded-xl bg-slate-900/50 backdrop-blur-sm border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all resize-none"
                    placeholder="Fariintaada halkan ku qor..."
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={sending}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-sky-500 text-white font-bold text-base shadow-lg shadow-sky-500/15 hover:shadow-sky-500/35 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send size={18} />
                      U Dir Fariinta
                    </>
                  )}
                </button>
              </div>
            </form>
          </Reveal>
        </div>
      </div>
    </section>
  );
};

// =============================================
// FOOTER
// =============================================
const Footer = () => {
  return (
    <footer className="bg-slate-950/60 backdrop-blur-md text-white pt-16 pb-8 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-sky-500 flex items-center justify-center">
                <span className="text-white text-sm font-black tracking-tighter">AN</span>
              </div>
              <div>
                <div className="text-lg font-black">AN-Industory</div>
                <div className="text-[9px] font-bold uppercase tracking-[0.25em] text-sky-500">Plastic Bottles Factory</div>
              </div>
            </div>
            <p className="text-white/60 max-w-sm leading-relaxed mb-6">
              Warshad soo saarta caagado PET ah oo tayo iyo badbaado leh.
            </p>
            <div className="flex gap-3">
              <a href="tel:+251913437741" className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-emerald-500 flex items-center justify-center transition-colors">
                <Phone size={18} />
              </a>
              <a href="mailto:info@an-industory.com" className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-emerald-500 flex items-center justify-center transition-colors">
                <Mail size={18} />
              </a>
              <a href="https://wa.me/251913437741" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-green-500 flex items-center justify-center transition-colors">
                <Globe size={18} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-sm uppercase tracking-widest text-slate-400 mb-6">Bogagga</h4>
            <ul className="space-y-3">
              <li><Link href="#products" className="text-slate-500 hover:text-emerald-400 transition-colors">Badeecadaha</Link></li>
              <li><Link href="#about" className="text-slate-500 hover:text-emerald-400 transition-colors">Naga Ogow</Link></li>
              <li><Link href="#contact" className="text-slate-500 hover:text-emerald-400 transition-colors">Nala Xiriir</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-bold text-sm uppercase tracking-widest text-slate-400 mb-6">Xiriirka</h4>
            <ul className="space-y-3 text-slate-500">
              <li className="flex items-center gap-2"><MapPin size={14} className="text-emerald-500" /> Jigjiga, Ethiopia</li>
              <li className="flex items-center gap-2"><Phone size={14} className="text-emerald-500" /> +251 91 343 7741</li>
              <li className="flex items-center gap-2"><Mail size={14} className="text-emerald-500" /> info@an-industory.com</li>
              <li className="flex items-center gap-2"><Clock size={14} className="text-emerald-500" /> 6:00 AM - 6:00 PM</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-600 text-sm">&copy; {new Date().getFullYear()} AN-Industory. Xuquuqda oo dhan waa ay xifdisan yihiin.</p>
          <Link href="/login" className="text-slate-700 hover:text-slate-500 text-xs transition-colors">
            Maamulka
          </Link>
        </div>
      </div>
    </footer>
  );
};


// =============================================
// MAIN PAGE
// =============================================
export default function HomePage() {
  return (
    <main className="min-h-screen bg-white dark:bg-slate-950 font-sans selection:bg-emerald-500/20 selection:text-emerald-600 overflow-x-hidden">
      <Navbar />
      <Hero />
      
      {/* Sub-hero background wrapper with homepage.png */}
      <div className="relative bg-slate-950 overflow-hidden">
        {/* Parallax Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-25 pointer-events-none" 
          style={{ 
            backgroundImage: "url('/homepage.png')",
            backgroundAttachment: 'fixed'
          }} 
        />
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/90 to-slate-950 pointer-events-none" />
        
        {/* Content Container */}
        <div className="relative z-10">
          <Products />
          <Sectors />
          <AboutUs />
          <Contact />
          <Footer />
        </div>
      </div>
    </main>
  );
}