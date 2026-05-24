'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, ArrowRight } from 'lucide-react';

const LandingNavbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { name: 'Astaamaha', href: '/#features' },
        { name: 'Sida uu u Shaqeeyo', href: '/#how-it-works' },
        { name: 'Xalka', href: '/#solutions' },
        { name: 'Qiimaha', href: '/#pricing' },
        { name: 'Contact', href: '/contact' },
        { name: 'About', href: '/about' },
    ];

    return (
        <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-sm shadow-sm py-3 dark:bg-gray-900/95' : 'bg-white/90 backdrop-blur-sm py-5 dark:bg-gray-900/90'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center">
                    {/* Logo Section */}
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className={`text-2xl font-extrabold tracking-tight flex items-center gap-1 text-darkGray dark:text-white`}>
                            Rev<span className="text-secondary">lo</span>
                        </div>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-6">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                className={`text-sm font-bold hover:text-primary transition-colors hover:scale-105 transform duration-200 text-darkGray dark:text-gray-300`}
                            >
                                {link.name}
                            </Link>
                        ))}
                        <Link href="/download" className="text-sm font-bold hover:text-primary transition-colors text-mediumGray dark:text-gray-300">
                            Desktop App
                        </Link>
                    </div>

                    {/* CTA Buttons */}
                    <div className="hidden md:flex items-center gap-4">
                        <Link href="/login" className={`text-sm font-bold hover:text-primary transition-colors text-darkGray dark:text-white`}>
                            Log In
                        </Link>
                        <Link href="/signup" className="relative overflow-hidden bg-primary text-white px-6 py-2.5 rounded-full text-sm font-bold shadow-lg hover:shadow-primary/40 hover:-translate-y-0.5 transition-all group">
                            <span className="relative z-10 flex items-center gap-2">Bilaaw Hadda <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" /></span>
                            <div className="absolute inset-0 bg-secondary opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center">
                        <button onClick={() => setIsOpen(!isOpen)} className="text-darkGray dark:text-white hover:text-primary focus:outline-none p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                            {isOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 absolute w-full shadow-xl animate-fade-in-up">
                    <div className="px-4 py-6 space-y-4">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                className="block text-lg font-bold text-darkGray dark:text-gray-200 hover:text-primary px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                onClick={() => setIsOpen(false)}
                            >
                                {link.name}
                            </Link>
                        ))}
                        <Link href="/download" className="block text-lg font-bold text-darkGray dark:text-gray-200 hover:text-primary px-4 py-2">Desktop App</Link>
                        <hr className="border-gray-100 dark:border-gray-800 my-2" />
                        <div className="flex flex-col gap-3 px-2">
                            <Link href="/login" className="w-full text-center text-darkGray font-bold py-3 bg-gray-100 rounded-xl">Log In</Link>
                            <Link href="/signup" className="w-full text-center bg-primary text-white py-3 rounded-xl font-bold shadow-lg">Bilaaw Hadda</Link>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default LandingNavbar;
