import React from 'react';
import Image from 'next/image';

const RevloLoader: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center p-8 rounded-2xl">
            <div className="relative w-32 h-32 md:w-40 md:h-40 animate-pulse-slow">
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse"></div>

                {/* Logo Container - Using mix-blend-mode to hide black background if possible, or just framing it nicely */}
                <div className="relative z-10 w-full h-full flex items-center justify-center overflow-hidden rounded-2xl shadow-lg bg-black border border-gray-800">
                    <Image
                        src="/revlo-logo.png"
                        alt="Revlo Loading"
                        width={150}
                        height={150}
                        className="object-contain w-full h-full animate-float opacity-90 mix-blend-screen"
                    />
                </div>
            </div>

            <div className="mt-6 flex flex-col items-center gap-2">
                {/* Stylish Loading Bar */}
                <div className="h-1 w-32 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-1/3 animate-shimmer-slide"></div>
                </div>
                <p className="text-gray-500 dark:text-gray-400 font-medium text-xs tracking-[0.2em] uppercase animate-pulse">Loading</p>
            </div>

            <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        @keyframes shimmer-slide {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(300%); }
        }
        .animate-shimmer-slide {
            animation: shimmer-slide 1.5s infinite linear;
        }
        @keyframes pulse-slow {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.9; transform: scale(0.98); }
        }
        .animate-pulse-slow {
            animation: pulse-slow 3s ease-in-out infinite;
        }
      `}</style>
        </div>
    );
};

export default RevloLoader;
