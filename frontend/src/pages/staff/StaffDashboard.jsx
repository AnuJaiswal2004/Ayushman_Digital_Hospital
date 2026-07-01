import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HeartPulse, LayoutDashboard, Search, Thermometer, UserCheck, Stethoscope, Receipt, ListOrdered, LogOut, CheckCircle, Plus, Key, Settings, UserPlus, Users, Calendar, Award, Ban, CalendarClock, Activity, ShieldCheck, FileSpreadsheet, Bell } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { apiService } from '../../services/api.js';
import ReceptionTab from './tabs/ReceptionTab.jsx';
import EMRTab from './tabs/EMRTab.jsx';
import BillingTab from './tabs/BillingTab.jsx';
import ThemeToggle from '../../components/ThemeToggle.jsx';
import { useTheme } from '../../services/theme.js';
import { getChartColors } from '../../services/chartTheme.js';

export default function StaffDashboard() {
  const navigate = useNavigate();
  const [theme] = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const chartColors = getChartColors(isDark);
  const [activeTab, setActiveTab] = useState('overview');
  const [currentUser, setCurrentUser] = useState(null);

  // Notifications State
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const loadNotifications = async (userObj) => {
    if (!userObj) return;
    const allNoti = await apiService.getNotifications();
    const userNotis = allNoti.filter(n => {
      return n.targetUserId === userObj.username || (n.targetRoles && n.targetRoles.includes(userObj.role));
    });
    setNotifications(userNotis);
  };

  const handleMarkAllRead = async () => {
    if (!currentUser) return;
    await apiService.markNotificationsAsRead(currentUser.username);
    loadNotifications(currentUser);
  };

  const unreadCount = notifications.filter(n => !n.readBy || !n.readBy.includes(currentUser?.username)).length;

  // Global Lists
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  
  // Stats
  const [stats, setStats] = useState({ checkedIn: 0, waiting: 0, completed: 0 });

  // 1. Check-In State (Receptionist)
  const [checkInSearch, setCheckInSearch] = useState('');
  const [foundPatient, setFoundPatient] = useState(null);

  // Patient Registration Form (Receptionist)
  const [showRegForm, setShowRegForm] = useState(false);
  const [regForm, setRegForm] = useState({
    name: '',
    abha: '',
    phone: '',
    dob: '',
    gender: 'male',
    password: 'password'
  });

  // Appointment Booking Form (Receptionist)
  const [showBookForm, setShowBookForm] = useState(false);
  const [bookForm, setBookForm] = useState({
    patientId: '',
    department: '',
    doctor: '',
    date: '',
    time: '',
    type: 'opd',
    reason: ''
  });

  // Reschedule Form (Receptionist)
  const [rescheduleApt, setRescheduleApt] = useState(null);
  const [rescheduleForm, setRescheduleForm] = useState({ date: '', time: '' });

  // 2. Vitals State (Doctor)
  const [vitalsToken, setVitalsToken] = useState('');
  const [vitalsForm, setVitalsForm] = useState({ temp: '', pulse: '', bpSys: '', bpDia: '', notes: '' });

  // 3. Consultation State (Doctor)
  const [consultToken, setConsultToken] = useState('');
  const [consultForm, setConsultForm] = useState({ complaint: '', examination: '', diagnosis: '', treatment: '' });
  const [medications, setMedications] = useState([{ name: '', dosage: '', frequency: '', duration: '' }]);

  // 4. Billing State (Receptionist)
  const [billingToken, setBillingToken] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');

  // 5. Security Password Form
  const [securityForm, setSecurityForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [securityError, setSecurityError] = useState('');
  const [securitySuccess, setSecuritySuccess] = useState('');

  // 6. Search Queries
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [appointmentSearchQuery, setAppointmentSearchQuery] = useState('');

  const loadData = async (user) => {
    const p = await apiService.getPatients();
    const a = await apiService.getAppointments();
    const d = await apiService.getDoctors();
    const depts = await apiService.getDepartments();

    setPatients(p);
    setAppointments(a);
    setDoctors(d);
    setDepartments(depts);

    // Compute Stats dynamically
    const todayStr = new Date().toISOString().split('T')[0];
    
    if (user?.role === 'doctor') {
      // Stats for Doctor (Own appointments)
      const ownVisits = a.filter(item => item.date === todayStr && item.doctor === user.name);
      setStats({
        checkedIn: ownVisits.length,
        waiting: ownVisits.filter(item => item.status === 'scheduled' && !item.consultation).length,
        completed: ownVisits.filter(item => item.status === 'completed').length
      });
    } else {
      // Stats for Receptionist (All clinical sessions)
      const todayVisits = a.filter(item => item.date === todayStr);
      setStats({
        checkedIn: todayVisits.length,
        waiting: todayVisits.filter(item => item.status === 'scheduled').length,
        completed: todayVisits.filter(item => item.status === 'completed').length
      });
    }
  };

  useEffect(() => {
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) {
      navigate('/');
      return;
    }
    const user = JSON.parse(userStr);
    if (user.role !== 'doctor' && user.role !== 'receptionist') {
      navigate('/');
      return;
    }
    setCurrentUser(user);
    loadData(user);
    loadNotifications(user);

    // Poll for notifications
    const interval = setInterval(() => loadNotifications(user), 5000);
    return () => clearInterval(interval);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate('/');
  };

  const handleToggleAvailability = async (docId) => {
    try {
      await apiService.toggleDoctorAvailability(docId);
      const updatedD = await apiService.getDoctors();
      setDoctors(updatedD);
      alert('Availability status toggled successfully!');
      if (currentUser) {
        loadNotifications(currentUser);
      }
    } catch (err) {
      alert('Failed to update status');
    }
  };

  // Check-In Actions (Receptionist)
  const handleCheckInSearch = () => {
    const found = patients.find(p => p.abha === checkInSearch || p.phone === checkInSearch);
    if (found) {
      setFoundPatient(found);
    } else {
      alert('Patient not found. Please register them first.');
      setFoundPatient(null);
    }
  };

  const handleCreateVisit = async () => {
    if (!foundPatient) return;
    try {
      const today = new Date().toISOString().split('T')[0];
      const token = 'TKN' + String(appointments.length + 1).padStart(3, '0');
      
      await apiService.bookAppointment({
        patientId: foundPatient.id,
        patientName: foundPatient.name,
        department: 'general',
        doctor: doctors[0]?.name || 'Dr. Vikram Malhotra',
        date: today,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        type: 'opd',
        reason: 'Regular consultation checkin',
        token,
      });

      alert(`Check-in complete! Token generated: ${token}`);
      setCheckInSearch('');
      setFoundPatient(null);
      loadData(currentUser);
    } catch (err) {
      alert('Failed to check-in patient');
    }
  };

  // Patient Registration (Receptionist)
  const handleRegisterPatient = async (e) => {
    e.preventDefault();
    if (!regForm.name || !regForm.abha || !regForm.phone || !regForm.dob) {
      alert('Please fill all required fields');
      return;
    }
    try {
      await apiService.registerPatient(regForm);
      alert('Patient registered successfully!');
      setShowRegForm(false);
      setRegForm({ name: '', abha: '', phone: '', dob: '', gender: 'male', password: 'password' });
      loadData(currentUser);
    } catch (err) {
      alert('Failed to register patient');
    }
  };

  // Appointment Booking (Receptionist)
  const handleBookAppointment = async (e) => {
    e.preventDefault();
    const patientObj = patients.find(p => p.id === bookForm.patientId);
    if (!patientObj) {
      alert('Please select a valid patient');
      return;
    }

    try {
      const token = 'TKN' + String(appointments.length + 1).padStart(3, '0');
      await apiService.bookAppointment({
        patientId: patientObj.id,
        patientName: patientObj.name,
        department: bookForm.department,
        doctor: bookForm.doctor,
        date: bookForm.date,
        time: bookForm.time,
        type: bookForm.type,
        reason: bookForm.reason,
        token
      });
      alert('Appointment booked successfully!');
      setShowBookForm(false);
      setBookForm({ patientId: '', department: '', doctor: '', date: '', time: '', type: 'opd', reason: '' });
      loadData(currentUser);
    } catch (err) {
      alert('Failed to book appointment');
    }
  };

  const handleCancelAppointment = async (id) => {
    if (window.confirm('Cancel this appointment?')) {
      try {
        await apiService.updateAppointmentStatus(id, 'cancelled');
        loadData(currentUser);
        alert('Appointment cancelled.');
      } catch (err) {
        alert('Error cancelling appointment');
      }
    }
  };

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!rescheduleForm.date || !rescheduleForm.time) return;
    try {
      await apiService.rescheduleAppointment(rescheduleApt.id || rescheduleApt._id, rescheduleForm.date, rescheduleForm.time);
      alert('Appointment rescheduled.');
      setRescheduleApt(null);
      loadData(currentUser);
    } catch (err) {
      alert('Error rescheduling appointment');
    }
  };

  // Vitals Actions (Doctor)
  const handleSaveVitals = async (e) => {
    e.preventDefault();
    if (!vitalsToken) return;
    const { temp, pulse, bpSys, bpDia, notes } = vitalsForm;
    if (!temp || !pulse || !bpSys || !bpDia) {
      alert('Please fill all vital measurements');
      return;
    }

    try {
      const match = appointments.find(a => a.token === vitalsToken);
      if (match) {
        const vitals = {
          temperature: temp,
          pulse,
          bloodPressure: `${bpSys}/${bpDia}`,
          notes,
          recordedBy: currentUser.name,
          recordedAt: new Date().toISOString()
        };
        
        const allAppts = JSON.parse(localStorage.getItem('appointments')) || [];
        const idx = allAppts.findIndex(a => a.id === match.id);
        if (idx !== -1) {
          allAppts[idx].vitals = vitals;
          localStorage.setItem('appointments', JSON.stringify(allAppts));
        }

        alert('Vitals logged successfully!');
        setVitalsToken('');
        setVitalsForm({ temp: '', pulse: '', bpSys: '', bpDia: '', notes: '' });
        loadData(currentUser);
      }
    } catch (err) {
      alert('Failed to save vitals');
    }
  };

  // Consultation Actions (Doctor)
  const handleAddMedication = () => {
    setMedications([...medications, { name: '', dosage: '', frequency: '', duration: '' }]);
  };

  const handleMedicationChange = (index, field, value) => {
    const updated = [...medications];
    updated[index][field] = value;
    setMedications(updated);
  };

  const handleSaveConsultation = async (e) => {
    e.preventDefault();
    if (!consultToken) return;
    const { complaint, examination, diagnosis, treatment } = consultForm;
    if (!complaint || !diagnosis) {
      alert('Please enter complaints and diagnosis');
      return;
    }

    try {
      const match = appointments.find(a => a.token === consultToken);
      if (match) {
        const consultation = {
          complaint,
          examination,
          diagnosis,
          treatment,
          medications: medications.filter(m => m.name !== ''),
          consultedBy: currentUser.name,
          consultedAt: new Date().toISOString()
        };

        const allAppts = JSON.parse(localStorage.getItem('appointments')) || [];
        const idx = allAppts.findIndex(a => a.id === match.id);
        if (idx !== -1) {
          allAppts[idx].consultation = consultation;
          allAppts[idx].status = 'completed';
          localStorage.setItem('appointments', JSON.stringify(allAppts));
        }

        alert('Consultation completed successfully! Sent to billing.');
        setConsultToken('');
        setConsultForm({ complaint: '', examination: '', diagnosis: '', treatment: '' });
        setMedications([{ name: '', dosage: '', frequency: '', duration: '' }]);
        loadData(currentUser);
      }
    } catch (err) {
      alert('Failed to save consultation');
    }
  };

  // Billing Actions (Receptionist)
  const handleProcessBilling = async () => {
    if (!billingToken) return;
    try {
      const match = appointments.find(a => a.token === billingToken);
      if (match) {
        const billing = {
          total: match.type === 'emergency' ? 500 : 350,
          paymentMethod,
          paidAt: new Date().toISOString(),
          processedBy: currentUser.name
        };

        const allAppts = JSON.parse(localStorage.getItem('appointments')) || [];
        const idx = allAppts.findIndex(a => a.id === match.id);
        if (idx !== -1) {
          allAppts[idx].billing = billing;
          localStorage.setItem('appointments', JSON.stringify(allAppts));
        }

        alert('Checkout complete. Billing processed successfully!');
        setBillingToken('');
        loadData(currentUser);
      }
    } catch (err) {
      alert('Failed to process payment');
    }
  };

  // Change Password
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setSecurityError('');
    setSecuritySuccess('');

    if (securityForm.newPassword !== securityForm.confirmPassword) {
      setSecurityError('New passwords do not match');
      return;
    }

    const res = await apiService.changePassword(
      currentUser.username,
      securityForm.oldPassword,
      securityForm.newPassword,
      currentUser.role
    );

    if (res.success) {
      setSecuritySuccess('Password updated successfully!');
      setSecurityForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      const updatedUser = { ...currentUser, password: securityForm.newPassword };
      setCurrentUser(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    } else {
      setSecurityError(res.message || 'Failed to change password');
    }
  };

  if (!currentUser) return null;

  // Queues & Filters
  const todayStr = new Date().toISOString().split('T')[0];
  const activeTodayVisits = appointments.filter(a => a.date === todayStr);
  const ownTodayAppointments = activeTodayVisits.filter(a => a.doctor === currentUser.name);

  // Doctor queues
  const vitalsQueue = ownTodayAppointments.filter(a => !a.vitals);
  const consultQueue = ownTodayAppointments.filter(a => a.vitals && !a.consultation);

  // Receptionist queues
  const billingQueue = activeTodayVisits.filter(a => a.consultation && !a.billing);
  const selectedConsultAppt = appointments.find(a => a.token === consultToken);

  // Filter Patients & Appointments based on search query
  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(patientSearchQuery.toLowerCase()) ||
    p.abha.includes(patientSearchQuery) ||
    p.phone.includes(patientSearchQuery)
  );

  const filteredAppointments = appointments.filter(a => {
    const matchesSearch = 
      a.patientName.toLowerCase().includes(appointmentSearchQuery.toLowerCase()) ||
      a.doctor.toLowerCase().includes(appointmentSearchQuery.toLowerCase()) ||
      a.id.toLowerCase().includes(appointmentSearchQuery.toLowerCase());
    
    // For doctor, restrict to own appointments only
    if (currentUser.role === 'doctor') {
      return matchesSearch && a.doctor === currentUser.name;
    }
    return matchesSearch;
  });

  // Dynamic Menu Build
  const sidebarMenu = [];
  if (currentUser.role === 'doctor') {
    sidebarMenu.push(
      { id: 'overview', name: 'Dashboard', icon: LayoutDashboard },
      { id: 'patients', name: 'Patients Directory', icon: Users },
      { id: 'appointments', name: 'My Roster', icon: Stethoscope },
      { id: 'emr', name: 'EMR Locker', icon: FileSpreadsheet },
      { id: 'doctors', name: 'Clinical Team', icon: HeartPulse },
      { id: 'analytics', name: 'Insights', icon: Activity },
      { id: 'settings', name: 'Security Settings', icon: Settings }
    );
  } else {
    sidebarMenu.push(
      { id: 'overview', name: 'Dashboard', icon: LayoutDashboard },
      { id: 'reception', name: 'Reception Desk', icon: ListOrdered },
      { id: 'emr', name: 'EMR Locker', icon: FileSpreadsheet },
      { id: 'billing', name: 'Billing Desk', icon: Receipt },
      { id: 'settings', name: 'Security Settings', icon: Settings }
    );
  }

  // Doctor Limited Analytics
  const getDoctorAnalytics = () => {
    const doctorAppts = appointments.filter(a => a.doctor === currentUser.name);
    const completed = doctorAppts.filter(a => a.status === 'completed').length;
    const scheduled = doctorAppts.filter(a => a.status === 'scheduled').length;
    const cancelled = doctorAppts.filter(a => a.status === 'cancelled').length;

    const completionData = [
      { name: 'Completed', value: completed || 1, color: '#10b981' },
      { name: 'Scheduled', value: scheduled, color: '#f59e0b' },
      { name: 'Cancelled', value: cancelled, color: '#ef4444' }
    ];

    // Outpatients vs Emergency
    const opd = doctorAppts.filter(a => a.type === 'opd').length;
    const tele = doctorAppts.filter(a => a.type === 'telemedicine').length;
    const emergency = doctorAppts.filter(a => a.type === 'emergency').length;

    const consultTypeData = [
      { name: 'OPD (In-Person)', value: opd, color: '#3b82f6' },
      { name: 'Telemedicine', value: tele, color: '#6366f1' },
      { name: 'Emergency', value: emergency, color: '#f43f5e' }
    ];

    return { completionData, consultTypeData, total: doctorAppts.length };
  };

  const doctorAnalytics = currentUser.role === 'doctor' ? getDoctorAnalytics() : null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans select-none antialiased transition-colors duration-300">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white text-xs py-2 px-4 flex justify-between items-center border-b border-teal-850">
        <div className="flex items-center gap-4">
          <span className="font-semibold tracking-wider">GOVERNMENT OF INDIA</span>
          <span className="hidden md:inline text-teal-200">|</span>
          <span className="hidden md:inline font-light">CLINICAL SERVICES CONSOLE</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="bg-emerald-500/30 text-emerald-300 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wider">
            {currentUser?.role}: {currentUser?.name}
          </span>
          
          <ThemeToggle />
          
          {/* Notifications Bell */}
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-1 hover:bg-white/10 rounded-full transition-colors relative cursor-pointer flex items-center"
            >
              <Bell className="h-4 w-4 text-white" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[7px] font-black h-3.5 w-3.5 rounded-full flex items-center justify-center border border-teal-900">
                  {unreadCount}
                </span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 text-slate-800 p-4 space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <span className="font-bold text-xs">Clinical Notifications</span>
                  {unreadCount > 0 && (
                    <button 
                      onClick={handleMarkAllRead}
                      className="text-[10px] text-emerald-650 hover:text-emerald-700 font-bold hover:underline cursor-pointer"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                  {notifications.length === 0 ? (
                    <p className="text-center py-6 text-slate-400 text-[11px] font-medium">No recent alerts.</p>
                  ) : (
                    notifications.map(n => {
                      const isUnread = !n.readBy || !n.readBy.includes(currentUser?.username);
                      const isEmergency = n.type === 'emergency';
                      return (
                        <div 
                          key={n.id} 
                          className={`p-2.5 rounded-xl border transition-all text-left ${
                            isEmergency 
                              ? 'bg-rose-50/50 border-rose-250/60'
                              : isUnread 
                              ? 'bg-emerald-550/5 border-emerald-100/50' 
                              : 'bg-slate-50/50 border-slate-100'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <span className={`font-extrabold text-[11px] ${isEmergency ? 'text-rose-650' : 'text-slate-800'}`}>
                              {n.title}
                            </span>
                            <span className="text-[8px] font-bold text-slate-400 font-mono">
                              {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 font-semibold leading-relaxed mt-1">{n.message}</p>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between shrink-0 hidden md:flex transition-colors duration-300">
          <div className="space-y-6">
            <div className="flex items-center gap-3 px-2">
              <div className="bg-emerald-600 p-2 rounded-xl text-white">
                <HeartPulse className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-extrabold text-sm text-slate-800 font-heading">Clinical Hub</h2>
                <p className="text-[9px] text-slate-400 font-semibold tracking-widest uppercase">E-HEALTH CONSOLE</p>
              </div>
            </div>

            <nav className="space-y-1">
              {sidebarMenu.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm font-semibold tracking-wide transition-all cursor-pointer ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="h-4.5 w-4.5" />
                    {item.name}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="px-2">
              <p className="text-xs font-bold text-slate-700 leading-tight">{currentUser.name}</p>
              <p className="text-[10px] text-slate-400 font-medium capitalize mt-0.5">Role: <span className="font-bold">{currentUser.role}</span></p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-xs font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              Logout Session
            </button>
          </div>
        </aside>

        {/* Workspace */}
        <div className="flex-1 flex flex-col overflow-y-auto bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
          {/* Mobile Header */}
          <header className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-slate-200/80 px-6 py-4 flex justify-between items-center md:hidden">
            <div className="flex items-center gap-2">
              <HeartPulse className="h-5 w-5 text-emerald-600" />
              <span className="font-extrabold text-sm text-slate-850">Clinical Hub</span>
            </div>
            <button onClick={handleLogout} className="text-xs font-bold text-rose-500 hover:underline">
              Logout
            </button>
          </header>

          <main className="p-6 max-w-4xl w-full mx-auto space-y-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-emerald-600 to-teal-650 rounded-2xl p-6 text-white shadow-xl shadow-emerald-500/10">
                  <h2 className="text-2xl font-black font-heading">Operations Panel ({currentUser.role})</h2>
                  <p className="text-sm text-emerald-100/90 pt-1">Welcome back, <span className="font-bold underline">{currentUser.name}</span>. ABDM integration is currently active.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div className="bg-white border border-slate-200/80 p-5 rounded-2xl">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Checked In Today</span>
                    <span className="text-2xl font-black text-slate-800">{stats.checkedIn}</span>
                  </div>
                  <div className="bg-white border border-slate-200/80 p-5 rounded-2xl">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Currently Waiting</span>
                    <span className="text-2xl font-black text-slate-800">{stats.waiting}</span>
                  </div>
                  <div className="bg-white border border-slate-200/80 p-5 rounded-2xl">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Discharged Today</span>
                    <span className="text-2xl font-black text-slate-800">{stats.completed}</span>
                  </div>
                </div>

                <div className="bg-white border border-slate-200/80 p-5 rounded-2xl flex gap-4 text-xs text-slate-650 leading-relaxed font-semibold">
                  <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Identity Verification Standards:</strong>
                    <p className="text-slate-500 font-medium font-sans">Under Ministry guidelines, verify all clinical profiles using local authentication. Update passwords in security parameters regularly.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Reception Desk Tab (Receptionist Only) */}
            {activeTab === 'reception' && currentUser.role === 'receptionist' && (
              <ReceptionTab />
            )}

            {/* EMR Locker Tab (Both Doctors and Receptionists, Receptionist view-only) */}
            {activeTab === 'emr' && (
              <EMRTab readOnly={currentUser.role === 'receptionist'} />
            )}

            {/* Patients Registry Directory Tab (Doctor: View-Only, Receptionist: Full with Create) */}
            {activeTab === 'patients' && (
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-6">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-base text-slate-850 font-heading">Patients Directory</h3>
                    <p className="text-xs text-slate-400 font-medium">
                      {currentUser.role === 'doctor' ? 'View registered demographic health cards' : 'Manage patients profiles and registers'}
                    </p>
                  </div>
                  {currentUser.role === 'receptionist' && (
                    <button
                      onClick={() => setShowRegForm(!showRegForm)}
                      className="bg-emerald-650 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="h-4 w-4" /> Register New Patient
                    </button>
                  )}
                </div>

                {/* Registration Form Panel (Receptionist) */}
                {showRegForm && currentUser.role === 'receptionist' && (
                  <form onSubmit={handleRegisterPatient} className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-4 animate-fade-in max-w-lg">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Patient Demographics</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Patient Name</label>
                        <input
                          type="text"
                          required
                          value={regForm.name}
                          onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                          placeholder="Full Name"
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">14-Digit ABHA ID</label>
                        <input
                          type="text"
                          required
                          maxLength="14"
                          value={regForm.abha}
                          onChange={(e) => setRegForm({ ...regForm, abha: e.target.value })}
                          placeholder="e.g. 12345678901234"
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Phone Number</label>
                        <input
                          type="tel"
                          required
                          maxLength="10"
                          value={regForm.phone}
                          onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                          placeholder="10-digit mobile"
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Date of Birth</label>
                        <input
                          type="date"
                          required
                          value={regForm.dob}
                          onChange={(e) => setRegForm({ ...regForm, dob: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Gender</label>
                        <select
                          value={regForm.gender}
                          onChange={(e) => setRegForm({ ...regForm, gender: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-emerald-500 cursor-pointer text-slate-650 font-semibold"
                        >
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Locker Password</label>
                        <input
                          type="password"
                          required
                          value={regForm.password}
                          onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                          placeholder="Default password"
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="submit"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-lg text-xs transition-all cursor-pointer"
                      >
                        Register Patient
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowRegForm(false)}
                        className="bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-lg text-xs hover:bg-slate-350 transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {/* Patient Search and Table */}
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4.5 w-4.5" />
                    <input
                      type="text"
                      placeholder="Search patients by name, ABHA or phone..."
                      value={patientSearchQuery}
                      onChange={(e) => setPatientSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          <th className="pb-3">ID</th>
                          <th className="pb-3">Name</th>
                          <th className="pb-3">ABHA ID</th>
                          <th className="pb-3">Phone</th>
                          <th className="pb-3">DOB</th>
                          <th className="pb-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                        {filteredPatients.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="py-6 text-center text-slate-400">No patients found.</td>
                          </tr>
                        ) : (
                          filteredPatients.map(p => (
                            <tr key={p.id} className="hover:bg-slate-50">
                              <td className="py-3 font-mono font-bold text-slate-800">{p.id}</td>
                              <td className="py-3 font-bold text-slate-800">{p.name}</td>
                              <td className="py-3 font-mono text-[11px] text-slate-500">{p.abha}</td>
                              <td className="py-3 font-mono text-slate-500">{p.phone}</td>
                              <td className="py-3">{new Date(p.dob).toLocaleDateString()}</td>
                              <td className="py-3 text-right">
                                <button
                                  onClick={() => alert(`Demographics info:\n\nName: ${p.name}\nABHA ID: ${p.abha}\nPhone: ${p.phone}\nDOB: ${p.dob}\nGender: ${p.gender}\nStatus: ${p.status || 'Active'}`)}
                                  className="text-emerald-600 hover:text-emerald-700 font-bold hover:underline cursor-pointer"
                                >
                                  View Details
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Doctor's Own Roster Tab (Doctor: Own appointments, log vitals and consultation) */}
            {activeTab === 'appointments' && currentUser.role === 'doctor' && (
              <div className="space-y-6">
                {/* Clinical queues */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Vitals Form Card */}
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-4 shadow-sm">
                    <div>
                      <h3 className="font-bold text-base text-slate-850 font-heading">1. Record Vitals</h3>
                      <p className="text-xs text-slate-400 font-medium">Record patient body stats before starting consultation</p>
                    </div>

                    <form onSubmit={handleSaveVitals} className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Queued Patient</label>
                        <select
                          value={vitalsToken}
                          onChange={(e) => {
                            setVitalsToken(e.target.value);
                            const appt = appointments.find(a => a.token === e.target.value);
                            if (appt?.vitals) {
                              setVitalsForm({
                                temp: appt.vitals.temperature || '',
                                pulse: appt.vitals.pulse || '',
                                bpSys: appt.vitals.bloodPressure?.split('/')[0] || '',
                                bpDia: appt.vitals.bloodPressure?.split('/')[1] || '',
                                notes: appt.vitals.notes || ''
                              });
                            } else {
                              setVitalsForm({ temp: '', pulse: '', bpSys: '', bpDia: '', notes: '' });
                            }
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-emerald-500 cursor-pointer font-semibold text-slate-650"
                        >
                          <option value="">Select Token from Queue</option>
                          {vitalsQueue.map(v => (
                            <option key={v.id} value={v.token}>{v.token} - {v.patientName}</option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase">Temp (°F)</label>
                          <input
                            type="number"
                            step="0.1"
                            required
                            placeholder="e.g. 98.6"
                            value={vitalsForm.temp}
                            onChange={(e) => setVitalsForm({ ...vitalsForm, temp: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs outline-none focus:border-emerald-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase">Pulse (BPM)</label>
                          <input
                            type="number"
                            required
                            placeholder="e.g. 72"
                            value={vitalsForm.pulse}
                            onChange={(e) => setVitalsForm({ ...vitalsForm, pulse: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase">BP Systolic</label>
                          <input
                            type="number"
                            required
                            placeholder="mmHg"
                            value={vitalsForm.bpSys}
                            onChange={(e) => setVitalsForm({ ...vitalsForm, bpSys: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs outline-none focus:border-emerald-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase">BP Diastolic</label>
                          <input
                            type="number"
                            required
                            placeholder="mmHg"
                            value={vitalsForm.bpDia}
                            onChange={(e) => setVitalsForm({ ...vitalsForm, bpDia: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Vitals Notes</label>
                        <textarea
                          placeholder="Clinical assessment notes..."
                          value={vitalsForm.notes}
                          onChange={(e) => setVitalsForm({ ...vitalsForm, notes: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs outline-none focus:border-emerald-500"
                          rows="1"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={!vitalsToken}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white font-bold py-2.5 rounded-xl text-xs transition-all cursor-pointer"
                      >
                        Save Vitals Check
                      </button>
                    </form>
                  </div>

                  {/* Consultation Form Card */}
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-4 shadow-sm">
                    <div>
                      <h3 className="font-bold text-base text-slate-850 font-heading">2. Clinical Consultation</h3>
                      <p className="text-xs text-slate-400 font-medium">Record diagnosis and issue digital prescriptions</p>
                    </div>

                    <form onSubmit={handleSaveConsultation} className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Active Patient</label>
                        <select
                          value={consultToken}
                          onChange={(e) => setConsultToken(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-emerald-500 cursor-pointer font-semibold text-slate-650"
                        >
                          <option value="">Select Patient</option>
                          {consultQueue.map(c => (
                            <option key={c.id} value={c.token}>{c.token} - {c.patientName}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Chief Complaint</label>
                        <textarea
                          required
                          value={consultForm.complaint}
                          onChange={(e) => setConsultForm({ ...consultForm, complaint: e.target.value })}
                          placeholder="Primary symptoms..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs outline-none focus:border-emerald-500"
                          rows="1"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase">Clinical Diagnosis</label>
                          <input
                            type="text"
                            required
                            value={consultForm.diagnosis}
                            onChange={(e) => setConsultForm({ ...consultForm, diagnosis: e.target.value })}
                            placeholder="Diagnosis"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs outline-none focus:border-emerald-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase">Treatment Protocol</label>
                          <input
                            type="text"
                            value={consultForm.treatment}
                            onChange={(e) => setConsultForm({ ...consultForm, treatment: e.target.value })}
                            placeholder="Treatment"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      {/* Meds sub-form */}
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase">
                          <span>Medications</span>
                          <button
                            type="button"
                            onClick={handleAddMedication}
                            className="text-emerald-600 hover:underline flex items-center gap-0.5 cursor-pointer font-bold"
                          >
                            <Plus className="h-3.5 w-3.5" /> Add Drug
                          </button>
                        </div>
                        <div className="space-y-2 max-h-[100px] overflow-y-auto pr-1">
                          {medications.map((med, index) => (
                            <div key={index} className="grid grid-cols-4 gap-2 bg-slate-50 p-2 rounded border border-slate-200/50">
                              <input
                                type="text"
                                placeholder="Drug"
                                value={med.name}
                                onChange={(e) => handleMedicationChange(index, 'name', e.target.value)}
                                className="bg-white border rounded p-1 text-[10px] outline-none"
                              />
                              <input
                                type="text"
                                placeholder="Dose"
                                value={med.dosage}
                                onChange={(e) => handleMedicationChange(index, 'dosage', e.target.value)}
                                className="bg-white border rounded p-1 text-[10px] outline-none"
                              />
                              <input
                                type="text"
                                placeholder="Freq"
                                value={med.frequency}
                                onChange={(e) => handleMedicationChange(index, 'frequency', e.target.value)}
                                className="bg-white border rounded p-1 text-[10px] outline-none"
                              />
                              <input
                                type="text"
                                placeholder="Days"
                                value={med.duration}
                                onChange={(e) => handleMedicationChange(index, 'duration', e.target.value)}
                                className="bg-white border rounded p-1 text-[10px] outline-none"
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={!consultToken}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white font-bold py-2.5 rounded-xl text-xs transition-all cursor-pointer"
                      >
                        Complete Consultation Checkout
                      </button>
                    </form>
                  </div>
                </div>

                {/* Doctor's Own Appointment Roster list */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-4 shadow-sm">
                  <div>
                    <h3 className="font-bold text-base text-slate-850 font-heading">My Appointment Roster</h3>
                    <p className="text-xs text-slate-400 font-medium">All consultations assigned to you</p>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4.5 w-4.5" />
                    <input
                      type="text"
                      placeholder="Search appointments by Patient name or ID..."
                      value={appointmentSearchQuery}
                      onChange={(e) => setAppointmentSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          <th className="pb-3">ID</th>
                          <th className="pb-3">Patient</th>
                          <th className="pb-3">Date/Time</th>
                          <th className="pb-3">Type</th>
                          <th className="pb-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                        {filteredAppointments.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="py-6 text-center text-slate-400">No appointments found.</td>
                          </tr>
                        ) : (
                          filteredAppointments.map(a => (
                            <tr key={a.id} className="hover:bg-slate-50">
                              <td className="py-3 font-mono font-bold text-slate-800">{a.id}</td>
                              <td className="py-3 font-bold text-slate-800">{a.patientName}</td>
                              <td className="py-3">
                                <div>{new Date(a.date).toLocaleDateString()}</div>
                                <div className="text-[10px] text-slate-400 font-mono mt-0.5">{a.time}</div>
                              </td>
                              <td className="py-3">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                  a.type === 'emergency' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'
                                }`}>
                                  {a.type}
                                </span>
                              </td>
                              <td className="py-3 text-center">
                                <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                  a.status === 'completed'
                                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                    : a.status === 'scheduled'
                                    ? 'bg-amber-100 text-amber-700 border border-amber-250'
                                    : 'bg-rose-100 text-rose-700 border border-rose-200'
                                }`}>
                                  {a.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Receptionist Appointments Management Tab (Full access: Roster view, book, cancel, reschedule) */}
            {activeTab === 'appointments' && currentUser.role === 'receptionist' && (
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-6">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-base text-slate-850 font-heading">Appointments Desk</h3>
                    <p className="text-xs text-slate-400 font-medium">Book, reschedule, or cancel patient visits</p>
                  </div>
                  <button
                    onClick={() => setShowBookForm(!showBookForm)}
                    className="bg-emerald-650 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="h-4 w-4" /> Book Appointment
                  </button>
                </div>

                {/* Booking Form (Receptionist) */}
                {showBookForm && (
                  <form onSubmit={handleBookAppointment} className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-4 animate-fade-in max-w-lg">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">New Appointment Form</h4>
                    
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-slate-400 uppercase">Select Patient</label>
                      <select
                        value={bookForm.patientId}
                        onChange={(e) => setBookForm({ ...bookForm, patientId: e.target.value })}
                        required
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs outline-none cursor-pointer"
                      >
                        <option value="">Choose Patient</option>
                        {patients.map(p => (
                          <option key={p.id} value={p.id}>{p.name} (ID: {p.id})</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Department</label>
                        <select
                          value={bookForm.department}
                          onChange={(e) => setBookForm({ ...bookForm, department: e.target.value })}
                          required
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs outline-none cursor-pointer"
                        >
                          <option value="">Choose Dept</option>
                          <option value="cardiology">Cardiology</option>
                          <option value="pediatrics">Pediatrics</option>
                          <option value="orthopedics">Orthopedics</option>
                          <option value="dermatology">Dermatology</option>
                          <option value="general">General Medicine</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Practitioner</label>
                        <select
                          value={bookForm.doctor}
                          onChange={(e) => setBookForm({ ...bookForm, doctor: e.target.value })}
                          required
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs outline-none cursor-pointer"
                        >
                          <option value="">Choose Doctor</option>
                          {doctors.filter(d => !bookForm.department || d.department === bookForm.department).map(d => (
                            <option key={d.id} value={d.name}>{d.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Date of Visit</label>
                        <input
                          type="date"
                          required
                          min={new Date().toISOString().split('T')[0]}
                          value={bookForm.date}
                          onChange={(e) => setBookForm({ ...bookForm, date: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs outline-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Time Slot</label>
                        <select
                          value={bookForm.time}
                          onChange={(e) => setBookForm({ ...bookForm, time: e.target.value })}
                          required
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs outline-none cursor-pointer"
                        >
                          <option value="">Select Time</option>
                          <option value="09:00 AM">09:00 AM</option>
                          <option value="10:00 AM">10:00 AM</option>
                          <option value="11:00 AM">11:00 AM</option>
                          <option value="02:00 PM">02:00 PM</option>
                          <option value="03:00 PM">03:00 PM</option>
                          <option value="04:00 PM">04:00 PM</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Consultation Type</label>
                        <select
                          value={bookForm.type}
                          onChange={(e) => setBookForm({ ...bookForm, type: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs outline-none cursor-pointer"
                        >
                          <option value="opd">OPD (In-Person)</option>
                          <option value="telemedicine">Telemedicine (Online)</option>
                          <option value="emergency">Emergency Case</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Reason</label>
                        <input
                          type="text"
                          value={bookForm.reason}
                          onChange={(e) => setBookForm({ ...bookForm, reason: e.target.value })}
                          placeholder="e.g. Fever, general checkup"
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="submit"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-lg text-xs transition-all cursor-pointer"
                      >
                        Confirm Booking
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowBookForm(false)}
                        className="bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-lg text-xs hover:bg-slate-350 transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {/* All Appointments Table */}
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4.5 w-4.5" />
                    <input
                      type="text"
                      placeholder="Search appointments by Patient name, Doctor, or ID..."
                      value={appointmentSearchQuery}
                      onChange={(e) => setAppointmentSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          <th className="pb-3">ID</th>
                          <th className="pb-3">Patient</th>
                          <th className="pb-3">Doctor</th>
                          <th className="pb-3">Date & Time</th>
                          <th className="pb-3">Type</th>
                          <th className="pb-3">Status</th>
                          <th className="pb-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                        {filteredAppointments.length === 0 ? (
                          <tr>
                            <td colSpan="7" className="py-6 text-center text-slate-400">No appointments found.</td>
                          </tr>
                        ) : (
                          filteredAppointments.map(a => (
                            <tr key={a.id} className="hover:bg-slate-50">
                              <td className="py-3 font-mono font-bold text-slate-800">{a.id}</td>
                              <td className="py-3 font-bold text-slate-800">{a.patientName}</td>
                              <td className="py-3 text-slate-700">{a.doctor}</td>
                              <td className="py-3">
                                <div>{new Date(a.date).toLocaleDateString()}</div>
                                <div className="text-[10px] text-slate-400 font-mono mt-0.5">{a.time}</div>
                              </td>
                              <td className="py-3">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                  a.type === 'emergency' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'
                                }`}>
                                  {a.type}
                                </span>
                              </td>
                              <td className="py-3">
                                <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                  a.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : a.status === 'scheduled' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                                }`}>
                                  {a.status}
                                </span>
                              </td>
                              <td className="py-3 text-right">
                                {a.status === 'scheduled' ? (
                                  <div className="flex justify-end gap-2">
                                    <button
                                      onClick={() => {
                                        setRescheduleApt(a);
                                        setRescheduleForm({ date: a.date, time: a.time });
                                      }}
                                      className="text-indigo-600 hover:text-indigo-850 p-1 hover:bg-slate-100 rounded"
                                      title="Reschedule"
                                    >
                                      <CalendarClock className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => handleCancelAppointment(a.id)}
                                      className="text-rose-500 hover:text-rose-700 p-1 hover:bg-slate-100 rounded"
                                      title="Cancel"
                                    >
                                      <Ban className="h-4 w-4" />
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-[9px] font-mono text-slate-400">ARCHIVED</span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Reschedule Modal */}
            {rescheduleApt && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 relative">
                  <h3 className="text-sm font-black text-slate-800 mb-4">Reschedule Appointment</h3>
                  <form onSubmit={handleRescheduleSubmit} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase">New Date</label>
                      <input
                        type="date"
                        required
                        value={rescheduleForm.date}
                        onChange={(e) => setRescheduleForm({ ...rescheduleForm, date: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase">New Time</label>
                      <select
                        value={rescheduleForm.time}
                        onChange={(e) => setRescheduleForm({ ...rescheduleForm, time: e.target.value })}
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-none cursor-pointer"
                      >
                        <option value="">Select Time</option>
                        <option value="09:00 AM">09:00 AM</option>
                        <option value="10:00 AM">10:00 AM</option>
                        <option value="11:00 AM">11:00 AM</option>
                        <option value="02:00 PM">02:00 PM</option>
                        <option value="03:00 PM">03:00 PM</option>
                        <option value="04:00 PM">04:00 PM</option>
                      </select>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setRescheduleApt(null)}
                        className="bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-lg text-xs"
                      >
                        Close
                      </button>
                      <button
                        type="submit"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-lg text-xs"
                      >
                        Confirm Slot
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Doctors Clinical Team Directory Tab (Doctor View-Only, Receptionist No Access) */}
            {activeTab === 'doctors' && currentUser.role === 'doctor' && (
              <div className="card-surface p-6 space-y-4 shadow-sm">
                <div>
                  <h3 className="font-bold text-base text-slate-800 dark:text-white font-heading">Clinical Medical Team</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Verify credentials and specialist rosters</p>
                </div>

                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-900/40">
                        <th className="py-3.5 px-4">Doctor</th>
                        <th className="py-3.5 px-4">Specialization</th>
                        <th className="py-3.5 px-4">Department</th>
                        <th className="py-3.5 px-4">Experience</th>
                        <th className="py-3.5 px-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 dark:divide-slate-800/60 font-medium text-slate-600 dark:text-slate-350">
                      {doctors.map(d => (
                        <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-800 dark:text-white">{d.name}</td>
                          <td className="py-3 text-slate-600">{d.specialization}</td>
                          <td className="py-3 text-slate-400 capitalize">{d.department}</td>
                          <td className="py-3 text-slate-500">{d.experience}</td>
                          <td className="py-3 text-right">
                            <span 
                              onClick={() => d.name === currentUser.name && handleToggleAvailability(d.id)}
                              className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase transition-all ${
                                d.status === 'Available' ? 'bg-emerald-100 text-emerald-700 font-extrabold' : 'bg-slate-100 text-slate-550'
                              } ${d.name === currentUser.name ? 'cursor-pointer hover:scale-105 active:scale-95 border border-emerald-250' : ''}`}
                              title={d.name === currentUser.name ? 'Click to toggle availability' : undefined}
                            >
                              {d.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Billing Desk Tab (Receptionist Only) */}
            {activeTab === 'billing' && currentUser.role === 'receptionist' && (
              <BillingTab />
            )}

            {/* Doctor Limited Analytics Tab (Doctor Only) */}
            {activeTab === 'analytics' && currentUser.role === 'doctor' && doctorAnalytics && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-base text-slate-850 font-heading">Clinical Performance Insights</h3>
                  <p className="text-xs text-slate-400 font-medium">Your personal clinical performance statistics</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Completion Chart */}
                  <div className="card-surface p-6 space-y-4 flex flex-col justify-between shadow-sm">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Completion Success Index</h4>
                    <div className="h-44 w-full relative flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={doctorAnalytics.completionData}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={65}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {doctorAnalytics.completionData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: chartColors.tooltipBg, borderColor: chartColors.tooltipBorder, borderRadius: 8, color: chartColors.tooltipText, fontSize: 11 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex gap-4 justify-center text-[10px] font-semibold text-slate-400 dark:text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
                      {doctorAnalytics.completionData.map(item => (
                        <div key={item.name} className="flex items-center gap-1.5">
                          <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                          <span>{item.name}: <strong className="text-slate-800 dark:text-white font-mono">{item.value}</strong></span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Consultation Type Chart */}
                  <div className="card-surface p-6 space-y-4 flex flex-col justify-between shadow-sm">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Consultation Outlets</h4>
                    <div className="h-44 w-full relative flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={doctorAnalytics.consultTypeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                          <XAxis dataKey="name" stroke={chartColors.axisText} style={{ fontSize: 9 }} />
                          <YAxis stroke={chartColors.axisText} style={{ fontSize: 9 }} />
                          <Tooltip contentStyle={{ backgroundColor: chartColors.tooltipBg, borderColor: chartColors.tooltipBorder, borderRadius: 8, color: chartColors.tooltipText, fontSize: 11 }} />
                          <Bar dataKey="value" fill={chartColors.indigo} radius={[4, 4, 0, 0]}>
                            {doctorAnalytics.consultTypeData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="text-center text-[10px] font-bold text-slate-400 dark:text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
                      Total Consultations: <strong className="text-slate-800 dark:text-white font-mono">{doctorAnalytics.total}</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Security Change Password Tab (Both) */}
            {activeTab === 'settings' && (
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 max-w-md space-y-5 shadow-sm">
                <div>
                  <h3 className="font-bold text-base text-slate-850 font-heading">Security Credentials</h3>
                  <p className="text-xs text-slate-400 font-medium font-sans">Update your clinical provider dashboard access password</p>
                </div>

                {securityError && <div className="bg-rose-100 border border-rose-250 text-rose-700 text-xs p-3.5 rounded-xl font-medium">{securityError}</div>}
                {securitySuccess && <div className="bg-emerald-100 border border-emerald-250 text-emerald-700 text-xs p-3.5 rounded-xl font-medium">{securitySuccess}</div>}

                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Current Password</label>
                    <input
                      type="password"
                      required
                      value={securityForm.oldPassword}
                      onChange={(e) => setSecurityForm({ ...securityForm, oldPassword: e.target.value })}
                      placeholder="Enter current password"
                      className="w-full input-surface"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">New Password</label>
                    <input
                      type="password"
                      required
                      value={securityForm.newPassword}
                      onChange={(e) => setSecurityForm({ ...securityForm, newPassword: e.target.value })}
                      placeholder="Enter new password"
                      className="w-full input-surface"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Confirm New Password</label>
                    <input
                      type="password"
                      required
                      value={securityForm.confirmPassword}
                      onChange={(e) => setSecurityForm({ ...securityForm, confirmPassword: e.target.value })}
                      placeholder="Confirm new password"
                      className="w-full input-surface"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-xs transition-all shadow-md cursor-pointer"
                  >
                    Change Security Password
                  </button>
                </form>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
