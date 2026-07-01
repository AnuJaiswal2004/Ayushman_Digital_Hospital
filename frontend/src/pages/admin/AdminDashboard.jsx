import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, Award, Building, BarChart3, Settings, LogOut, Shield, HeartPulse, Menu, X, ListOrdered, FileSpreadsheet, Bell, Receipt, FileText } from 'lucide-react';
import { apiService } from '../../services/api.js';

// Import sub-tabs
import OverviewTab from './tabs/OverviewTab.jsx';
import PatientsTab from './tabs/PatientsTab.jsx';
import AppointmentsTab from './tabs/AppointmentsTab.jsx';
import DoctorsTab from './tabs/DoctorsTab.jsx';
import DepartmentsTab from './tabs/DepartmentsTab.jsx';
import AnalyticsTab from './tabs/AnalyticsTab.jsx';
import SettingsTab from './tabs/SettingsTab.jsx';
import ReceptionTab from '../staff/tabs/ReceptionTab.jsx';
import EMRTab from '../staff/tabs/EMRTab.jsx';
import BillingTab from '../staff/tabs/BillingTab.jsx';
import ReportsTab from './tabs/ReportsTab.jsx';
import ThemeToggle from '../../components/ThemeToggle.jsx';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [currentUser, setCurrentUser] = useState(null);
  const [hospitalName, setHospitalName] = useState('Ayushman Digital Hospital');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Notifications State
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const loadNotifications = async (userObj) => {
    if (!userObj) return;
    const allNoti = await apiService.getNotifications();
    const userNotis = allNoti.filter(n => {
      return n.targetRoles && (n.targetRoles.includes('admin') || n.targetRoles.includes('superadmin') || n.targetRoles.includes(userObj.role));
    });
    setNotifications(userNotis);
  };

  const handleMarkAllRead = async () => {
    if (!currentUser) return;
    await apiService.markNotificationsAsRead(currentUser.username);
    loadNotifications(currentUser);
  };

  const unreadCount = notifications.filter(n => !n.readBy || !n.readBy.includes(currentUser?.username)).length;

  useEffect(() => {
    // Check authentication
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) {
      navigate('/');
      return;
    }
    const user = JSON.parse(userStr);
    if (user.role !== 'admin' && user.role !== 'superadmin') {
      navigate('/');
      return;
    }
    setCurrentUser(user);
    loadNotifications(user);

    // Fetch Settings for Hospital Name
    const fetchSettings = async () => {
      const settings = await apiService.getSettings();
      if (settings && settings.hospitalName) {
        setHospitalName(settings.hospitalName);
      }
    };
    fetchSettings();

    // Poll for notifications
    const interval = setInterval(() => loadNotifications(user), 5000);
    return () => clearInterval(interval);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate('/');
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSidebarOpen(false); // Close sidebar on mobile
  };

  if (!currentUser) return null;

  const menuItems = [
    { id: 'overview', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'patients', name: 'Patients', icon: Users },
    { id: 'appointments', name: 'Appointments', icon: Calendar },
    { id: 'doctors', name: 'Doctors', icon: Award },
    { id: 'departments', name: 'Departments', icon: Building },
    { id: 'reception', name: 'Reception Desk', icon: ListOrdered },
    { id: 'emr', name: 'EMR Locker', icon: FileSpreadsheet },
    { id: 'billing', name: 'Billing Desk', icon: Receipt },
    { id: 'reports', name: 'Reports Desk', icon: FileText },
    { id: 'analytics', name: 'Analytics', icon: BarChart3 },
    { id: 'settings', name: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans select-none antialiased transition-colors duration-300">
      {/* Top Banner (ABDM National Health Authority Styling) */}
      <div className="bg-gradient-to-r from-blue-950 to-indigo-950 text-white text-[10px] md:text-xs py-1.5 px-4 flex justify-between items-center border-b border-indigo-950/60 z-50">
        <div className="flex items-center gap-4">
          <span className="font-semibold tracking-wider opacity-80">GOVERNMENT OF INDIA</span>
          <span className="hidden md:inline text-indigo-500">|</span>
          <span className="hidden md:inline font-light opacity-60">ABDM DASHBOARD CONSOLE</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-blue-600/30 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full font-bold text-[9px] uppercase">
            {currentUser?.role === 'superadmin' ? 'SUPER ADMIN PRIVILEGES' : 'ADMIN PRIVILEGES'}
          </span>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar for Desktop */}
        <aside className="hidden lg:flex flex-col w-64 bg-slate-50 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 p-5 shrink-0 transition-colors duration-300">
          {/* Sidebar Logo */}
          <div className="flex items-center gap-3 mb-8 px-2">
            <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-blue-500/20">
              <HeartPulse className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white font-heading">
                Ayushman Console
              </h2>
              <p className="text-[9px] text-indigo-500 dark:text-indigo-400 font-semibold tracking-widest uppercase">SYSTEM CONTROL</p>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold tracking-wide transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/10'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-900'
                  }`}
                >
                  <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-800 dark:group-hover:text-white'}`} />
                  {item.name}
                </button>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800/80">
            <div className="flex items-center gap-3 px-2 mb-4">
              <div className="bg-slate-200 dark:bg-slate-800 p-2 rounded-full text-slate-700 dark:text-slate-300">
                <Shield className="h-4 w-4" />
              </div>
              <div className="truncate text-left">
                <p className="text-xs font-bold text-slate-800 dark:text-white leading-none truncate max-w-[120px]">{currentUser?.name || 'Admin Admin'}</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium capitalize mt-0.5">{currentUser?.role || 'System Operator'}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold text-rose-500 dark:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              Logout Session
            </button>
          </div>
        </aside>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div 
            className="lg:hidden fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Mobile Sidebar */}
        <aside className={`lg:hidden fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-950 border-r border-slate-800 p-5 transform transition-transform duration-350 flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex justify-between items-center mb-8 px-2">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-2 rounded-lg text-white">
                <HeartPulse className="h-5 w-5" />
              </div>
              <span className="font-extrabold text-sm text-white">Ayushman Admin</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="text-slate-400 hover:text-white">
              <X className="h-6 w-6" />
            </button>
          </div>

          <nav className="flex-1 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Icon className="h-4.5 w-4.5" />
                  {item.name}
                </button>
              );
            })}
          </nav>

          <div className="pt-4 border-t border-slate-800">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              Logout Session
            </button>
          </div>
        </aside>

        {/* Main Workspace */}
        <div className="flex-1 flex flex-col overflow-y-auto bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
          {/* Workspace Top Header */}
          <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800/80 px-6 py-4 flex justify-between items-center transition-colors duration-300">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded"
              >
                <Menu className="h-6 w-6" />
              </button>
              <div className="text-left">
                <h1 className="font-black text-xl text-slate-900 dark:text-white font-heading">
                  {menuItems.find((m) => m.id === activeTab)?.name || 'Dashboard'}
                </h1>
                <p className="text-xs text-slate-400 font-medium hidden sm:block">
                  Connected: <span className="text-blue-500 dark:text-blue-400 font-semibold">{hospitalName}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 md:gap-4">
              <div className="bg-slate-200/60 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-300/50 dark:border-slate-700/50 hidden md:flex items-center gap-2 animate-pulse-soft">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 tracking-wide">SYSTEM OK</span>
              </div>
              
              <ThemeToggle />
              
              {/* Notifications Bell */}
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 transition-all relative cursor-pointer flex items-center text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white"
                >
                  <Bell className="h-4.5 w-4.5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[7px] font-black h-3.5 w-3.5 rounded-full flex items-center justify-center border border-slate-900">
                      {unreadCount}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-85 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 text-slate-800 dark:text-slate-200 p-4 space-y-3">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-850">
                      <span className="font-bold text-xs text-slate-800 dark:text-white">System Alerts</span>
                      {unreadCount > 0 && (
                        <button 
                          onClick={handleMarkAllRead}
                          className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline font-bold cursor-pointer"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                      {notifications.length === 0 ? (
                        <p className="text-center py-6 text-slate-500 text-[11px] font-medium">No recent alerts.</p>
                      ) : (
                        notifications.map(n => {
                          const isUnread = !n.readBy || !n.readBy.includes(currentUser?.username);
                          const isEmergency = n.type === 'emergency';
                          return (
                            <div 
                              key={n.id} 
                              className={`p-2.5 rounded-xl border transition-all text-left ${
                                isEmergency 
                                  ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/25 text-rose-700 dark:text-rose-400'
                                  : isUnread 
                                  ? 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800' 
                                  : 'bg-white dark:bg-slate-900/60 border-slate-100 dark:border-slate-800/80 opacity-75'
                              }`}
                            >
                              <div className="flex justify-between items-start">
                                <span className={`font-extrabold text-[11px] ${isEmergency ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-white'}`}>
                                  {n.title}
                                </span>
                                <span className="text-[8px] font-bold text-slate-500 font-mono">
                                  {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold leading-relaxed mt-1">{n.message}</p>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="text-right text-xs">
                <span className="block text-slate-400">Date/Time</span>
                <span className="font-semibold text-slate-600 dark:text-white font-mono text-[11px]">2026-06-14</span>
              </div>
            </div>
          </header>

          {/* Sub-tab viewport */}
          <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
            {activeTab === 'overview' && <OverviewTab />}
            {activeTab === 'patients' && <PatientsTab />}
            {activeTab === 'appointments' && <AppointmentsTab />}
            {activeTab === 'doctors' && <DoctorsTab />}
            {activeTab === 'departments' && <DepartmentsTab />}
            {activeTab === 'reception' && (
              <div className="card-surface p-6">
                <ReceptionTab />
              </div>
            )}
            {activeTab === 'emr' && (
              <div className="card-surface p-6">
                <EMRTab />
              </div>
            )}
            {activeTab === 'billing' && (
              <div className="card-surface p-6">
                <BillingTab />
              </div>
            )}
            {activeTab === 'reports' && (
              <div className="card-surface p-6">
                <ReportsTab />
              </div>
            )}
            {activeTab === 'analytics' && <AnalyticsTab />}
            {activeTab === 'settings' && <SettingsTab setHospitalName={setHospitalName} />}
          </main>
        </div>
      </div>
    </div>
  );
}
