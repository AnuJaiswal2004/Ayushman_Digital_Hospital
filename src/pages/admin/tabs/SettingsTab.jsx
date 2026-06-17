import React, { useState, useEffect } from 'react';
import { Settings, HelpCircle, Phone, MapPin, Building, Clock, Calendar, ShieldAlert, Key, ShieldCheck, UserPlus, Users } from 'lucide-react';
import { apiService } from '../../../services/api.js';

export default function SettingsTab({ setHospitalName }) {
  const [currentUser, setCurrentUser] = useState(null);
  
  const [formData, setFormData] = useState({
    hospitalName: '',
    address: '',
    phone: '',
    slotDuration: 30,
    bookingWindow: 30
  });
  const [saving, setSaving] = useState(false);

  // Security Form State
  const [securityForm, setSecurityForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [securityError, setSecurityError] = useState('');
  const [securitySuccess, setSecuritySuccess] = useState('');

  // User Management State (Super Admin Only)
  const [usersList, setUsersList] = useState([]);
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    name: '',
    role: 'admin',
    staffId: '',
    department: ''
  });

  const loadSettings = async () => {
    const data = await apiService.getSettings();
    if (data) {
      setFormData({
        hospitalName: data.hospitalName || '',
        address: data.address || '',
        phone: data.phone || '',
        slotDuration: data.slotDuration || 30,
        bookingWindow: data.bookingWindow || 30
      });
    }

    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      const parsedUser = JSON.parse(userStr);
      setCurrentUser(parsedUser);
      
      // Load user accounts for Super Admin management
      if (parsedUser.role === 'superadmin') {
        setUsersList(JSON.parse(localStorage.getItem('users')) || []);
      }
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'slotDuration' || name === 'bookingWindow' ? parseInt(value) || 0 : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.hospitalName || !formData.address || !formData.phone) {
      alert('Please fill all general settings fields');
      return;
    }

    setSaving(true);
    try {
      await apiService.saveSettings(formData);
      setHospitalName(formData.hospitalName); // Live update header
      alert('Settings saved successfully!');
    } catch (err) {
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setSecurityError('');
    setSecuritySuccess('');

    if (securityForm.newPassword !== securityForm.confirmPassword) {
      setSecurityError('New passwords do not match');
      return;
    }

    if (!currentUser) return;

    const res = await apiService.changePassword(
      currentUser.username, 
      securityForm.oldPassword, 
      securityForm.newPassword, 
      currentUser.role
    );

    if (res.success) {
      setSecuritySuccess('Password updated successfully!');
      setSecurityForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      // Update local storage user password
      const updatedUser = { ...currentUser, password: securityForm.newPassword };
      setCurrentUser(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    } else {
      setSecurityError(res.message || 'Failed to update password');
    }
  };

  const handleCreateUser = (e) => {
    e.preventDefault();
    if (!newUser.username || !newUser.password || !newUser.name || !newUser.staffId) {
      alert('Please fill all fields');
      return;
    }

    const currentUsers = JSON.parse(localStorage.getItem('users')) || [];
    if (currentUsers.some(u => u.username === newUser.username)) {
      alert('Username already exists!');
      return;
    }

    const updatedUsers = [...currentUsers, newUser];
    localStorage.setItem('users', JSON.stringify(updatedUsers));
    setUsersList(updatedUsers);
    setNewUser({
      username: '',
      password: '',
      name: '',
      role: 'admin',
      staffId: '',
      department: ''
    });
    alert('User created successfully!');
  };

  const handleDeleteUser = (username) => {
    if (username === currentUser.username) {
      alert('You cannot delete your own session account!');
      return;
    }
    if (window.confirm(`Are you sure you want to delete user account "${username}"?`)) {
      const currentUsers = JSON.parse(localStorage.getItem('users')) || [];
      const updated = currentUsers.filter(u => u.username !== username);
      localStorage.setItem('users', JSON.stringify(updated));
      setUsersList(updated);
      alert('User account deleted.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl w-full">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* System Settings Form (Left/Top) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:col-span-7 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-850">
            <div className="bg-blue-500/10 p-2.5 rounded-xl text-blue-400">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white font-heading">System Parameters</h3>
              <p className="text-xs text-slate-400 font-medium">Configure hospital profile and slot allocations</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* General Settings */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-450 uppercase tracking-widest flex items-center gap-1.5">
                <Building className="h-4 w-4 text-blue-500 shrink-0" />
                General Information
              </h4>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hospital Name</label>
                <div className="relative">
                  <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 h-4 w-4" />
                  <input
                    type="text"
                    name="hospitalName"
                    value={formData.hospitalName}
                    onChange={handleInputChange}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl pl-11 pr-4 py-2.5 text-sm font-medium outline-none text-slate-200 focus:border-blue-500"
                    placeholder="Enter hospital name"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hospital Address</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-4 text-slate-500 h-4 w-4" />
                  <textarea
                    name="address"
                    rows="2"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl pl-11 pr-4 py-2.5 text-sm font-medium outline-none text-slate-200 focus:border-blue-500"
                    placeholder="Enter physical address"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contact Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 h-4 w-4" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl pl-11 pr-4 py-2.5 text-sm font-medium outline-none text-slate-200 focus:border-blue-500"
                    placeholder="e.g., +91-XXXX-XXXXXX"
                  />
                </div>
              </div>
            </div>

            {/* Roster & Scheduling Configuration */}
            <div className="space-y-4 pt-4 border-t border-slate-850">
              <h4 className="text-xs font-bold text-slate-450 uppercase tracking-widest flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-indigo-500 shrink-0" />
                Scheduling & Roster Config
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Slot Duration (min)</label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 h-4 w-4" />
                    <input
                      type="number"
                      name="slotDuration"
                      value={formData.slotDuration}
                      onChange={handleInputChange}
                      min="5"
                      max="120"
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl pl-11 pr-4 py-2.5 text-sm font-semibold outline-none text-slate-200 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Max Lead Time (days)</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 h-4 w-4" />
                    <input
                      type="number"
                      name="bookingWindow"
                      value={formData.bookingWindow}
                      onChange={handleInputChange}
                      min="1"
                      max="365"
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl pl-11 pr-4 py-2.5 text-sm font-semibold outline-none text-slate-200 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="pt-4 border-t border-slate-850 flex justify-between items-center">
              <span className="text-[9px] font-bold text-slate-500 flex items-center gap-1">
                <HelpCircle className="h-3.5 w-3.5 text-slate-650" /> Values synced dynamically
              </span>
              <button
                type="submit"
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-semibold px-5 py-2.5 rounded-xl text-xs transition-all shadow-md cursor-pointer"
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
        </div>

        {/* Change Password / Security Panel (Right) */}
        <div className="space-y-6 md:col-span-5">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-850">
              <div className="bg-indigo-500/10 p-2.5 rounded-xl text-indigo-400">
                <Key className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white font-heading">Security Credentials</h3>
                <p className="text-xs text-slate-400 font-medium">Update current administrative password</p>
              </div>
            </div>

            {securityError && <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-3 rounded-xl font-medium">{securityError}</div>}
            {securitySuccess && <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs p-3 rounded-xl font-medium">{securitySuccess}</div>}

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Password</label>
                <input
                  type="password"
                  required
                  value={securityForm.oldPassword}
                  onChange={(e) => setSecurityForm({ ...securityForm, oldPassword: e.target.value })}
                  placeholder="Enter current password"
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-sm font-medium outline-none text-slate-200 focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">New Password</label>
                <input
                  type="password"
                  required
                  value={securityForm.newPassword}
                  onChange={(e) => setSecurityForm({ ...securityForm, newPassword: e.target.value })}
                  placeholder="Create new password"
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-sm font-medium outline-none text-slate-200 focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={securityForm.confirmPassword}
                  onChange={(e) => setSecurityForm({ ...securityForm, confirmPassword: e.target.value })}
                  placeholder="Confirm new password"
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-sm font-medium outline-none text-slate-200 focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl text-xs transition-all shadow-md cursor-pointer"
              >
                Change Security Password
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* User Management System (Super Admin Only) */}
      {currentUser && currentUser.role === 'superadmin' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex justify-between items-center pb-3 border-b border-slate-850">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-500/10 p-2.5 rounded-xl text-emerald-400">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white font-heading">User Account Configuration</h3>
                <p className="text-xs text-slate-400 font-medium">Add, remove, or change system administrative roles</p>
              </div>
            </div>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded border border-emerald-500/20">SUPER ADMIN</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Create Account Form */}
            <div className="lg:col-span-5 bg-slate-950 border border-slate-850 rounded-xl p-5 space-y-4">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <UserPlus className="h-4 w-4 text-emerald-450" /> Register Provider / Operator Account
              </h4>

              <form onSubmit={handleCreateUser} className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Username</label>
                    <input
                      type="text"
                      required
                      value={newUser.username}
                      onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                      placeholder="username"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs outline-none focus:border-emerald-500 text-slate-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Password</label>
                    <input
                      type="password"
                      required
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      placeholder="password"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs outline-none focus:border-emerald-500 text-slate-200"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Full Name</label>
                  <input
                    type="text"
                    required
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    placeholder="e.g. Asha Sharma"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs outline-none focus:border-emerald-500 text-slate-200"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Staff / Operator ID</label>
                    <input
                      type="text"
                      required
                      value={newUser.staffId}
                      onChange={(e) => setNewUser({ ...newUser, staffId: e.target.value })}
                      placeholder="e.g. STAFF003"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs outline-none focus:border-emerald-500 text-slate-200"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">System Role</label>
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser({ ...newUser, role: e.target.value, department: e.target.value !== 'doctor' ? '' : newUser.department })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs outline-none focus:border-emerald-500 text-slate-350 cursor-pointer"
                    >
                      <option value="admin">Administrator</option>
                      <option value="doctor">Medical Doctor</option>
                      <option value="receptionist">Receptionist Desk</option>
                      <option value="superadmin">Super Administrator</option>
                    </select>
                  </div>
                </div>

                {newUser.role === 'doctor' && (
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Clinical Department</label>
                    <select
                      value={newUser.department}
                      onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                      required={newUser.role === 'doctor'}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs outline-none focus:border-emerald-500 text-slate-350 cursor-pointer"
                    >
                      <option value="">Select Department</option>
                      <option value="cardiology">Cardiology</option>
                      <option value="pediatrics">Pediatrics</option>
                      <option value="orthopedics">Orthopedics</option>
                      <option value="dermatology">Dermatology</option>
                      <option value="general">General Medicine</option>
                    </select>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-lg text-xs transition-all cursor-pointer"
                >
                  Create User Account
                </button>
              </form>
            </div>

            {/* Users Accounts List */}
            <div className="lg:col-span-7 overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="pb-2">Name</th>
                    <th className="pb-2">Username</th>
                    <th className="pb-2">Staff ID</th>
                    <th className="pb-2">Role</th>
                    <th className="pb-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 font-medium text-slate-350">
                  {usersList.map((user) => (
                    <tr key={user.username} className="hover:bg-slate-850/15">
                      <td className="py-2.5 font-bold text-white">{user.name}</td>
                      <td className="py-2.5 font-mono text-slate-400">{user.username}</td>
                      <td className="py-2.5 font-mono text-slate-400">{user.staffId}</td>
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                          user.role === 'superadmin' 
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/25' 
                            : user.role === 'admin'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/25'
                            : user.role === 'doctor'
                            ? 'bg-teal-500/10 text-teal-400 border border-teal-500/25'
                            : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/25'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-2.5 text-right">
                        <button
                          onClick={() => handleDeleteUser(user.username)}
                          disabled={user.username === currentUser?.username}
                          className="text-rose-500 hover:text-rose-400 font-bold hover:underline disabled:opacity-40 disabled:hover:no-underline cursor-pointer"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
