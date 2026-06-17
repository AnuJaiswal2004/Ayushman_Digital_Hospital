import React from 'react';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { TrendingUp, DollarSign, CalendarCheck } from 'lucide-react';

export default function AnalyticsTab() {
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
    <div className="space-y-6">
      {/* Cards summary for analytics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Patient growth</span>
            <span className="text-2xl font-black text-white">+42% MoM</span>
          </div>
          <div className="bg-emerald-500/10 p-2.5 rounded-xl text-emerald-400">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Monthly Revenue</span>
            <span className="text-2xl font-black text-white">₹2.4L</span>
          </div>
          <div className="bg-blue-500/10 p-2.5 rounded-xl text-blue-400">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Booking Success</span>
            <span className="text-2xl font-black text-white">89% Completion</span>
          </div>
          <div className="bg-indigo-500/10 p-2.5 rounded-xl text-indigo-400">
            <CalendarCheck className="h-5 w-5" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Patient Registrations Trend (Area Chart) */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl lg:col-span-8 space-y-4">
          <div>
            <h3 className="font-bold text-base text-white font-heading">Patient Registrations Trend</h3>
            <p className="text-xs text-slate-400 font-medium">Growth index over the current calendar half</p>
          </div>
          
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={registrationData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPatients" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: 10, fontFamily: 'monospace' }} />
                <YAxis stroke="#64748b" style={{ fontSize: 10, fontFamily: 'monospace' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, color: '#f8fafc' }}
                  labelStyle={{ fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="patients" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorPatients)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Appointment Distribution (Pie Chart) */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl lg:col-span-4 space-y-4 flex flex-col">
          <div>
            <h3 className="font-bold text-base text-white font-heading">Appointments Roster</h3>
            <p className="text-xs text-slate-400 font-medium">Status conversion analysis</p>
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
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, color: '#f8fafc' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Custom Legends */}
          <div className="flex justify-between items-center gap-2 pt-2 text-xs font-semibold text-slate-400">
            {appointmentDistribution.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span>{item.name}: <strong className="text-white font-mono">{item.value}</strong></span>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue Growth Index (Bar Chart) */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl lg:col-span-12 space-y-4">
          <div>
            <h3 className="font-bold text-base text-white font-heading">Monthly Revenue Statistics</h3>
            <p className="text-xs text-slate-400 font-medium">Outpatient and clinical consultation income (INR)</p>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: 10, fontFamily: 'monospace' }} />
                <YAxis stroke="#64748b" style={{ fontSize: 10, fontFamily: 'monospace' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, color: '#f8fafc' }}
                  formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']}
                />
                <Bar dataKey="revenue" fill="#6366f1" radius={[6, 6, 0, 0]}>
                  {revenueData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={index === revenueData.length - 1 ? '#4f46e5' : '#6366f1'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
