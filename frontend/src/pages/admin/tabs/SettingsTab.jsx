import React, { useState, useEffect } from 'react';
import { Settings, HelpCircle, Phone, MapPin, Building, Clock, Calendar, ShieldAlert, Key, ShieldCheck, UserPlus, Users } from 'lucide-react';
import { apiService } from '../../../services/api.js';
import Card from '../../../components/ui/Card.jsx';
import Input from '../../../components/ui/Input.jsx';
import Select from '../../../components/ui/Select.jsx';
import Button from '../../../components/ui/Button.jsx';
import Badge from '../../../components/ui/Badge.jsx';
import Table from '../../../components/ui/Table.jsx';

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
    <div className="space-y-6 text-left max-w-4xl w-full">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* System Settings Form (Left/Top) */}
        <Card className="md:col-span-7 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="bg-blue-500/10 p-2.5 rounded-xl text-blue-500">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-800 dark:text-white font-heading">System Parameters</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Configure hospital profile and slot allocations</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* General Settings */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Building className="h-4 w-4 text-blue-500 shrink-0" />
                General Information
              </h4>

              <Input
                label="Hospital Name"
                icon={Building}
                type="text"
                name="hospitalName"
                value={formData.hospitalName}
                onChange={handleInputChange}
                placeholder="Enter hospital name"
              />

              <div className="space-y-1.5 w-full">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Hospital Address</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-4 text-slate-400 dark:text-slate-500 h-4 w-4 pointer-events-none" />
                  <textarea
                    name="address"
                    rows="2"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full input-surface pl-11 pr-4 py-2.5"
                    placeholder="Enter physical address"
                  />
                </div>
              </div>

              <Input
                label="Contact Phone Number"
                icon={Phone}
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="e.g., +91-XXXX-XXXXXX"
              />
            </div>

            {/* Roster & Scheduling Configuration */}
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-indigo-500 shrink-0" />
                Scheduling & Roster Config
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Slot Duration (min)"
                  icon={Clock}
                  type="number"
                  name="slotDuration"
                  value={formData.slotDuration}
                  onChange={handleInputChange}
                  min="5"
                  max="120"
                />

                <Input
                  label="Max Lead Time (days)"
                  icon={Calendar}
                  type="number"
                  name="bookingWindow"
                  value={formData.bookingWindow}
                  onChange={handleInputChange}
                  min="1"
                  max="365"
                />
              </div>
            </div>

            {/* Submit */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1">
                <HelpCircle className="h-3.5 w-3.5" /> Values synced dynamically
              </span>
              <Button
                type="submit"
                disabled={saving}
                variant="primary"
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </form>
        </Card>

        {/* Change Password / Security Panel (Right) */}
        <div className="space-y-6 md:col-span-5">
          <Card className="space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="bg-indigo-500/10 p-2.5 rounded-xl text-indigo-500">
                <Key className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-800 dark:text-white font-heading">Security Credentials</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Update current administrative password</p>
              </div>
            </div>

            {securityError && <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 text-xs p-3 rounded-xl font-medium">{securityError}</div>}
            {securitySuccess && <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs p-3 rounded-xl font-medium">{securitySuccess}</div>}

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
                label="Confirm New Password"
                type="password"
                required
                value={securityForm.confirmPassword}
                onChange={(e) => setSecurityForm({ ...securityForm, confirmPassword: e.target.value })}
                placeholder="Confirm new password"
              />

              <Button
                type="submit"
                variant="indigo"
                className="w-full py-3"
              >
                Change Security Password
              </Button>
            </form>
          </Card>
        </div>
      </div>

      {/* User Management System (Super Admin Only) */}
      {currentUser && currentUser.role === 'superadmin' && (
        <Card className="space-y-6">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-500/10 p-2.5 rounded-xl text-emerald-500">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-800 dark:text-white font-heading">User Account Configuration</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Add, remove, or change system administrative roles</p>
              </div>
            </div>
            <Badge variant="success">SUPER ADMIN</Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Create Account Form */}
            <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
              <h4 className="text-xs font-bold text-slate-700 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <UserPlus className="h-4 w-4 text-emerald-500" /> Register Provider / Operator Account
              </h4>

              <form onSubmit={handleCreateUser} className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Username"
                    type="text"
                    required
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    placeholder="username"
                  />
                  <Input
                    label="Password"
                    type="password"
                    required
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    placeholder="password"
                  />
                </div>

                <Input
                  label="Full Name"
                  type="text"
                  required
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="e.g. Asha Sharma"
                />

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Staff / Operator ID"
                    type="text"
                    required
                    value={newUser.staffId}
                    onChange={(e) => setNewUser({ ...newUser, staffId: e.target.value })}
                    placeholder="e.g. STAFF003"
                  />

                  <Select
                    label="System Role"
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value, department: e.target.value !== 'doctor' ? '' : newUser.department })}
                    options={[
                      { value: 'admin', label: 'Administrator' },
                      { value: 'doctor', label: 'Medical Doctor' },
                      { value: 'receptionist', label: 'Receptionist Desk' },
                      { value: 'superadmin', label: 'Super Administrator' }
                    ]}
                  />
                </div>

                {newUser.role === 'doctor' && (
                  <Select
                    label="Clinical Department"
                    value={newUser.department}
                    onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                    required={newUser.role === 'doctor'}
                    options={[
                      { value: '', label: 'Select Department' },
                      { value: 'cardiology', label: 'Cardiology' },
                      { value: 'pediatrics', label: 'Pediatrics' },
                      { value: 'orthopedics', label: 'Orthopedics' },
                      { value: 'dermatology', label: 'Dermatology' },
                      { value: 'general', label: 'General Medicine' }
                    ]}
                  />
                )}

                <Button
                  type="submit"
                  variant="emerald"
                  className="w-full py-2"
                >
                  Create User Account
                </Button>
              </form>
            </div>

            {/* Users Accounts List */}
            <div className="lg:col-span-7">
              <Table headers={['Name', 'Username', 'Staff ID', 'Role', 'Action']}>
                {usersList.map((user) => (
                  <tr key={user.username} className="hover:bg-slate-50 dark:hover:bg-slate-800/10 border-b border-slate-100 dark:border-slate-800/60">
                    <td className="py-2.5 px-5 font-bold text-slate-900 dark:text-white">{user.name}</td>
                    <td className="py-2.5 px-5 font-mono text-slate-500 dark:text-slate-400">{user.username}</td>
                    <td className="py-2.5 px-5 font-mono text-slate-500 dark:text-slate-400">{user.staffId}</td>
                    <td className="py-2.5 px-5">
                      <Badge 
                        variant={
                          user.role === 'superadmin' ? 'danger' : 
                          user.role === 'admin' ? 'info' : 
                          user.role === 'doctor' ? 'success' : 'indigo'
                        }
                      >
                        {user.role}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-5 text-right">
                      <Button
                        onClick={() => handleDeleteUser(user.username)}
                        disabled={user.username === currentUser?.username}
                        variant="outline"
                        className="py-1 px-3.5 hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500"
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </Table>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
