import React from 'react';

export default function Badge({ children, variant = 'info', className = '' }) {
  const variants = {
    success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
    danger: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20',
    info: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20',
    indigo: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20',
    secondary: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase ${variants[variant] || variants.info} ${className}`}>
      {children}
    </span>
  );
}
