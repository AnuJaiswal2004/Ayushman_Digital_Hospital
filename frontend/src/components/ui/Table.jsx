import React from 'react';

export default function Table({ headers = [], children, className = '' }) {
  return (
    <div className="overflow-x-auto w-full border border-slate-200 dark:border-slate-800 rounded-2xl">
      <table className={`w-full text-xs sm:text-sm text-left border-collapse ${className}`}>
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] sm:text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-900/40">
            {headers.map((h, i) => (
              <th key={i} className="py-3.5 px-5">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-600 dark:text-slate-350">
          {children}
        </tbody>
      </table>
    </div>
  );
}
