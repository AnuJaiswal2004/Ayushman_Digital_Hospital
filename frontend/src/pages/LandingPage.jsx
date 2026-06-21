import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Users, HeartPulse, Building2, User, Key, Info, HelpCircle } from 'lucide-react';
import { apiService } from '../services/api.js';
import ThemeToggle from '../components/ThemeToggle.jsx';

export default function LandingPage() {
  const navigate = useNavigate();
  const [authModal, setAuthModal] = useState(null); // 'patient', 'staff', 'admin', 'register'
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    abha: '',
    phone: '',
    dob: '',
    gender: ''
  });
  const [error, setError] = useState('');

  // Forgot Password State
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotRole, setForgotRole] = useState('patient');
  const [forgotUsername, setForgotUsername] = useState('');
  const [forgotId, setForgotId] = useState('');
  const [forgotCode, setForgotCode] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotError, setForgotError] = useState('');

  const handleForgotVerify = (e) => {
    e.preventDefault();
    setForgotError('');
    const patients = JSON.parse(localStorage.getItem('patients')) || [];
    const users = JSON.parse(localStorage.getItem('users')) || [];

    if (forgotRole === 'patient') {
      const patient = patients.find(p => (p.abha === forgotUsername || p.phone === forgotUsername) && p.phone === forgotId);
      if (patient) {
        setForgotStep(2);
        setForgotMessage('A verification code "7777" has been sent to your registered mobile number.');
      } else {
        setForgotError('No patient found matching these credentials.');
      }
    } else {
      const user = users.find(u => u.username === forgotUsername && u.staffId === forgotId);
      if (user) {
        setForgotStep(2);
        setForgotMessage('A verification code "7777" has been sent to your registered provider device.');
      } else {
        setForgotError('No staff/admin user found matching these credentials.');
      }
    }
  };

  const handleForgotCodeConfirm = (e) => {
    e.preventDefault();
    setForgotError('');
    if (forgotCode === '7777') {
      setForgotStep(3);
      setForgotMessage('');
    } else {
      setForgotError('Invalid verification code. Please enter 7777.');
    }
  };

  const handleForgotReset = async (e) => {
    e.preventDefault();
    setForgotError('');
    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError('Passwords do not match.');
      return;
    }
    const res = await apiService.resetPassword(forgotUsername, forgotId, forgotNewPassword, forgotRole);
    if (res.success) {
      alert('Password successfully reset! Please login with your new password.');
      handleModalOpen(forgotRole === 'patient' ? 'patient' : forgotRole === 'staff' ? 'staff' : 'admin');
      setForgotStep(1);
      setForgotUsername('');
      setForgotId('');
      setForgotCode('');
      setForgotNewPassword('');
      setForgotConfirmPassword('');
    } else {
      setForgotError(res.message || 'Reset failed.');
    }
  };

  const handleModalOpen = (type) => {
    setAuthModal(type);
    setError('');
    setFormData({ username: '', password: '', name: '', abha: '', phone: '', dob: '', gender: '' });
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e, role) => {
    e.preventDefault();
    const res = await apiService.login(formData.username, formData.password, role);
    if (res.success) {
      // Save current user to localStorage with their actual resolved role
      localStorage.setItem('currentUser', JSON.stringify({ ...res.user }));
      setAuthModal(null);
      if (res.user.role === 'admin' || res.user.role === 'superadmin') navigate('/admin');
      else if (res.user.role === 'doctor' || res.user.role === 'receptionist') navigate('/staff');
      else navigate('/patient');
    } else {
      setError(res.message || 'Invalid credentials');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const { name, abha, phone, dob, gender, password } = formData;
    
    if (!name || !abha || !phone || !dob || !gender || !password) {
      setError('Please fill all fields');
      return;
    }
    if (abha.length !== 14 || isNaN(abha)) {
      setError('ABHA ID must be 14 digits');
      return;
    }
    if (phone.length !== 10 || isNaN(phone)) {
      setError('Phone number must be 10 digits');
      return;
    }

    try {
      await apiService.registerPatient({ name, abha, phone, dob, gender, password });
      handleModalOpen('patient');
      alert('Registration successful! Please login.');
    } catch (err) {
      setError('Registration failed. Username/ABHA might already exist.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans select-none transition-colors duration-300">
      {/* Top Banner (ABDM National Health Authority Styling) */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white text-xs py-2 px-4 flex justify-between items-center border-b border-indigo-800">
        <div className="flex items-center gap-4">
          <span className="font-semibold tracking-wider">GOVERNMENT OF INDIA</span>
          <span className="hidden md:inline text-blue-200">|</span>
          <span className="hidden md:inline font-light">MINISTRY OF HEALTH & FAMILY WELFARE</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="bg-red-500 text-white px-2 py-0.5 rounded-full font-bold text-[10px] animate-pulse-soft">ABDM COMPLIANT</span>
          <span className="text-blue-200 font-medium">Ayushman Bharat</span>
        </div>
      </div>

      {/* Main Header */}
      <header className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 border-b border-slate-200/80 dark:border-slate-850 px-6 py-4 flex justify-between items-center transition-colors duration-300">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-blue-500/20">
            <HeartPulse className="h-6 w-6" />
          </div>
          <div className="text-left">
            <h1 className="font-extrabold text-xl tracking-tight text-slate-800 dark:text-white font-heading">
              Ayushman <span className="text-blue-600 dark:text-blue-400 font-medium font-sans">Digital Hospital</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-semibold tracking-widest uppercase">E-HEALTH PLATFORM</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => handleModalOpen('patient')}
            className="hidden sm:inline-flex text-sm font-semibold text-slate-600 dark:text-slate-350 hover:text-blue-600 dark:hover:text-blue-450 transition-colors"
          >
            Patient Portal
          </button>
          <button 
            onClick={() => handleModalOpen('staff')}
            className="hidden sm:inline-flex text-sm font-semibold text-slate-600 dark:text-slate-350 hover:text-blue-600 dark:hover:text-blue-450 transition-colors"
          >
            Provider Portal
          </button>
          
          <ThemeToggle />

          <button 
            onClick={() => handleModalOpen('admin')}
            className="bg-slate-900 dark:bg-slate-800 text-white dark:text-slate-100 hover:bg-blue-600 dark:hover:bg-blue-700 text-sm font-semibold px-4 py-2 rounded-xl transition-all shadow-md hover:shadow-lg shadow-slate-900/10 hover:shadow-blue-500/20 hover:-translate-y-0.5 cursor-pointer"
          >
            Admin Panel
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col justify-center items-center px-6 py-12 md:py-20 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full">
          {/* Left Text */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 px-3 py-1 rounded-full text-xs font-semibold border border-blue-100 dark:border-blue-900/50">
              <Shield className="h-3.5 w-3.5" />
              Unified Health Interface Active
            </div>
            
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white leading-tight font-heading">
              Discover Hospitals, <br className="hidden md:inline" />
              Access Care, & Find <br className="hidden md:inline" />
              <span className="text-gradient font-sans">Trusted Services</span> Nearby
            </h2>
            
            <p className="text-slate-600 dark:text-slate-300 text-base md:text-lg max-w-xl mx-auto lg:mx-0">
              Search trusted hospitals, manage appointments, get prescriptions, and track lab investigations digitally under the national Ayushman Bharat Digital Mission.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
              <button 
                onClick={() => handleModalOpen('patient')}
                className="bg-blue-600 hover:bg-blue-700 text-white text-base font-semibold px-8 py-3.5 rounded-xl shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
              >
                Enter Patient Portal
              </button>
              <button 
                onClick={() => handleModalOpen('register')}
                className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-800 dark:text-slate-200 text-base font-semibold px-8 py-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
              >
                Register ABHA Card
              </button>
            </div>

            <div className="flex justify-center lg:justify-start items-center gap-6 pt-6 text-slate-400 dark:text-slate-500 text-sm">
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-blue-500" />
                <strong className="dark:text-slate-350">240k+</strong> Users Registered
              </div>
              <div className="flex items-center gap-1.5">
                <Building2 className="h-4 w-4 text-emerald-500" />
                <strong className="dark:text-slate-350">120+</strong> Hospital Units Connected
              </div>
            </div>
          </div>

          {/* Right Cards Grid */}
          <div className="lg:col-span-5 grid grid-cols-1 gap-6 w-full">
            {/* Admin Portal Card */}
            <div 
              onClick={() => handleModalOpen('admin')}
              className="bg-white dark:bg-slate-900/50 hover:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 hover:border-slate-800 p-6 rounded-2xl shadow-sm hover:shadow-xl group transition-all duration-300 hover:-translate-y-1 flex gap-5 items-start cursor-pointer"
            >
              <div className="bg-indigo-50 dark:bg-indigo-950/40 group-hover:bg-slate-800 p-4 rounded-xl text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-300 transition-colors">
                <Shield className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 group-hover:text-white transition-colors font-heading">
                  🔐 Administrative Dashboard
                </h3>
                <p className="text-slate-500 dark:text-slate-400 group-hover:text-slate-300 text-sm transition-colors leading-relaxed">
                  Manage patient admissions, schedule clinical rosters, view real-time department statistics, and monitor financial analytics.
                </p>
                <div className="pt-2 text-xs font-semibold text-blue-600 group-hover:text-blue-300 flex items-center gap-1">
                  Login to Admin panel &rarr;
                </div>
              </div>
            </div>

            {/* Provider/Staff Portal Card */}
            <div 
              onClick={() => handleModalOpen('staff')}
              className="bg-white dark:bg-slate-900/50 hover:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 hover:border-slate-800 p-6 rounded-2xl shadow-sm hover:shadow-xl group transition-all duration-300 hover:-translate-y-1 flex gap-5 items-start cursor-pointer"
            >
              <div className="bg-emerald-50 dark:bg-emerald-950/40 group-hover:bg-slate-800 p-4 rounded-xl text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-300 transition-colors">
                <Users className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 group-hover:text-white transition-colors font-heading">
                  🩺 Clinical Provider Portal
                </h3>
                <p className="text-slate-500 dark:text-slate-400 group-hover:text-slate-300 text-sm transition-colors leading-relaxed">
                  Dedicated interface for doctors and staff to track queue status, record vitals, issue digital prescriptions, and compile bills.
                </p>
                <div className="pt-2 text-xs font-semibold text-blue-600 group-hover:text-blue-300 flex items-center gap-1">
                  Enter Provider Portal &rarr;
                </div>
              </div>
            </div>

            {/* Patient Portal Card */}
            <div 
              onClick={() => handleModalOpen('patient')}
              className="bg-white dark:bg-slate-900/50 hover:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 hover:border-slate-800 p-6 rounded-2xl shadow-sm hover:shadow-xl group transition-all duration-300 hover:-translate-y-1 flex gap-5 items-start cursor-pointer"
            >
              <div className="bg-blue-50 dark:bg-blue-950/40 group-hover:bg-slate-800 p-4 rounded-xl text-blue-600 dark:text-blue-400 group-hover:text-blue-300 transition-colors">
                <User className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 group-hover:text-white transition-colors font-heading">
                  👤 Patient Health Portal
                </h3>
                <p className="text-slate-500 dark:text-slate-400 group-hover:text-slate-300 text-sm transition-colors leading-relaxed">
                  Book online slots, retrieve lab logs, review diagnostic summaries, and manage your electronic health record.
                </p>
                <div className="pt-2 text-xs font-semibold text-blue-600 group-hover:text-blue-300 flex items-center gap-1">
                  Access patient records &rarr;
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-850 py-8 px-6 text-center text-slate-400 dark:text-slate-500 text-xs transition-colors duration-300">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>© 2026 Ayushman Digital Hospital. Under ABDM Core Digital Infrastructure.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">Help Center</a>
          </div>
        </div>
      </footer>

      {/* Authentication Modals */}
      {authModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full p-8 relative border border-slate-100 dark:border-slate-800 overflow-hidden transform transition-all scale-100">
            {/* Top decorative gradient bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 to-indigo-600" />
            
            <button 
              onClick={() => setAuthModal(null)}
              className="absolute top-4 right-4 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-350 text-xl font-bold p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
            >
              &times;
            </button>

            {authModal === 'patient' && (
              <form onSubmit={(e) => handleLogin(e, 'patient')} className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-slate-800 dark:text-white font-heading">Patient Login</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Enter your 14-digit ABHA ID or phone number.</p>
                </div>

                {error && <div className="bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-450 text-xs p-3.5 rounded-xl font-medium border border-rose-100 dark:border-rose-900/40">{error}</div>}

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">ABHA ID / Phone</label>
                    <div className="relative">
                      <User className="absolute left-4.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 h-4 w-4" />
                      <input 
                        type="text" 
                        name="username"
                        required
                        value={formData.username}
                        onChange={handleInputChange}
                        placeholder="Enter ABHA ID or Mobile" 
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 focus:border-blue-500 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 rounded-xl pl-12 pr-4 py-3 text-sm font-medium dark:text-white outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Password</label>
                    <div className="relative">
                      <Key className="absolute left-4.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 h-4 w-4" />
                      <input 
                        type="password" 
                        name="password"
                        required
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="Enter password" 
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 focus:border-blue-500 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 rounded-xl pl-12 pr-4 py-3 text-sm font-medium dark:text-white outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-xl transition-all shadow-md shadow-blue-500/10 cursor-pointer"
                >
                  Sign In
                </button>

                <div className="text-center text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
                  <div>
                    Don't have an account?{' '}
                    <button type="button" onClick={() => handleModalOpen('register')} className="text-blue-600 dark:text-blue-400 hover:underline font-bold cursor-pointer">
                      Register with ABHA ID
                    </button>
                  </div>
                  <button type="button" onClick={() => { setForgotRole('patient'); setForgotStep(1); setForgotError(''); setAuthModal('forgot'); }} className="text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 font-bold hover:underline cursor-pointer">
                    Forgot Password?
                  </button>
                </div>
              </form>
            )}

            {authModal === 'register' && (
              <form onSubmit={handleRegister} className="space-y-5">
                <div className="space-y-1">
                  <h3 className="text-2xl font-black text-slate-800 dark:text-white font-heading">Register with ABHA</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Create a digital health identity account.</p>
                </div>

                {error && <div className="bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-450 text-xs p-3 rounded-lg font-medium border border-rose-100 dark:border-rose-900/40">{error}</div>}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[360px] overflow-y-auto pr-1">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Full Name</label>
                    <input 
                      type="text" 
                      name="name" 
                      required 
                      value={formData.name} 
                      onChange={handleInputChange} 
                      placeholder="Enter Full Name" 
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500 dark:focus:border-blue-500 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">ABHA ID (14 digits)</label>
                    <input 
                      type="text" 
                      name="abha" 
                      required 
                      maxLength="14"
                      value={formData.abha} 
                      onChange={handleInputChange} 
                      placeholder="14-digit ABHA" 
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500 dark:focus:border-blue-500 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Phone Number</label>
                    <input 
                      type="tel" 
                      name="phone" 
                      required 
                      maxLength="10"
                      value={formData.phone} 
                      onChange={handleInputChange} 
                      placeholder="10-digit Mobile" 
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500 dark:focus:border-blue-500 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Date of Birth</label>
                    <input 
                      type="date" 
                      name="dob" 
                      required 
                      value={formData.dob} 
                      onChange={handleInputChange} 
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500 dark:focus:border-blue-500 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Gender</label>
                    <select 
                      name="gender" 
                      required 
                      value={formData.gender} 
                      onChange={handleInputChange} 
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500 dark:focus:border-blue-500 dark:text-white"
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Password</label>
                    <input 
                      type="password" 
                      name="password" 
                      required 
                      value={formData.password} 
                      onChange={handleInputChange} 
                      placeholder="Create Password" 
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500 dark:focus:border-blue-500 dark:text-white"
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-xl transition-all shadow-md shadow-blue-500/10 cursor-pointer"
                >
                  Complete Registration
                </button>

                <div className="text-center text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                  Already have an account?{' '}
                  <button type="button" onClick={() => handleModalOpen('patient')} className="text-blue-600 dark:text-blue-400 hover:underline font-bold">
                    Login
                  </button>
                </div>
              </form>
            )}

            {authModal === 'staff' && (
              <form onSubmit={(e) => handleLogin(e, 'staff')} className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-slate-800 dark:text-white font-heading">Provider / Staff Login</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">For healthcare practitioners, nurses, and billing staff.</p>
                </div>

                {error && <div className="bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-450 text-xs p-3.5 rounded-xl font-medium border border-rose-100 dark:border-rose-900/40">{error}</div>}

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Staff Username</label>
                    <div className="relative">
                      <User className="absolute left-4.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 h-4 w-4" />
                      <input 
                        type="text" 
                        name="username"
                        required
                        value={formData.username}
                        onChange={handleInputChange}
                        placeholder="e.g., staff001" 
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 focus:border-emerald-500 dark:focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900 rounded-xl pl-12 pr-4 py-3 text-sm font-medium dark:text-white outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Password</label>
                    <div className="relative">
                      <Key className="absolute left-4.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 h-4 w-4" />
                      <input 
                        type="password" 
                        name="password"
                        required
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="Enter password" 
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 focus:border-emerald-500 dark:focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900 rounded-xl pl-12 pr-4 py-3 text-sm font-medium dark:text-white outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl p-3.5 flex gap-3 text-slate-700 dark:text-emerald-300 text-[11px] leading-relaxed">
                  <Info className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Demo Credentials:</strong><br />
                    Username: <code className="bg-white/80 dark:bg-slate-900 px-1 py-0.5 rounded font-mono text-slate-800 dark:text-slate-200">staff001</code> / Password: <code className="bg-white/80 dark:bg-slate-900 px-1 py-0.5 rounded font-mono text-slate-800 dark:text-slate-200">staff123</code>
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3.5 rounded-xl transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
                >
                  Access Provider Portal
                </button>

                <div className="text-center text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button type="button" onClick={() => { setForgotRole('staff'); setForgotStep(1); setForgotError(''); setAuthModal('forgot'); }} className="text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 font-bold hover:underline cursor-pointer">
                    Forgot Password?
                  </button>
                </div>
              </form>
            )}

            {authModal === 'admin' && (
              <form onSubmit={(e) => handleLogin(e, 'admin')} className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-slate-800 dark:text-white font-heading">Administrator Login</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Access core configuration and system health dashboard.</p>
                </div>

                {error && <div className="bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-450 text-xs p-3.5 rounded-xl font-medium border border-rose-100 dark:border-rose-900/40">{error}</div>}

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Admin ID</label>
                    <div className="relative">
                      <User className="absolute left-4.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 h-4 w-4" />
                      <input 
                        type="text" 
                        name="username"
                        required
                        value={formData.username}
                        onChange={handleInputChange}
                        placeholder="e.g., admin" 
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 focus:border-slate-800 dark:focus:border-slate-400 focus:bg-white dark:focus:bg-slate-900 rounded-xl pl-12 pr-4 py-3 text-sm font-medium dark:text-white outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Password</label>
                    <div className="relative">
                      <Key className="absolute left-4.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 h-4 w-4" />
                      <input 
                        type="password" 
                        name="password"
                        required
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="Enter password" 
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 focus:border-slate-800 dark:focus:border-slate-400 focus:bg-white dark:focus:bg-slate-900 rounded-xl pl-12 pr-4 py-3 text-sm font-medium dark:text-white outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-slate-100 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 flex gap-3 text-slate-700 dark:text-slate-350 text-[11px] leading-relaxed">
                  <Info className="h-4 w-4 text-slate-600 dark:text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <strong>Demo Credentials:</strong><br />
                    Username: <code className="bg-white dark:bg-slate-900 px-1 py-0.5 rounded font-mono text-slate-800 dark:text-slate-200">admin</code> / Password: <code className="bg-white dark:bg-slate-900 px-1 py-0.5 rounded font-mono text-slate-800 dark:text-slate-200">admin123</code>
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-semibold py-3.5 rounded-xl transition-all shadow-md cursor-pointer"
                >
                  Access Admin Panel
                </button>

                <div className="text-center text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button type="button" onClick={() => { setForgotRole('admin'); setForgotStep(1); setForgotError(''); setAuthModal('forgot'); }} className="text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-bold hover:underline cursor-pointer">
                    Forgot Password?
                  </button>
                </div>
              </form>
            )}

            {authModal === 'forgot' && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-slate-800 dark:text-white font-heading">Reset Password</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Step {forgotStep} of 3: {
                    forgotStep === 1 ? 'Verify Identity' : forgotStep === 2 ? 'Security Verification' : 'Set New Password'
                  }</p>
                </div>

                {forgotError && <div className="bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-455 text-xs p-3.5 rounded-xl font-medium border border-rose-100 dark:border-rose-900/40">{forgotError}</div>}
                {forgotMessage && <div className="bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 text-xs p-3.5 rounded-xl font-medium border border-blue-100 dark:border-blue-900/40">{forgotMessage}</div>}

                {forgotStep === 1 && (
                  <form onSubmit={handleForgotVerify} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Select Role</label>
                      <select 
                        value={forgotRole}
                        onChange={(e) => setForgotRole(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-semibold dark:text-white outline-none focus:border-blue-500 dark:focus:border-blue-500 cursor-pointer"
                      >
                        <option value="patient">Patient</option>
                        <option value="staff">Clinical Provider (Doctor/Receptionist)</option>
                        <option value="admin">Administrator</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        {forgotRole === 'patient' ? 'ABHA ID / Phone' : 'Username'}
                      </label>
                      <input 
                        type="text" 
                        required
                        value={forgotUsername}
                        onChange={(e) => setForgotUsername(e.target.value)}
                        placeholder={forgotRole === 'patient' ? 'Enter ABHA ID or phone' : 'Enter username'}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-blue-500 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 rounded-xl px-4 py-3 text-sm font-medium dark:text-white outline-none transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        {forgotRole === 'patient' ? 'Registered Phone Number' : 'Staff ID'}
                      </label>
                      <input 
                        type="text" 
                        required
                        value={forgotId}
                        onChange={(e) => setForgotId(e.target.value)}
                        placeholder={forgotRole === 'patient' ? 'Enter 10-digit Phone' : 'Enter Staff ID (e.g. STAFF001)'}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-blue-500 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 rounded-xl px-4 py-3 text-sm font-medium dark:text-white outline-none transition-all"
                      />
                    </div>

                    <button 
                      type="submit" 
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-xl transition-all shadow-md cursor-pointer"
                    >
                      Request Verification Code
                    </button>
                  </form>
                )}

                {forgotStep === 2 && (
                  <form onSubmit={handleForgotCodeConfirm} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Verification Code</label>
                      <input 
                        type="text" 
                        required
                        maxLength="4"
                        value={forgotCode}
                        onChange={(e) => setForgotCode(e.target.value)}
                        placeholder="Enter 4-digit code (e.g. 7777)"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-blue-500 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 rounded-xl px-4 py-3 text-sm font-medium dark:text-white font-mono text-center text-lg outline-none transition-all"
                      />
                    </div>

                    <button 
                      type="submit" 
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-xl transition-all shadow-md cursor-pointer"
                    >
                      Confirm Verification Code
                    </button>
                  </form>
                )}

                {forgotStep === 3 && (
                  <form onSubmit={handleForgotReset} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">New Password</label>
                      <input 
                        type="password" 
                        required
                        value={forgotNewPassword}
                        onChange={(e) => setForgotNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-blue-500 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 rounded-xl px-4 py-3 text-sm font-medium dark:text-white outline-none transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Confirm New Password</label>
                      <input 
                        type="password" 
                        required
                        value={forgotConfirmPassword}
                        onChange={(e) => setForgotConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-blue-500 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 rounded-xl px-4 py-3 text-sm font-medium dark:text-white outline-none transition-all"
                      />
                    </div>

                    <button 
                      type="submit" 
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-xl transition-all shadow-md cursor-pointer"
                    >
                      Update Password
                    </button>
                  </form>
                )}

                <div className="text-center text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                  Remember password?{' '}
                  <button type="button" onClick={() => handleModalOpen(forgotRole === 'patient' ? 'patient' : forgotRole === 'staff' ? 'staff' : 'admin')} className="text-blue-600 dark:text-blue-400 hover:underline font-bold cursor-pointer">
                    Back to Login
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
