import React from 'react';

export default function Input({ className = '', label = '', error = '', icon: Icon, ...props }) {
  return (
    <div className="space-y-1.5 w-full text-left">
      {label && (
        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 h-4 w-4 pointer-events-none" />
        )}
        <input
          className={`input-surface w-full ${Icon ? 'pl-11' : 'pl-4'} pr-4 ${
            error ? 'border-rose-500 focus:border-rose-500 focus:shadow-[0_0_0_2px_rgba(239,68,68,0.3)]' : ''
          } ${className}`}
          {...props}
        />
      </div>
      {error && (
        <p className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold">
          {error}
        </p>
      )}
    </div>
  );
}
