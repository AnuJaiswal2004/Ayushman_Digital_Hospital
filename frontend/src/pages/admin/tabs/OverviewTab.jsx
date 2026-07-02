import React, { useState, useEffect } from 'react';
import { Users, Calendar, Award, DollarSign, Activity, Server, Cpu, HardDrive, ShieldCheck, CheckCircle2, UserCheck, Stethoscope, Clock } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { apiService } from '../../../services/api.js';

export default function OverviewTab() {
  const [stats, setStats] = useState({
    patients: 0,
    appointments: 0,
    doctors: 0,
    revenue: 0,
    emergencyCases: 0,
    activeSessions: 148,
    dataProcessed: '2.4 GB'
  });

  const [recentPatients, setRecentPatients] = useState([]);
  const [activities, setActivities] = useState([]);
  
  // Charts States
  const [charts, setCharts] = useState({
    patientGrowth: [],
    appointmentTrends: [],
    departmentVisits: [],
    revenueData: []
  });

  useEffect(() => {
    const fetchData = async () => {
      const allPatients = await apiService.getPatients();
      const allAppointments = await apiService.getAppointments();
      const allDoctors = await apiService.getDoctors();
      const allDepts = await apiService.getDepartments();

      // Count today's appointments
      const todayStr = new Date().toISOString().split('T')[0];
      const todayAppts = allAppointments.filter(a => a.date === todayStr);

      // Available doctors
      const availableDocs = allDoctors.filter(d => d.status === 'Available').length;

      // Revenue current month
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const thisMonthAppts = allAppointments.filter(a => {
        const d = new Date(a.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      });
      const currentMonthRevenue = thisMonthAppts.reduce((sum, a) => {
        if (a.billing) return sum + (a.billing.total || a.billing.totalAmount || 350);
        if (a.status === 'completed') return sum + 350;
        return sum;
      }, 0);
      const totalRevenue = 154000 + currentMonthRevenue;

      // Emergency cases count
      const emergencyCount = allAppointments.filter(a => a.type === 'emergency' || a.reason?.toLowerCase().includes('emergency')).length;

      setStats({
        patients: allPatients.length,
        appointments: todayAppts.length,
        doctors: availableDocs,
        revenue: totalRevenue,
        emergencyCases: emergencyCount,
        activeSessions: 142 + Math.floor(Math.random() * 20),
        dataProcessed: (2.1 + Math.random() * 0.5).toFixed(1) + ' GB'
      });

      // Sort patients by registration date and take recent 5
      const sortedPatients = [...allPatients]
        .sort((a, b) => new Date(b.registrationDate) - new Date(a.registrationDate))
        .slice(0, 5);
      setRecentPatients(sortedPatients);

      // Build Dynamic Activities Feed
      const actFeed = [];
      allPatients.forEach(p => {
        actFeed.push({
          id: `p-${p.id}`,
          text: `New patient registered: ${p.name}`,
          subtext: `ABHA: ${p.abha}`,
          time: p.registrationDate,
          icon: UserCheck,
          color: 'text-blue-400 bg-blue-500/10 border-blue-500/20'
        });
      });
      allAppointments.forEach(a => {
        actFeed.push({
          id: `a-${a.id}`,
          text: `Appointment booked: ${a.patientName}`,
          subtext: `${a.doctor} (${a.department})`,
          time: a.createdAt || a.date,
          icon: Calendar,
          color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
        });
      });
      // Mock log updates
      actFeed.push({
        id: 'doc-1',
        text: 'Dr. Rajesh Sharma updated profile',
        subtext: 'Added Cardiology credentials',
        time: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        icon: Stethoscope,
        color: 'text-teal-400 bg-teal-500/10 border-teal-500/20'
      });
      actFeed.push({
        id: 'doc-2',
        text: 'Dr. Priya Mehta status changed',
        subtext: 'Marked as Available',
        time: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        icon: Award,
        color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20'
      });

      // Sort activities descending
      const sortedActivities = actFeed
        .sort((a, b) => new Date(b.time) - new Date(a.time))
        .slice(0, 6);
      setActivities(sortedActivities);

      // Build charts
      // 1. Patient Growth
      const patientGrowth = [
        { name: 'Jan', Patients: 35 },
        { name: 'Feb', Patients: 58 },
        { name: 'Mar', Patients: 82 },
        { name: 'Apr', Patients: 115 },
        { name: 'May', Patients: 180 },
        { name: 'Jun', Patients: 180 + allPatients.length },
      ];

      // 2. Appointment Trends (last 7 days outline)
      const appointmentTrends = [
        { name: 'Mon', Visits: 14, Emergency: 2 },
        { name: 'Tue', Visits: 18, Emergency: 1 },
        { name: 'Wed', Visits: 22, Emergency: 3 },
        { name: 'Thu', Visits: 19, Emergency: 2 },
        { name: 'Fri', Visits: 25, Emergency: 4 },
        { name: 'Sat', Visits: 16, Emergency: 1 },
        { name: 'Sun', Visits: 8 + allAppointments.length, Emergency: emergencyCount },
      ];

      // 3. Department Visits distribution
      const depts = {};
      allAppointments.forEach(a => {
        const d = a.department ? a.department.charAt(0).toUpperCase() + a.department.slice(1) : 'General';
        depts[d] = (depts[d] || 0) + 1;
      });
      const colors = ['#3b82f6', '#10b981', '#6366f1', '#f59e0b', '#f43f5e'];
      const departmentVisits = Object.keys(depts).map((key, idx) => ({
        name: key,
        value: depts[key],
        color: colors[idx % colors.length]
      }));

      // 4. Revenue Analytics
      const revenueData = [
        { name: 'Jan', Revenue: 95000 },
        { name: 'Feb', Revenue: 120000 },
        { name: 'Mar', Revenue: 155000 },
        { name: 'Apr', Revenue: 190000 },
        { name: 'May', Revenue: 215000 },
        { name: 'Jun', Revenue: totalRevenue },
      ];

      setCharts({
        patientGrowth,
        appointmentTrends,
        departmentVisits,
        revenueData
      });
    };

    fetchData();
  }, []);

  const getDaysAgoText = (dateStr) => {
    const diffTime = Math.abs(new Date() - new Date(dateStr));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) {
      const diffHrs = Math.floor(diffTime / (1000 * 60 * 60));
      if (diffHrs === 0) return 'Just now';
      return `${diffHrs}h ago`;
    }
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  // Sparkline generator
  const Sparkline = ({ color }) => (
    <svg className="w-16 h-8 text-slate-500 shrink-0" viewBox="0 0 100 30" fill="none">
      <path
        d="M0,25 Q15,10 30,22 T60,5 T90,15 L100,10"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-200">
      {/* Real-time Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Patients */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex justify-between items-center hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all group">
          <div className="space-y-2 text-left">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Total Patients</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-800 dark:text-white">{stats.patients}</span>
              <span className="text-emerald-500 dark:text-emerald-500 text-[10px] font-bold font-mono">+12%</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="bg-blue-500/10 p-2.5 rounded-xl text-blue-500 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
              <Users className="h-4.5 w-4.5" />
            </div>
            <Sparkline color="#3b82f6" />
          </div>
        </div>

        {/* Card 2: Today's Appointments */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex justify-between items-center hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all group">
          <div className="space-y-2 text-left">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Today's Appts</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-800 dark:text-white">{stats.appointments}</span>
              <span className="text-emerald-500 dark:text-emerald-500 text-[10px] font-bold font-mono">+8%</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="bg-indigo-500/10 p-2.5 rounded-xl text-indigo-500 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
              <Calendar className="h-4.5 w-4.5" />
            </div>
            <Sparkline color="#6366f1" />
          </div>
        </div>

        {/* Card 3: Available Doctors */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex justify-between items-center hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all group">
          <div className="space-y-2 text-left">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider block uppercase">Available Doctors</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-800 dark:text-white">{stats.doctors}</span>
              <span className="text-slate-400 dark:text-slate-500 text-[10px] font-bold font-mono uppercase">Active</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="bg-teal-500/10 p-2.5 rounded-xl text-teal-600 dark:text-teal-400 group-hover:bg-teal-600 group-hover:text-white transition-all">
              <Award className="h-4.5 w-4.5" />
            </div>
            <Sparkline color="#14b8a6" />
          </div>
        </div>

        {/* Card 4: Revenue This Month */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex justify-between items-center hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all group">
          <div className="space-y-2 text-left">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Revenue Month</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-800 dark:text-white">₹{stats.revenue.toLocaleString()}</span>
              <span className="text-emerald-500 dark:text-emerald-500 text-[10px] font-bold font-mono">+18%</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="bg-emerald-500/10 p-2.5 rounded-xl text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-all">
              <DollarSign className="h-4.5 w-4.5" />
            </div>
            <Sparkline color="#10b981" />
          </div>
        </div>

        {/* Card 5: Emergency Cases */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl flex justify-between items-center hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all group">
          <div className="space-y-2 text-left">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Emergency Cases</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-rose-600 dark:text-rose-500">{stats.emergencyCases}</span>
              <span className="text-rose-600 dark:text-rose-400 text-[9px] font-black font-mono tracking-tighter">HIGH PRIO</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="bg-rose-500/10 p-2.5 rounded-xl text-rose-600 dark:text-rose-400 group-hover:bg-rose-600 group-hover:text-white transition-all">
              <Activity className="h-4.5 w-4.5" />
            </div>
            <Sparkline color="#f43f5e" />
          </div>
        </div>
      </div>

      {/* Interactive Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Patient Growth (Area Chart) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl space-y-4 shadow-sm text-left">
          <div>
            <h3 className="font-bold text-sm text-slate-800 dark:text-white font-heading">Patient Growth Index</h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Cumulative registered patients trend over the last 6 months</p>
          </div>
          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.patientGrowth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#e2e8f0" className="dark:stroke-slate-800" strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: 9, fontFamily: 'monospace' }} />
                <YAxis stroke="#64748b" style={{ fontSize: 9, fontFamily: 'monospace' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, color: '#f8fafc', fontSize: 11 }}
                />
                <Area type="monotone" dataKey="Patients" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#growthGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Appointment Trends (Bar/Line Mix Chart) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl space-y-4 shadow-sm text-left">
          <div>
            <h3 className="font-bold text-sm text-slate-800 dark:text-white font-heading">Visits vs Emergency Trends</h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Weekly outpatient clinical traffic analysis</p>
          </div>
          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts.appointmentTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="#e2e8f0" className="dark:stroke-slate-800" strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: 9, fontFamily: 'monospace' }} />
                <YAxis stroke="#64748b" style={{ fontSize: 9, fontFamily: 'monospace' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, color: '#f8fafc', fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: 10, paddingTop: 4 }} />
                <Line type="monotone" dataKey="Visits" stroke="#6366f1" strokeWidth={2.5} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="Emergency" stroke="#f43f5e" strokeWidth={2.5} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Department-wise visits (Pie Chart) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl space-y-4 flex flex-col justify-between shadow-sm text-left">
          <div>
            <h3 className="font-bold text-sm text-slate-800 dark:text-white font-heading">Department-wise Consultations</h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Distribution ratio by clinical departments</p>
          </div>
          <div className="h-44 w-full relative flex items-center justify-center">
            {charts.departmentVisits.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.departmentVisits}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={65}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {charts.departmentVisits.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, color: '#f8fafc', fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <span className="text-xs text-slate-500">No active visits logged</span>
            )}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center text-[10px] font-semibold text-slate-400 dark:text-slate-500 pt-2 border-t border-slate-200 dark:border-slate-800">
            {charts.departmentVisits.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span>{item.name}: <strong className="text-slate-900 dark:text-white font-mono">{item.value}</strong></span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 4: Revenue Analytics (Bar Chart) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl space-y-4 shadow-sm text-left">
          <div>
            <h3 className="font-bold text-sm text-slate-800 dark:text-white font-heading">Revenue Index</h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Outpatient and clinical consultation income (INR)</p>
          </div>
          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.revenueData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid stroke="#e2e8f0" className="dark:stroke-slate-800" strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: 9, fontFamily: 'monospace' }} />
                <YAxis stroke="#64748b" style={{ fontSize: 9, fontFamily: 'monospace' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, color: '#f8fafc', fontSize: 11 }}
                  formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']}
                />
                <Bar dataKey="Revenue" fill="#10b981" radius={[4, 4, 0, 0]}>
                  {charts.revenueData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={index === charts.revenueData.length - 1 ? '#059669' : '#10b981'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Logs, Activity Feed & Infrastructure */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Registrations Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 lg:col-span-6 space-y-3 shadow-sm text-left">
          <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-sm text-slate-800 dark:text-white font-heading">Recent Registrations</h3>
            <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700">ABDM LOGS</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  <th className="pb-2 pr-3">Name</th>
                  <th className="pb-2 px-3">ABHA ID</th>
                  <th className="pb-2 px-3">Reg Date</th>
                  <th className="pb-2 pl-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {recentPatients.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-4 text-center text-slate-400 dark:text-slate-500 font-medium">
                      No patients registered yet.
                    </td>
                  </tr>
                ) : (
                  recentPatients.map((patient) => (
                    <tr key={patient.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 text-slate-600 dark:text-slate-300">
                      <td className="py-2.5 pr-3 font-bold text-slate-800 dark:text-white">{patient.name}</td>
                      <td className="py-2.5 px-3 font-mono text-[10px] text-slate-500 dark:text-slate-400">{patient.abha}</td>
                      <td className="py-2.5 px-3 text-slate-400 dark:text-slate-500">{getDaysAgoText(patient.registrationDate)}</td>
                      <td className="py-2.5 pl-3 text-right">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          patient.status === 'Active' 
                            ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20' 
                            : patient.status === 'In-Treatment'
                            ? 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                        }`}>
                          {patient.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dynamic Activities Feed */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 lg:col-span-3 space-y-3 shadow-sm text-left">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-sm text-slate-800 dark:text-white font-heading">Recent Activities</h3>
            <span className="text-[9px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold px-2 py-0.5 rounded border border-indigo-100 dark:border-indigo-500/20">LIVE FEED</span>
          </div>

          <div className="space-y-3.5 max-h-[260px] overflow-y-auto pr-1">
            {activities.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-6">No recent updates.</p>
            ) : (
              activities.map((act) => {
                const Icon = act.icon;
                return (
                  <div key={act.id} className="flex gap-3 items-start animate-fade-in text-xs">
                    <div className={`p-1.5 rounded-lg border ${act.color} shrink-0 mt-0.5`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 dark:text-slate-200 truncate leading-tight">{act.text}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{act.subtext}</p>
                    </div>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono shrink-0 pt-0.5">{getDaysAgoText(act.time)}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* System Health / Infrastructure */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 lg:col-span-3 space-y-4 flex flex-col justify-between shadow-sm text-left">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-sm text-slate-800 dark:text-white font-heading">System Infrastructure</h3>
            <span className="text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded border border-emerald-500/20 animate-pulse-soft">ONLINE</span>
          </div>

          <div className="space-y-3.5 flex-1 flex flex-col justify-center">
            {/* Uptime */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-bold text-slate-400 dark:text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Server className="h-3.5 w-3.5 text-blue-500" /> SYSTEM UPTIME
                </span>
                <span className="text-slate-800 dark:text-white font-mono">99.9%</span>
              </div>
              <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: '99.9%' }} />
              </div>
            </div>

            {/* User Sessions */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-bold text-slate-400 dark:text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Cpu className="h-3.5 w-3.5 text-teal-600" /> ACTIVE SESSIONS
                </span>
                <span className="text-slate-800 dark:text-white font-mono">{stats.activeSessions} Users</span>
              </div>
              <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-teal-500 rounded-full" style={{ width: '65%' }} />
              </div>
            </div>

            {/* Data Bandwidth */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-bold text-slate-400 dark:text-slate-500">
                <span className="flex items-center gap-1.5">
                  <HardDrive className="h-3.5 w-3.5 text-indigo-500" /> DATA BANDWIDTH
                </span>
                <span className="text-slate-800 dark:text-white font-mono">{stats.dataProcessed}</span>
              </div>
              <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: '42%' }} />
              </div>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2 text-center text-[10px] text-slate-500 font-semibold flex items-center justify-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            National ABDM Gateway: <span className="text-emerald-500 font-bold font-mono">SECURE</span>
          </div>
        </div>
      </div>
    </div>
  );
}
