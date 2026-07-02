import React from 'react';

export default function Button({ children, className = '', variant = 'primary', ...props }) {
  const baseStyle = 'px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer shadow-sm hover:shadow active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2';
  
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/10 focus-visible:ring-blue-500',
    emerald: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/10 focus-visible:ring-emerald-500',
    indigo: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/10 focus-visible:ring-indigo-500',
    secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 focus-visible:ring-slate-500',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/10 focus-visible:ring-rose-500',
    outline: 'bg-transparent border border-slate-200 hover:bg-slate-50 text-slate-700 dark:border-slate-800 dark:hover:bg-slate-800/60 dark:text-slate-300 focus-visible:ring-blue-500'
  };

  return (
    <button 
      className={`${baseStyle} ${variants[variant] || variants.primary} ${className}`} 
      {...props}
    >
      {children}
    </button>
  );
}
