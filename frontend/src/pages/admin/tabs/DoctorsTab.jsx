import React, { useState, useEffect } from 'react';
import { Award, Plus, Building2, Briefcase, CheckCircle, Ban, X } from 'lucide-react';
import { apiService } from '../../../services/api.js';

export default function DoctorsTab() {
  const [doctors, setDoctors] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    specialization: '',
    department: 'general',
    experience: '',
  });

  const loadDoctors = async () => {
    const list = await apiService.getDoctors();
    setDoctors(list);
  };

  useEffect(() => {
    loadDoctors();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, specialization, department, experience } = formData;
    if (!name || !specialization || !experience) {
      alert('Please fill all fields');
      return;
    }

    try {
      await apiService.addDoctor({
        name,
        specialization,
        department,
        experience: `${experience} years`,
        status: 'Available'
      });
      setShowAddModal(false);
      setFormData({ name: '', specialization: '', department: 'general', experience: '' });
      loadDoctors();
      alert('Doctor added successfully');
    } catch (err) {
      alert('Failed to add doctor');
    }
  };

  const getInitials = (name) => {
    return name
      .replace('Dr.', '')
      .trim()
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Header action */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-bold text-base text-white font-heading">Doctor Directory</h3>
          <p className="text-xs text-slate-400 font-medium">Manage clinical providers and specializations</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-blue-500/10 cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Add Doctor
        </button>
      </div>

      {/* Grid of Doctors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {doctors.map((doc) => (
          <div key={doc.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 hover:border-slate-700 hover:shadow-lg transition-all relative overflow-hidden group">
            {/* Status indicator glow border */}
            <div className={`absolute top-0 left-0 right-0 h-1 ${
              doc.status === 'Available' ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-slate-700'
            }`} />

            <div className="flex gap-4 items-center">
              {/* Doctor Avatar */}
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-650 text-white flex items-center justify-center font-bold font-heading text-sm shadow-md">
                {getInitials(doc.name)}
              </div>
              <div className="truncate">
                <h4 className="font-bold text-white text-base truncate font-heading group-hover:text-blue-400 transition-colors">{doc.name}</h4>
                <span className="text-xs text-slate-400 font-medium font-sans flex items-center gap-1">
                  <Award className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                  {doc.specialization}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 py-3 border-y border-slate-800/80 text-xs font-semibold text-slate-400">
              <div className="space-y-1">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Department</span>
                <span className="text-slate-350 capitalize flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5 text-slate-600" />
                  {doc.department}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Experience</span>
                <span className="text-slate-350 flex items-center gap-1">
                  <Briefcase className="h-3.5 w-3.5 text-slate-600" />
                  {doc.experience}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-1">
              <span 
                onClick={async () => {
                  try {
                    await apiService.toggleDoctorAvailability(doc.id);
                    loadDoctors();
                    alert('Doctor availability status updated!');
                  } catch (err) {
                    alert('Failed to update availability status');
                  }
                }}
                className={`inline-flex items-center gap-1 text-[10px] font-bold cursor-pointer hover:underline ${
                  doc.status === 'Available' ? 'text-emerald-400' : 'text-slate-400'
                }`}
                title="Click to toggle availability status"
              >
                {doc.status === 'Available' ? (
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <Ban className="h-3.5 w-3.5 text-slate-500" />
                )}
                {doc.status || 'Available'}
              </span>
              <span className="text-[9px] font-mono text-slate-500 font-bold uppercase">ID: {doc.id}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Doctor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-850 rounded-2xl shadow-2xl max-w-sm w-full p-6 relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-full cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-black text-white mb-5 font-heading">Register Doctor Profile</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Name (with Dr. prefix)</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Dr. Rajesh Sharma"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-medium outline-none text-slate-200 focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Medical Specialization</label>
                <input
                  type="text"
                  name="specialization"
                  required
                  value={formData.specialization}
                  onChange={handleInputChange}
                  placeholder="e.g., Cardiologist, Pediatrician"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-medium outline-none text-slate-200 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Department</label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none text-slate-350 focus:border-blue-500 cursor-pointer"
                  >
                    <option value="cardiology">Cardiology</option>
                    <option value="pediatrics">Pediatrics</option>
                    <option value="orthopedics">Orthopedics</option>
                    <option value="dermatology">Dermatology</option>
                    <option value="general">General Medicine</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Experience (years)</label>
                  <input
                    type="number"
                    name="experience"
                    required
                    value={formData.experience}
                    onChange={handleInputChange}
                    placeholder="e.g., 10"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-medium outline-none text-slate-200 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-5 py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl text-xs transition-all shadow-md shadow-blue-500/10 cursor-pointer"
                >
                  Register Doctor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
