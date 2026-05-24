import React from 'react';

interface BrandProps {
  isCollapsed?: boolean;
  className?: string;
}

const Brand: React.FC<BrandProps> = ({ isCollapsed, className = "" }) => {
  if (isCollapsed) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="w-10 h-10 bg-brand-gradient rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
          <span className="text-white text-xl font-black tracking-tighter">AN</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="w-10 h-10 bg-brand-gradient rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
        <span className="text-white text-xl font-black tracking-tighter">AN</span>
      </div>
      <div className="flex flex-col leading-none">
        <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
          AN
        </span>
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
          Industory
        </span>
      </div>
    </div>
  );
};

export default Brand;
