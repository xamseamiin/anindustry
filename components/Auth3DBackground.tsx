'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Play, Pause, ChevronRight, ChevronLeft, ShieldCheck, BarChart3, Users, Zap, Globe, Bell, Server } from 'lucide-react';

// Reuse existing assets for multiple concepts to expand content
const slides = [
    {
        id: 1,
        image: '/assets/signup.png',
        title: 'IS DIWAANGALI',
        desc: 'Ku biir kumanaan ganacsi oo casri ah.',
        icon: <Users className="text-secondary" />,
        color: 'text-secondary'
    },
    {
        id: 2,
        image: '/assets/growth.png',
        title: 'KORIIMO',
        desc: 'Xogtaada maaliyadeed si toos ah ula soco (+125%).',
        icon: <BarChart3 className="text-primary" />,
        color: 'text-primary'
    },
    {
        id: 3,
        image: '/assets/team.png',
        title: 'KOOXDA',
        desc: 'Wada shaqeyn aan xuduud lahayn.',
        icon: <Users className="text-purple-400" />,
        color: 'text-purple-400'
    },
    {
        id: 4,
        image: '/assets/security.png',
        title: 'AMNIGA',
        desc: 'Xogtaadu way dhawrsan tahay mar walba.',
        icon: <ShieldCheck className="text-green-400" />,
        color: 'text-green-400'
    },
    // Creative reuse for new concepts
    {
        id: 5,
        image: '/assets/growth.png', // Reusing Growth for "AI"
        title: 'AI POWERED',
        desc: 'Falanqeyn qoto dheer oo caqli-gal ah.',
        icon: <Zap className="text-yellow-400" />,
        color: 'text-yellow-400'
    },
    {
        id: 6,
        image: '/assets/team.png', // Reusing Team for "Global"
        title: 'GLOBAL',
        desc: 'Ganacsigaaga adduunka oo dhan gaarsii.',
        icon: <Globe className="text-blue-400" />,
        color: 'text-blue-400'
    },
    {
        id: 7,
        image: '/assets/security.png', // Reusing Security for "Cloud"
        title: 'CLOUD',
        desc: 'Kaydkaagu waa daruuraha, meel walba ka gal.',
        icon: <Server className="text-cyan-400" />,
        color: 'text-cyan-400'
    }
];

const Auth3DBackground = () => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isPlaying) {
            interval = setInterval(() => {
                setProgress((prev) => {
                    if (prev >= 100) {
                        setCurrentSlide((curr) => (curr + 1) % slides.length);
                        return 0;
                    }
                    return prev + 0.5; // Slower speed for better reading
                });
            }, 30);
        }
        return () => clearInterval(interval);
    }, [isPlaying, currentSlide]);

    const handleNext = () => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
        setProgress(0);
    };

    const handlePrev = () => {
        setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
        setProgress(0);
    };

    return (
        <div className="absolute inset-0 w-full h-full bg-gray-900 overflow-hidden flex flex-col perspective-1000">
            {/* 3D Slideshow Container */}
            <div className="relative flex-1 w-full h-full transform-style-3d">
                {slides.map((slide, index) => (
                    <div
                        key={slide.id}
                        className={`absolute inset-0 transition-all duration-[1500ms] ease-in-out ${index === currentSlide ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-110 rotate-1'
                            }`}
                    >
                        {/* Background Image with Parallax/Zoom Effect */}
                        <div className="relative w-full h-full overflow-hidden">
                            <Image
                                src={slide.image}
                                alt={slide.title}
                                fill
                                className={`object-cover object-center transform transition-transform duration-[20000ms] ease-linear ${index === currentSlide && isPlaying ? 'scale-125' : 'scale-100'
                                    }`}
                                priority={index === 0}
                            />
                            {/* Cinema Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent" />
                            <div className="absolute inset-0 bg-gradient-to-r from-gray-900/40 to-transparent" />
                        </div>

                        {/* 3D Floating Text Content - "Simulated Embedded Text" */}
                        <div className="absolute bottom-32 left-0 right-0 px-12 text-center z-10 transform translate-z-10">
                            {/* Floating 3D Title */}
                            <h1
                                className={`text-6xl md:text-7xl font-black mb-4 tracking-tighter drop-shadow-2xl ${slide.color} opacity-90`}
                                style={{
                                    textShadow: '0 10px 30px rgba(0,0,0,0.5)',
                                    transform: 'perspective(500px) rotateX(10deg)'
                                }}
                            >
                                {slide.title}
                            </h1>

                            <div className="inline-flex items-center justify-center p-4 bg-white/5 backdrop-blur-xl rounded-full mb-6 border border-white/10 shadow-2xl animate-bounce-slow">
                                {React.cloneElement(slide.icon as React.ReactElement, { size: 40 })}
                            </div>

                            <p className="text-xl text-gray-200 max-w-lg mx-auto leading-relaxed font-light tracking-wide bg-black/30 backdrop-blur-sm p-4 rounded-xl border border-white/5">
                                {slide.desc}
                            </p>
                        </div>
                    </div>
                ))}

                {/* Play/Pause Control */}
                <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="absolute top-8 right-8 p-4 rounded-full bg-white/5 backdrop-blur-md text-white/70 hover:bg-white/20 hover:text-white transition-all border border-white/10 z-50 group"
                >
                    {isPlaying ? <Pause size={24} className="group-hover:scale-110 transition-transform" /> : <Play size={24} className="ml-1 group-hover:scale-110 transition-transform" />}
                </button>
            </div>

            {/* Cinematic Progress Bar */}
            <div className="relative z-20 h-1 bg-gray-800 w-full">
                <div
                    className="h-full bg-gradient-to-r from-secondary to-primary shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all duration-100 ease-linear"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Controls & Indicators */}
            <div className="relative z-20 bg-gray-900/90 backdrop-blur-xl px-8 py-6 border-t border-gray-800 flex justify-between items-center">
                <div className="flex gap-1.5">
                    {slides.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => { setCurrentSlide(idx); setProgress(0); }}
                            className={`h-1.5 rounded-full transition-all duration-500 ${currentSlide === idx ? 'w-10 bg-white shadow-glow' : 'w-2 bg-gray-600 hover:bg-gray-400'
                                }`}
                        />
                    ))}
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={handlePrev}
                        className="p-3 rounded-full border border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800 hover:border-gray-500 transition-all active:scale-95"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <button
                        onClick={handleNext}
                        className="p-3 rounded-full bg-white text-gray-900 hover:bg-gray-200 transition-all shadow-lg hover:shadow-white/20 active:scale-95"
                    >
                        <ChevronRight size={24} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Auth3DBackground;
