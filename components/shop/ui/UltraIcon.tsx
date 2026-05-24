'use client';

import React from 'react';

interface UltraIconProps {
    icon: React.ElementType;
    variant: 'primary' | 'secondary' | 'accent' | 'neutral' | 'danger';
    size?: number; // Icon size, default 28
}

/**
 * --- BRANDED ULTRA ICON ---
 * Uses strict Project Colors: Primary (Blue), Secondary (Green), Accent (Orange).
 * Added 'danger' variant for alerts.
 */
export default function UltraIcon({ icon: Icon, variant, size = 28 }: UltraIconProps) {

    // Strict Project Colors
    const styles = {
        primary: { // e.g., Revenue / Main - BLUE (#3498DB)
            glow: "bg-[#3498DB]",
            gradient: "from-[#3498DB]/20 to-[#2980B9]/20",
            border: "border-[#3498DB]/30",
            icon: "text-[#3498DB]"
        },
        secondary: { // e.g., Profit / Success - GREEN (#2ECC71)
            glow: "bg-[#2ECC71]",
            gradient: "from-[#2ECC71]/20 to-[#27AE60]/20",
            border: "border-[#2ECC71]/30",
            icon: "text-[#2ECC71]"
        },
        accent: { // e.g., Inventory / Warning - ORANGE (#F39C12)
            glow: "bg-[#F39C12]",
            gradient: "from-[#F39C12]/20 to-[#E67E22]/20",
            border: "border-[#F39C12]/30",
            icon: "text-[#F39C12]"
        },
        neutral: { // e.g., Orders / General - GRAY/SLATE
            glow: "bg-gray-500",
            gradient: "from-gray-500/20 to-gray-600/20",
            border: "border-gray-500/30",
            icon: "text-gray-400"
        },
        danger: { // e.g., Errors / Refund - RED
            glow: "bg-red-500",
            gradient: "from-red-500/20 to-red-600/20",
            border: "border-red-500/30",
            icon: "text-red-500"
        }
    };

    const s = styles[variant] || styles['neutral'];

    return (
        <div className="relative flex items-center justify-center w-16 h-16 group flex-shrink-0">
            {/* 1. Ambient Glow (Behind) */}
            <div className={`absolute inset-0 rounded-2xl ${s.glow} blur-[20px] opacity-10 group-hover:opacity-30 transition-opacity duration-500`} />

            {/* 2. Glass Container */}
            <div className={`
                relative w-full h-full rounded-2xl 
                bg-gradient-to-br ${s.gradient}
                backdrop-blur-xl
                border ${s.border}
                shadow-[inset_0_0_20px_rgba(255,255,255,0.05)]
                flex items-center justify-center
                transition-transform duration-300 group-hover:scale-105
            `}>
                {/* 3. Inner Shine (Top Left) */}
                <div className="absolute top-0 left-0 w-full h-full rounded-2xl bg-gradient-to-br from-white/10 to-transparent opacity-50" />

                {/* 4. The Icon (floating) */}
                <Icon
                    size={size}
                    strokeWidth={1.5}
                    className={`
                      ${s.icon} 
                      drop-shadow-[0_0_8px_rgba(255,255,255,0.2)] 
                      transition-all duration-300 
                      group-hover:rotate-[10deg] group-hover:scale-110
                    `}
                />
            </div>
        </div>
    );
};
