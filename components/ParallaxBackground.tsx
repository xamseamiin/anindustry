'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

export default function ParallaxBackground() {
    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    // Create multiple parallax layers with different speeds
    const y1 = useTransform(scrollYProgress, [0, 1], [0, -500]);
    const y2 = useTransform(scrollYProgress, [0, 1], [0, 300]);
    const y3 = useTransform(scrollYProgress, [0, 1], [0, -200]);
    const rotate1 = useTransform(scrollYProgress, [0, 1], [0, 180]);
    const rotate2 = useTransform(scrollYProgress, [0, 1], [0, -90]);

    return (
        <div ref={containerRef} className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            {/* Abstract shape 1 */}
            <motion.div
                style={{ y: y1, rotate: rotate1 }}
                className="absolute top-[10%] left-[5%] w-64 h-64 rounded-full border-2 border-primary/5 dark:border-primary/10 opacity-50 blur-xl"
            />

            {/* Abstract shape 2 */}
            <motion.div
                style={{ y: y2, rotate: rotate2 }}
                className="absolute top-[40%] right-[10%] w-96 h-96 rounded-full bg-secondary/5 dark:bg-secondary/10 blur-[100px]"
            />

            {/* Abstract shape 3 */}
            <motion.div
                style={{ y: y3 }}
                className="absolute bottom-[20%] left-[20%] w-48 h-48 bg-primary/5 dark:bg-primary/10 rounded-3xl rotate-45 blur-2xl"
            />

            {/* Dot grid pattern overlay */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03] dark:opacity-[0.05]"></div>
        </div>
    );
}
