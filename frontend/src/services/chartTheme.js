export const getChartColors = (isDark) => {
  return {
    grid: isDark ? '#1e293b' : '#e2e8f0', // slate-800 vs slate-200
    axisText: isDark ? '#64748b' : '#94a3b8', // slate-500 vs slate-400
    tooltipBg: isDark ? '#0f172a' : '#ffffff', // slate-900 vs white
    tooltipBorder: isDark ? '#334155' : '#e2e8f0', // slate-700 vs slate-200
    tooltipText: isDark ? '#f8fafc' : '#0f172a', // slate-50 vs slate-900
    legendText: isDark ? '#cbd5e1' : '#475569', // slate-300 vs slate-600
    primary: '#3b82f6', // blue-500
    emerald: '#10b981', // emerald-500
    indigo: '#6366f1', // indigo-500
    rose: '#f43f5e', // rose-500
    amber: '#f59e0b', // amber-500
    pieColors: ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#6366f1', '#f43f5e']
  };
};
