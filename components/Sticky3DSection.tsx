'use client';

import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

interface Props {
    children: React.ReactNode;
    className?: string;
    index?: number;
}

export const Sticky3DSection = ({ children, className = "", index = 0 }: Props) => {
    const container = useRef(null);

    // useScroll tracks the element's position in the viewport
    const { scrollYProgress } = useScroll({
        target: container,
        offset: ["start start", "end start"]
    });

    // As the user scrolls down (and this section is sticky/fixed at top),
    // we animate it "away" into the background.

    // Scale down from 1 to 0.85
    const scale = useTransform(scrollYProgress, [0, 1], [1, 0.85]);

    // Fade out slightly to focus on the incoming card
    const opacity = useTransform(scrollYProgress, [0, 1], [1, 0.6]);

    // Translate Y slightly to create parallax feeling? No, sticking is enough.

    return (
        // 'sticky top-0' is the key here. It makes sections stack.
        // On mobile, we use 'relative' and 'h-auto' to ensure tall content (like Pricing) isn't clipped.
        // On lg screens, we switch to 'sticky' and 'h-screen' for the 3D stacking effect.
        <div
            ref={container}
            className={`relative lg:sticky top-0 w-full flex flex-col items-center justify-center border-t-2 border-white/5 shadow-2xl min-h-screen h-auto lg:min-h-screen ${className}`}
            style={{ zIndex: index }}
        >
            <motion.div
                style={{ scale, opacity }}
                className="w-full h-full relative"
            >
                {children}
            </motion.div>
        </div>
    );
};
