import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  HeartPulse, LayoutDashboard, Calendar, PlusCircle, 
  Pill, FileSpreadsheet, User, LogOut, Info, Bell,
  Search, ShieldAlert, Award, FileText, CheckCircle2, ChevronRight
} from 'lucide-react';
import { apiService } from '../../services/api.js';
import EMRTab from '../staff/tabs/EMRTab.jsx';
import ThemeToggle from '../../components/ThemeToggle.jsx';
import Card from '../../components/ui/Card.jsx';
import Input from '../../components/ui/Input.jsx';
import Select from '../../components/ui/Select.jsx';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Table from '../../components/ui/Table.jsx';
import Modal from '../../components/ui/Modal.jsx';

export default function PatientDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [currentUser, setCurrentUser] = useState(null);
  const [patientDetails, setPatientDetails] = useState(null);
  
  // Data lists
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);

  // Notifications State
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Booking Form State
  const [bookingForm, setBookingForm] = useState({
    department: '',
    doctor: '',
    date: '',
    time: '',
    type: 'opd',
    reason: ''
  });

  // Change Password State
  const [securityForm, setSecurityForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [securityError, setSecurityError] = useState('');
  const [securitySuccess, setSecuritySuccess] = useState('');

  const loadNotifications = async (userObj) => {
    if (!userObj) return;
    const allNoti = await apiService.getNotifications();
    const userNotis = allNoti.filter(n => {
      return n.targetUserId === userObj.id || (n.targetRoles && n.targetRoles.includes('patient') && !n.targetUserId);
    });
    setNotifications(userNotis.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
  };

  const handleMarkAllRead = async () => {
    if (!currentUser) return;
    await apiService.markNotificationsAsRead(currentUser.id);
    loadNotifications(currentUser);
  };

  const unreadCount = notifications.filter(n => !n.readBy || !n.readBy.includes(currentUser?.id)).length;

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setSecurityError('');
    setSecuritySuccess('');

    if (securityForm.newPassword !== securityForm.confirmPassword) {
      setSecurityError('New passwords do not match');
      return;
    }

    const res = await apiService.changePassword(
      currentUser.abha || currentUser.phone,
      securityForm.oldPassword,
      securityForm.newPassword,
      'patient'
    );

    if (res.success) {
      setSecuritySuccess('Password changed successfully!');
      setSecurityForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      const updatedUser = { ...currentUser, password: securityForm.newPassword };
      setCurrentUser(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    } else {
      setSecurityError(res.message || 'Failed to change password');
    }
  };

  const loadData = async (patientId) => {
    const list = await apiService.getAppointments();
    const docList = await apiService.getDoctors();
    const patientsList = await apiService.getPatients();
    
    setAppointments(list.filter(a => a.patientId === patientId));
    setDoctors(docList);

    const foundPatient = patientsList.find(p => p.id === patientId);
    if (foundPatient) {
      setPatientDetails(foundPatient);
    }
  };

  useEffect(() => {
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) {
      navigate('/');
      return;
    }
    const user = JSON.parse(userStr);
    if (user.role !== 'patient') {
      navigate('/');
      return;
    }
    setCurrentUser(user);
    loadData(user.id);
    loadNotifications(user);

    // Poll for notifications
    const interval = setInterval(() => loadNotifications(user), 6000);
    return () => clearInterval(interval);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate('/');
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    const { department, doctor, date, time, type, reason } = bookingForm;

    if (!department || !doctor || !date || !time) {
      alert('Please fill all required fields');
      return;
    }

    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      alert('Cannot book appointments in the past');
      return;
    }

    try {
      await apiService.bookAppointment({
        patientId: currentUser.id,
        patientName: currentUser.name,
        department,
        doctor,
        date,
        time,
        type,
        reason
      });
      alert('Appointment booked successfully!');
      setBookingForm({ department: '', doctor: '', date: '', time: '', type: 'opd', reason: '' });
      loadData(currentUser.id);
      setActiveTab('appointments');
    } catch (err) {
      alert('Failed to book appointment');
    }
  };

  if (!currentUser) return null;

  const upcomingAppointments = appointments.filter(a => a.status === 'scheduled');
  const completedAppointments = appointments.filter(a => a.status === 'completed');
  
  // Calculate active prescriptions
  const activePrescriptionsCount = appointments.filter(
    a => a.status === 'completed' && a.consultation?.medications?.length > 0
  ).length;

  // Calculate lab records
  const labRecordsCount = patientDetails?.emr?.labTests?.length || 0;

  // Filter doctors list based on selected department in booking form
  const filteredDoctors = doctors.filter(
    d => !bookingForm.department || d.department === bookingForm.department
  );

  const sidebarMenu = [
    { id: 'overview', name: 'Overview', icon: LayoutDashboard },
    { id: 'appointments', name: 'My Appointments', icon: Calendar },
    { id: 'book', name: 'Book Appointment', icon: PlusCircle },
    { id: 'prescriptions', name: 'Prescriptions', icon: Pill },
    { id: 'emr', name: 'EMR Portal', icon: FileSpreadsheet },
    { id: 'profile', name: 'My Profile', icon: User },
  ];

  return (
    <div className="min-h-screen page-surface flex flex-col font-sans select-none antialiased transition-colors duration-300">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white text-xs py-2 px-4 flex justify-between items-center border-b border-indigo-950">
        <div className="flex items-center gap-4">
          <span className="font-semibold tracking-wider">GOVERNMENT OF INDIA</span>
          <span className="hidden md:inline text-blue-200">|</span>
          <span className="hidden md:inline font-light">AYUSHMAN BHARAT DIGITAL MISSION</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-red-500 text-white px-2 py-0.5 rounded-full font-bold text-[9px] animate-pulse-soft hidden sm:inline-block">
            SECURE PORTAL
          </div>
          
          <ThemeToggle />
          
          {/* Notifications Bell */}
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-1 hover:bg-white/10 rounded-full transition-colors relative cursor-pointer flex items-center"
            >
              <Bell className="h-4 w-4 text-white" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[7px] font-black h-3.5 w-3.5 rounded-full flex items-center justify-center border border-indigo-900">
                  {unreadCount}
                </span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 text-slate-800 dark:text-slate-100 p-4 space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
                  <span className="font-bold text-xs">Notifications Locker</span>
                  {unreadCount > 0 && (
                    <button 
                      onClick={handleMarkAllRead}
                      className="text-[10px] text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                  {notifications.length === 0 ? (
                    <p className="text-center py-6 text-slate-400 dark:text-slate-500 text-[11px] font-medium">No recent notifications.</p>
                  ) : (
                    notifications.map(n => {
                      const isUnread = !n.readBy || !n.readBy.includes(currentUser?.id);
                      return (
                        <div 
                          key={n.id} 
                          className={`p-2.5 rounded-xl border transition-all text-left ${
                            isUnread 
                              ? 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-100/50 dark:border-blue-800/40' 
                              : 'bg-slate-50/50 dark:bg-slate-950 border-slate-100 dark:border-slate-800/50'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <span className="font-extrabold text-[11px] text-slate-800 dark:text-white">{n.title}</span>
                            <span className="text-[8px] font-bold text-slate-500 dark:text-slate-500 font-mono">
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
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between shrink-0 hidden md:flex transition-colors duration-350">
          <div className="space-y-6">
            <div className="flex items-center gap-3 px-2">
              <div className="bg-blue-600 p-2 rounded-xl text-white">
                <HeartPulse className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-extrabold text-sm text-slate-800 dark:text-white font-heading">Patient Hub</h2>
                <p className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold tracking-widest uppercase">My Healthcare</p>
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
                        ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/20'
                    }`}
                  >
                    <Icon className="h-4.5 w-4.5" />
                    {item.name}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <div className="px-2">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{currentUser.name}</p>
              <p className="text-[10px] font-mono text-slate-500 dark:text-slate-500">ABHA: {currentUser.abha}</p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-xs font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              Logout Portal
            </button>
          </div>
        </aside>

        {/* Workspace */}
        <div className="flex-1 flex flex-col overflow-y-auto bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
          {/* Mobile Header */}
          <header className="sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur border-b border-slate-200/80 dark:border-slate-800 px-6 py-4 flex justify-between items-center md:hidden">
            <div className="flex items-center gap-2">
              <HeartPulse className="h-5 w-5 text-blue-600" />
              <span className="font-extrabold text-sm text-slate-800 dark:text-white font-heading">Patient Hub</span>
            </div>
            <button onClick={handleLogout} className="text-xs font-bold text-rose-500 hover:underline">
              Logout
            </button>
          </header>

          <main className="p-6 max-w-4xl w-full mx-auto space-y-6">
            {/* Header banner */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-650 rounded-2xl p-6 text-white shadow-xl shadow-blue-500/10 text-left">
              <h2 className="text-2xl font-black font-heading">Welcome, {currentUser.name}!</h2>
              <p className="text-sm text-blue-100/90 pt-1">Access your healthcare logs, retrieve digital prescriptions, or book active consultations.</p>
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="flex flex-col justify-between p-5 text-left">
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Scheduled Visits</span>
                    <span className="text-2xl font-black text-slate-900 dark:text-white mt-2">{upcomingAppointments.length}</span>
                  </Card>
                  <Card className="flex flex-col justify-between p-5 text-left">
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Completed Visits</span>
                    <span className="text-2xl font-black text-slate-900 dark:text-white mt-2">{completedAppointments.length}</span>
                  </Card>
                  <Card className="flex flex-col justify-between p-5 text-left">
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Active Scripts</span>
                    <span className="text-2xl font-black text-slate-900 dark:text-white mt-2">{activePrescriptionsCount}</span>
                  </Card>
                  <Card className="flex flex-col justify-between p-5 text-left">
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Lab Records</span>
                    <span className="text-2xl font-black text-slate-900 dark:text-white mt-2">{labRecordsCount}</span>
                  </Card>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200/85 dark:border-slate-800 p-5 rounded-2xl flex gap-4 text-xs font-semibold text-slate-600 dark:text-slate-300 text-left">
                  <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5 pointer-events-none" />
                  <div className="space-y-1">
                    <strong className="text-slate-800 dark:text-white">Ayushman Bharat Card Synced:</strong>
                    <p className="text-slate-500 dark:text-slate-400 font-medium font-sans">Your identity is linked with ABDM. Clinicians can retrieve vitals and write prescriptions directly to your health locker using your 14-digit ABHA ID.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Appointments Tab */}
            {activeTab === 'appointments' && (
              <Card className="space-y-4 text-left">
                <h3 className="font-bold text-base text-slate-900 dark:text-white font-heading">My Appointment Schedule</h3>
                
                {appointments.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 dark:text-slate-500 font-medium text-sm">
                    No registered appointments found. Book your first session.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {appointments.map((appt) => (
                      <div key={appt.id} className="bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                          <Badge 
                            variant={
                              appt.status === 'completed' ? 'success' : 
                              appt.status === 'scheduled' ? 'warning' : 'danger'
                            }
                          >
                            {appt.status}
                          </Badge>
                          <h4 className="font-bold text-slate-800 dark:text-white text-sm capitalize mt-1.5">{appt.department} Consultation</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Practitioner: <strong className="text-slate-700 dark:text-slate-300 font-semibold">{appt.doctor}</strong></p>
                        </div>
                        <div className="text-left sm:text-right font-medium text-xs text-slate-500 dark:text-slate-400 space-y-1">
                          <p>Date: <span className="text-slate-800 dark:text-white font-bold">{new Date(appt.date).toLocaleDateString()}</span></p>
                          <p>Time Slot: <span className="text-slate-800 dark:text-white font-bold font-mono text-[11px]">{appt.time}</span></p>
                          <span className="uppercase text-[9px] font-black text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded inline-block">{appt.type}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* Book Appointment Tab */}
            {activeTab === 'book' && (
              <Card className="max-w-xl text-left space-y-5">
                <h3 className="font-bold text-base text-slate-900 dark:text-white font-heading">Request Consultation</h3>
                
                <form onSubmit={handleBookingSubmit} className="space-y-4">
                  <Select
                    label="Clinical Department"
                    value={bookingForm.department}
                    onChange={(e) => setBookingForm({ ...bookingForm, department: e.target.value, doctor: '' })}
                    options={[
                      { value: '', label: 'Select Department' },
                      { value: 'cardiology', label: 'Cardiology' },
                      { value: 'pediatrics', label: 'Pediatrics' },
                      { value: 'orthopedics', label: 'Orthopedics' },
                      { value: 'dermatology', label: 'Dermatology' },
                      { value: 'general', label: 'General Medicine' }
                    ]}
                  />

                  <Select
                    label="Select Practitioner"
                    value={bookingForm.doctor}
                    onChange={(e) => setBookingForm({ ...bookingForm, doctor: e.target.value })}
                    disabled={!bookingForm.department}
                    options={[
                      { value: '', label: 'Choose Doctor' },
                      ...filteredDoctors.map(doc => ({ value: doc.name, label: `${doc.name} - ${doc.specialization}` }))
                    ]}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Date of Visit"
                      type="date"
                      value={bookingForm.date}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                    />

                    <Select
                      label="Preferred Time Slot"
                      value={bookingForm.time}
                      onChange={(e) => setBookingForm({ ...bookingForm, time: e.target.value })}
                      options={[
                        { value: '', label: 'Select Time Slot' },
                        { value: '09:00 AM', label: '09:00 AM' },
                        { value: '10:00 AM', label: '10:00 AM' },
                        { value: '11:00 AM', label: '11:00 AM' },
                        { value: '02:00 PM', label: '02:00 PM' },
                        { value: '03:00 PM', label: '03:00 PM' },
                        { value: '04:00 PM', label: '04:00 PM' }
                      ]}
                    />
                  </div>

                  <Select
                    label="Consultation Type"
                    value={bookingForm.type}
                    onChange={(e) => setBookingForm({ ...bookingForm, type: e.target.value })}
                    options={[
                      { value: 'opd', label: 'OPD (In-Person)' },
                      { value: 'telemedicine', label: 'Telemedicine (Online)' }
                    ]}
                  />

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Reason for Visit / Symptoms</label>
                    <textarea
                      rows="2"
                      value={bookingForm.reason}
                      onChange={(e) => setBookingForm({ ...bookingForm, reason: e.target.value })}
                      placeholder="e.g., Follow up, cough and throat pain for 3 days"
                      className="w-full input-surface py-2.5"
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full py-3 mt-2"
                  >
                    Confirm Appointment
                  </Button>
                </form>
              </Card>
            )}

            {/* Prescriptions Tab */}
            {activeTab === 'prescriptions' && (
              <Card className="space-y-4 text-left">
                <h3 className="font-bold text-base text-slate-900 dark:text-white font-heading">Digital Health Prescriptions</h3>
                {appointments.filter(a => a.status === 'completed' && a.consultation?.medications?.length > 0).length === 0 ? (
                  <div className="text-center py-10 text-slate-400 dark:text-slate-500 font-medium text-sm">
                    No digital prescriptions found in your health locker.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {appointments.filter(a => a.status === 'completed' && a.consultation?.medications?.length > 0).map((appt) => (
                      <div key={appt.id} className="bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 p-4 rounded-xl space-y-3">
                        <div className="flex justify-between items-start border-b border-slate-200/40 dark:border-slate-800 pb-2">
                          <div>
                            <h4 className="font-bold text-slate-800 dark:text-white text-xs">{appt.doctor}</h4>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">Diagnosis: <strong className="text-slate-700 dark:text-slate-300">{appt.consultation.diagnosis}</strong></p>
                          </div>
                          <span className="text-[9px] text-slate-400 font-mono font-bold">{new Date(appt.date).toLocaleDateString()}</span>
                        </div>
                        <div className="space-y-2">
                          {appt.consultation.medications.map((med, idx) => (
                            <div key={idx} className="flex justify-between text-xs text-slate-700 dark:text-slate-400">
                              <span>💊 <strong className="text-slate-800 dark:text-white">{med.name}</strong></span>
                              <span className="font-medium">{med.dosage} — {med.frequency} ({med.duration})</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* EMR Portal Tab */}
            {activeTab === 'emr' && (
              <EMRTab initialPatientId={currentUser.id} readOnly={true} />
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl items-start text-left">
                <Card className="space-y-4">
                  <h3 className="font-bold text-base text-slate-900 dark:text-white mb-4 font-heading">Profile Demographics</h3>
                  
                  <div className="space-y-3 font-semibold text-xs text-slate-500 dark:text-slate-400">
                    <div className="pb-2.5 border-b border-slate-100 dark:border-slate-800 flex justify-between">
                      <span>Full Name</span>
                      <strong className="text-slate-800 dark:text-white">{currentUser.name}</strong>
                    </div>
                    <div className="pb-2.5 border-b border-slate-100 dark:border-slate-800 flex justify-between">
                      <span>ABHA ID (14 digits)</span>
                      <strong className="text-slate-800 dark:text-white font-mono">{currentUser.abha}</strong>
                    </div>
                    <div className="pb-2.5 border-b border-slate-100 dark:border-slate-800 flex justify-between">
                      <span>Phone Number</span>
                      <strong className="text-slate-800 dark:text-white font-mono">{currentUser.phone}</strong>
                    </div>
                    <div className="pb-2.5 border-b border-slate-100 dark:border-slate-800 flex justify-between">
                      <span>Date of Birth</span>
                      <strong className="text-slate-800 dark:text-white">{new Date(currentUser.dob).toLocaleDateString()}</strong>
                    </div>
                    <div className="pb-2.5 border-b border-slate-100 dark:border-slate-800 flex justify-between capitalize">
                      <span>Gender</span>
                      <strong className="text-slate-800 dark:text-white">{currentUser.gender}</strong>
                    </div>
                  </div>
                </Card>

                {/* Change Password Card */}
                <Card className="space-y-5">
                  <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1 font-heading">Security Settings</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-medium font-sans">Update password for patient locker login</p>
                  
                  {securityError && <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-300 dark:border-rose-900/30 text-rose-700 dark:text-rose-400 text-xs p-3 rounded-xl font-medium">{securityError}</div>}
                  {securitySuccess && <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-300 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs p-3 rounded-xl font-medium">{securitySuccess}</div>}

                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <Input
                      label="Current Password"
                      type="password"
                      required
                      value={securityForm.oldPassword}
                      onChange={(e) => setSecurityForm({ ...securityForm, oldPassword: e.target.value })}
                      placeholder="Enter current password"
                    />

                    <Input
                      label="New Password"
                      type="password"
                      required
                      value={securityForm.newPassword}
                      onChange={(e) => setSecurityForm({ ...securityForm, newPassword: e.target.value })}
                      placeholder="Create new password"
                    />

                    <Input
                      label="Confirm Password"
                      type="password"
                      required
                      value={securityForm.confirmPassword}
                      onChange={(e) => setSecurityForm({ ...securityForm, confirmPassword: e.target.value })}
                      placeholder="Confirm new password"
                    />

                    <Button
                      type="submit"
                      variant="primary"
                      className="w-full py-2.5 mt-1"
                    >
                      Update Password
                    </Button>
                  </form>
                </Card>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
