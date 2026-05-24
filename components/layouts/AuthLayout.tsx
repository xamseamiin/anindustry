// components/layouts/AuthLayout.tsx
import React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  bgColorClass: string; // Tusaale: "from-primary to-blue-500"
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle, bgColorClass }) => {
  return (
    <div className={`min-h-screen ${bgColorClass} flex items-center justify-center p-4 md:p-8 overflow-hidden relative`}>
      {/* Animated Background Shapes */}
      <div className="absolute inset-0 z-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-40 h-40 bg-white rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-bounce-slow"></div>
        <div className="absolute bottom-1/3 right-1/3 w-60 h-60 bg-secondary rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-bounce-fast"></div>
        <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-accent rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-bounce-slowest"></div>
      </div>

      {/* Blurred Background from Home Page - This is conceptual. Actual blur will be handled by CSS/JS */}
      {/* For now, this is just to create the visual effect on the Login/Signup page itself */}
      {/* The true 'blur behind' requires a different Next.js layout approach not just a component */}
      {/* We will simulate the blurred background look within this component for now. */}
      <div className="absolute inset-0 z-0 bg-cover bg-center" 
           style={{ 
             backgroundImage: 'url(/images/hero-dashboard-preview.svg)', // Use a relevant image or a placeholder
             filter: 'blur(10px) brightness(0.7)', // Blur effect
             transform: 'scale(1.1)' // Slightly zoom in to hide edges
           }}>
      </div>
      <div className="absolute inset-0 z-0 bg-darkGray opacity-70"></div> {/* Overlay to darken and enhance blur */}


      {/* Auth Card */}
      <div className="relative bg-white dark:bg-gray-800 p-8 md:p-10 rounded-xl shadow-2xl w-full max-w-md border border-lightGray dark:border-gray-700 animate-fade-in-up z-10">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-extrabold text-darkGray dark:text-gray-100 mb-3">
            Revl<span className="text-secondary">.</span>
          </h1>
          <p className="text-xl font-semibold text-mediumGray dark:text-gray-300">{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;