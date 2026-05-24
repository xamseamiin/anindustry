'use client';

import React from 'react';
import Link from 'next/link';
import { Mail, Phone, MapPin } from 'lucide-react';

const LandingFooter = () => (
    <footer className="bg-darkGray text-white py-16 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="col-span-1 md:col-span-2">
                <Link href="/" className="text-3xl font-bold mb-6 block">Rev<span className="text-secondary">lo</span></Link>
                <p className="text-gray-400 max-w-sm mb-6 leading-relaxed">
                    Nidaamka koowaad ee ERP ee loogu talagalay horumarinta ganacsiga Bariga Afrika.
                    Tayada, Hufnaanta, iyo Tiknoolajiyadda.
                </p>
            </div>

            <div>
                <h4 className="font-bold text-lg mb-6 text-white border-b border-gray-700 pb-2 inline-block">Bogagga</h4>
                <ul className="space-y-3 text-gray-400">
                    <li><Link href="/" className="hover:text-primary transition-colors">Home</Link></li>
                    <li><Link href="/about" className="hover:text-primary transition-colors">About Us</Link></li>
                    <li><Link href="/contact" className="hover:text-primary transition-colors">Contact Us</Link></li>
                    <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                    <li><Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
                </ul>
            </div>

            <div>
                <h4 className="font-bold text-lg mb-6 text-white border-b border-gray-700 pb-2 inline-block">Nala Xiriir</h4>
                <ul className="space-y-3 text-gray-400">
                    <li className="flex items-center gap-3"><Mail size={18} className="text-primary" /> info@revlo.com</li>
                    <li className="flex items-center gap-3"><Phone size={18} className="text-primary" /> +251 929 475 332</li>
                    <li className="flex items-center gap-3"><MapPin size={18} className="text-primary" /> Jigjiga, Somali Region</li>
                </ul>
            </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pt-8 border-t border-gray-800 text-center text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} Revlo. Xuquuqda oo dhan waa ay xifdisan tahay.
        </div>
    </footer>
);

export default LandingFooter;
