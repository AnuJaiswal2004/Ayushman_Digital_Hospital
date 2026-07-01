import React from 'react';

export default function Select({ label = '', error = '', options = [], className = '', ...props }) {
  return (
    <div className="space-y-1.5 w-full text-left">
      {label && (
        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
          {label}
        </label>
      )}
      <select
        className={`input-surface w-full cursor-pointer text-slate-700 dark:text-slate-200 ${
          error ? 'border-rose-500 focus:border-rose-500' : ''
        } ${className}`}
        {...props}
      >
        {options.map((opt, i) => (
          <option 
            key={i} 
            value={opt.value} 
            className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
          >
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold">
          {error}
        </p>
      )}
    </div>
  );
}
