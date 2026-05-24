'use client';

import { motion, useScroll, useSpring } from 'framer-motion';

export default function ScrollProgressBar() {
    const { scrollYProgress } = useScroll();

    // Smooth out the progress bar animation
    const scaleX = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    return (
        <motion.div
            className="fixed top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-secondary to-primary z-[100] origin-left"
            style={{ scaleX }}
        />
    );
}
