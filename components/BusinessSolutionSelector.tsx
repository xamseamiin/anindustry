'use client';

import React, { useState } from 'react';
import { Factory, Store, Briefcase, ChevronRight, ArrowRight, Package, Truck, LineChart } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

type Tab = 'FACTORY' | 'SHOP' | 'PROJECT';

export default function BusinessSolutionSelector() {
    const [activeTab, setActiveTab] = useState<Tab>('FACTORY');

    const content = {
        FACTORY: {
            title: "Industry & Manufacturing",
            description: "Manage your factory workflow from raw materials to finished products seamlessly.",
            features: [
                "Cost Per Unit Calculation",
                "Workshop & Employee Management",
                "Raw Materials & Inventory Tracking"
            ],
            ctaLink: "/signup?plan=FACTORIES_ONLY",
            icon: Factory,
            gradient: "from-blue-600 to-cyan-500",
            image: "/factory-preview.png"
        },
        SHOP: {
            title: "Stores & Wholesale",
            description: "Modern POS system for inventory management and customer debt tracking.",
            features: [
                "Fast Point of Sale (POS)",
                "Debt & Cash Management",
                "Wholesale & Retail (Multi-Price)"
            ],
            ctaLink: "/signup?plan=SHOPS_ONLY",
            icon: Store,
            gradient: "from-cyan-500 to-blue-500",
            image: "/shop-preview.png"
        },
        PROJECT: {
            title: "Projects & Construction",
            description: "Track costs, agreements, and progress for projects anywhere, anytime.",
            features: [
                "Project Budget Management",
                "Contracts & Payment Tracking",
                "Material Usage & Labor Costs"
            ],
            ctaLink: "/signup?plan=PROJECTS_ONLY",
            icon: Briefcase,
            gradient: "from-green-500 to-emerald-600",
            image: "/project-preview.png"
        }
    };

    const activeContent = content[activeTab];
    const ActiveIcon = activeContent.icon;

    return (
        <section className="py-20 bg-gray-50 dark:bg-gray-900/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                <div className="text-center mb-12">
                    <h2 className="text-primary font-bold tracking-wide uppercase text-sm mb-3">Choose Your Solution</h2>
                    <h3 className="text-3xl md:text-5xl font-extrabold text-darkGray dark:text-white">One System. Three Solutions.</h3>
                </div>

                {/* Tabs */}
                <div className="flex flex-wrap justify-center gap-4 mb-12">
                    <button
                        onClick={() => setActiveTab('FACTORY')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all duration-300 ${activeTab === 'FACTORY'
                            ? 'bg-blue-600 text-white shadow-lg scale-105'
                            : 'bg-white dark:bg-gray-800 text-gray-500 hover:bg-gray-100 hover:text-darkGray'
                            }`}
                    >
                        <Factory size={20} /> Factories
                    </button>
                    <button
                        onClick={() => setActiveTab('SHOP')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all duration-300 ${activeTab === 'SHOP'
                            ? 'bg-orange-500 text-white shadow-lg scale-105'
                            : 'bg-white dark:bg-gray-800 text-gray-500 hover:bg-gray-100 hover:text-darkGray'
                            }`}
                    >
                        <Store size={20} /> Stores
                    </button>
                    <button
                        onClick={() => setActiveTab('PROJECT')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all duration-300 ${activeTab === 'PROJECT'
                            ? 'bg-green-600 text-white shadow-lg scale-105'
                            : 'bg-white dark:bg-gray-800 text-gray-500 hover:bg-gray-100 hover:text-darkGray'
                            }`}
                    >
                        <Briefcase size={20} /> Projects
                    </button>
                </div>

                {/* Dynamic Content Card */}
                <div className="relative bg-white dark:bg-gray-800 rounded-3xl overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-700 transition-all duration-500">
                    <div className="grid lg:grid-cols-2">
                        {/* Content Side */}
                        <div className="p-8 lg:p-12 flex flex-col justify-center animate-fade-in">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 bg-gradient-to-br ${activeContent.gradient} text-white shadow-lg`}>
                                <ActiveIcon size={28} />
                            </div>

                            <h3 className="text-3xl md:text-4xl font-bold text-darkGray dark:text-white mb-4">
                                {activeContent.title}
                            </h3>
                            <p className="text-xl text-mediumGray dark:text-gray-400 mb-8 leading-relaxed">
                                {activeContent.description}
                            </p>

                            <ul className="space-y-4 mb-8">
                                {activeContent.features.map((feature, i) => (
                                    <li key={i} className="flex items-center gap-3 text-darkGray dark:text-gray-200 font-medium">
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-${activeTab === 'SHOP' ? 'orange' : activeTab === 'PROJECT' ? 'green' : 'blue'}-500`}>
                                            <ArrowRight size={14} strokeWidth={3} />
                                        </div>
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            <Link
                                href={activeContent.ctaLink}
                                className={`inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-lg text-white transition-transform hover:-translate-y-1 bg-gradient-to-r ${activeContent.gradient} shadow-lg shadow-blue-500/20`}
                            >
                                Bilow Hadda <ChevronRight size={20} />
                            </Link>
                        </div>

                        {/* Visual Side (Mockup placeholder area) */}
                        <div className="hidden lg:flex items-center justify-center p-0 bg-gray-900 relative overflow-hidden h-full min-h-[400px]">
                            <div className="absolute inset-0 z-0">
                                <Image
                                    src={activeContent.image}
                                    alt={activeContent.title}
                                    fill
                                    className="object-cover opacity-90 transition-opacity duration-500"
                                    sizes="(max-width: 768px) 100vw, 50vw"
                                />
                            </div>
                            {/* Overlay gradient for readability if needed, though clean image is better. Adding subtle one. */}
                            <div className="absolute inset-0 bg-gradient-to-l from-transparent to-gray-900/10 z-10"></div>
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
}
