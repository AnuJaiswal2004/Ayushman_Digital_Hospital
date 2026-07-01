import React from 'react';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { TrendingUp, DollarSign, CalendarCheck } from 'lucide-react';
import { useTheme } from '../../../services/theme.js';
import { getChartColors } from '../../../services/chartTheme.js';
import Card from '../../../components/ui/Card.jsx';

export default function AnalyticsTab() {
  const [theme] = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const colors = getChartColors(isDark);

  // Mock registration trends
  const registrationData = [
    { name: 'Jan', patients: 35 },
    { name: 'Feb', patients: 58 },
    { name: 'Mar', patients: 82 },
    { name: 'Apr', patients: 115 },
    { name: 'May', patients: 180 },
    { name: 'Jun', patients: 247 },
  ];

  // Mock revenue stats
  const revenueData = [
    { name: 'Jan', revenue: 95000 },
    { name: 'Feb', revenue: 120000 },
    { name: 'Mar', revenue: 155000 },
    { name: 'Apr', revenue: 190000 },
    { name: 'May', revenue: 215000 },
    { name: 'Jun', revenue: 240000 },
  ];

  // Mock appointment conversion distribution
  const appointmentDistribution = [
    { name: 'Completed', value: 89, color: '#10b981' },
    { name: 'Scheduled', value: 56, color: '#f59e0b' },
    { name: 'Cancelled', value: 11, color: '#ef4444' },
  ];

  return (
    <div className="space-y-6 text-left">
      {/* Cards summary for analytics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card elevated className="flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Patient growth</span>
            <span className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white">+42% MoM</span>
          </div>
          <div className="bg-emerald-500/10 p-2.5 rounded-xl text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="h-5 w-5" />
          </div>
        </Card>

        <Card elevated className="flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Monthly Revenue</span>
            <span className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white">₹2.4L</span>
          </div>
          <div className="bg-blue-500/10 p-2.5 rounded-xl text-blue-600 dark:text-blue-400">
            <DollarSign className="h-5 w-5" />
          </div>
        </Card>

        <Card elevated className="flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Booking Success</span>
            <span className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white">89% Completion</span>
          </div>
          <div className="bg-indigo-500/10 p-2.5 rounded-xl text-indigo-600 dark:text-indigo-400">
            <CalendarCheck className="h-5 w-5" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Patient Registrations Trend (Area Chart) */}
        <Card className="lg:col-span-8 space-y-4">
          <div>
            <h3 className="font-bold text-base text-slate-850 dark:text-white font-heading">Patient Registrations Trend</h3>
            <p className="text-xs text-slate-400 dark:text-slate-400 font-medium">Growth index over the current calendar half</p>
          </div>
          
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={registrationData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPatients" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colors.primary} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={colors.primary} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={colors.grid} strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke={colors.axisText} style={{ fontSize: 10, fontFamily: 'monospace' }} />
                <YAxis stroke={colors.axisText} style={{ fontSize: 10, fontFamily: 'monospace' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: colors.tooltipBg, borderColor: colors.tooltipBorder, borderRadius: 8, color: colors.tooltipText }}
                  labelStyle={{ fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="patients" stroke={colors.primary} strokeWidth={2.5} fillOpacity={1} fill="url(#colorPatients)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Appointment Distribution (Pie Chart) */}
        <Card className="lg:col-span-4 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-850 dark:text-white font-heading">Appointments Roster</h3>
            <p className="text-xs text-slate-400 dark:text-slate-400 font-medium">Status conversion analysis</p>
          </div>

          <div className="h-56 w-full relative flex-1 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={appointmentDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {appointmentDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: colors.tooltipBg, borderColor: colors.tooltipBorder, borderRadius: 8, color: colors.tooltipText }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Custom Legends */}
          <div className="flex justify-between items-center gap-2 pt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            {appointmentDistribution.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span>{item.name}: <strong className="text-slate-800 dark:text-white font-mono">{item.value}</strong></span>
              </div>
            ))}
          </div>
        </Card>

        {/* Revenue Growth Index (Bar Chart) */}
        <Card className="lg:col-span-12 space-y-4">
          <div>
            <h3 className="font-bold text-base text-slate-850 dark:text-white font-heading">Monthly Revenue Statistics</h3>
            <p className="text-xs text-slate-400 dark:text-slate-400 font-medium">Outpatient and clinical consultation income (INR)</p>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid stroke={colors.grid} strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke={colors.axisText} style={{ fontSize: 10, fontFamily: 'monospace' }} />
                <YAxis stroke={colors.axisText} style={{ fontSize: 10, fontFamily: 'monospace' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: colors.tooltipBg, borderColor: colors.tooltipBorder, borderRadius: 8, color: colors.tooltipText }}
                  formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']}
                />
                <Bar dataKey="revenue" fill={colors.indigo} radius={[6, 6, 0, 0]}>
                  {revenueData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={index === revenueData.length - 1 ? '#4f46e5' : colors.indigo} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
