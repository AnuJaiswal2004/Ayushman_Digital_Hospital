import React, { useState, useEffect } from 'react';
import { Search, Eye, Edit2, Calendar, FileText, Activity, X } from 'lucide-react';
import { apiService } from '../../../services/api.js';

export default function PatientsTab() {
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Modal states
  const [viewPatient, setViewPatient] = useState(null);
  const [editPatient, setEditPatient] = useState(null);
  
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    dob: '',
    gender: '',
    status: 'Active'
  });

  const loadData = async () => {
    const p = await apiService.getPatients();
    const a = await apiService.getAppointments();
    setPatients(p);
    setAppointments(a);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEditClick = (patient) => {
    setEditPatient(patient);
    setEditForm({
      name: patient.name,
      phone: patient.phone,
      dob: patient.dob,
      gender: patient.gender,
      status: patient.status || 'Active'
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.name || !editForm.phone) {
      alert('Please fill name and phone');
      return;
    }
    try {
      const id = editPatient.id || editPatient._id;
      await apiService.updatePatient(id, editForm);
      setEditPatient(null);
      loadData();
      alert('Patient updated successfully');
    } catch (err) {
      alert('Failed to update patient');
    }
  };

  const filteredPatients = patients.filter((p) => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone.includes(searchQuery) ||
      p.abha.includes(searchQuery) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Get patient appointment timeline
  const getPatientTimeline = (patientId) => {
    return appointments
      .filter((a) => a.patientId === patientId)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 h-4.5 w-4.5" />
          <input
            type="text"
            placeholder="Search patients by name, ABHA ID, phone, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-850 focus:border-blue-500 rounded-xl pl-11 pr-4 py-2.5 text-sm font-medium outline-none text-slate-200"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-950 border border-slate-850 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none text-slate-300 min-w-[140px] cursor-pointer"
        >
          <option value="All">All Statuses</option>
          <option value="Active">Active</option>
          <option value="In-Treatment">In-Treatment</option>
          <option value="Discharged">Discharged</option>
        </select>
      </div>

      {/* Patient Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-900/40">
                <th className="py-4 px-6">ID</th>
                <th className="py-4 px-6">Name</th>
                <th className="py-4 px-6">ABHA ID</th>
                <th className="py-4 px-6">Phone</th>
                <th className="py-4 px-6">Date of Birth</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-500 font-medium">
                    No patients found matching your search.
                  </td>
                </tr>
              ) : (
                filteredPatients.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/10">
                    <td className="py-4 px-6 font-mono text-xs text-blue-400 font-bold">{p.id}</td>
                    <td className="py-4 px-6 font-bold text-white">{p.name}</td>
                    <td className="py-4 px-6 font-mono text-xs text-slate-400">{p.abha}</td>
                    <td className="py-4 px-6 font-mono text-xs text-slate-400">{p.phone}</td>
                    <td className="py-4 px-6 text-xs text-slate-400">{new Date(p.dob).toLocaleDateString()}</td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        p.status === 'Active' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : p.status === 'In-Treatment'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-slate-850 text-slate-400 border border-slate-700'
                      }`}>
                        {p.status || 'Active'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-2.5">
                        <button
                          onClick={() => setViewPatient(p)}
                          className="bg-slate-800 text-slate-300 hover:bg-blue-600 hover:text-white p-2 rounded-xl transition-all cursor-pointer"
                          title="View History"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEditClick(p)}
                          className="bg-slate-800 text-slate-300 hover:bg-teal-600 hover:text-white p-2 rounded-xl transition-all cursor-pointer"
                          title="Edit Patient"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Patient Modal */}
      {viewPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-850 rounded-2xl shadow-2xl max-w-2xl w-full p-6 relative flex flex-col max-h-[85vh]">
            <button
              onClick={() => setViewPatient(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-full cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Demographics */}
            <div className="border-b border-slate-800 pb-5 mb-5 space-y-2">
              <span className="text-[10px] font-bold bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20">ABHA CARD IDENTIFICATION</span>
              <h3 className="text-xl font-black text-white font-heading">{viewPatient.name}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-medium text-slate-400 pt-2">
                <div>
                  <span className="block text-[10px] text-slate-500 font-bold uppercase">Patient ID</span>
                  <span className="text-white font-mono">{viewPatient.id}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500 font-bold uppercase">ABHA ID</span>
                  <span className="text-white font-mono">{viewPatient.abha}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500 font-bold uppercase">Phone Number</span>
                  <span className="text-white font-mono">{viewPatient.phone}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500 font-bold uppercase">Date of Birth</span>
                  <span className="text-white">{new Date(viewPatient.dob).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Medical Timeline */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 pb-2 border-b border-slate-800/60">
                <Activity className="h-4 w-4 text-blue-500" />
                Clinical Journey & Visits
              </h4>

              {getPatientTimeline(viewPatient.id).length === 0 ? (
                <div className="text-center py-10 text-slate-500 font-medium text-sm">
                  No registered clinic visits or appointments found.
                </div>
              ) : (
                <div className="space-y-4 relative border-l border-slate-800 pl-4.5 ml-2.5 pt-2">
                  {getPatientTimeline(viewPatient.id).map((appt) => (
                    <div key={appt.id} className="relative space-y-2 bg-slate-950/40 p-4 rounded-xl border border-slate-850/60">
                      {/* Timeline dot */}
                      <div className="absolute -left-[24.5px] top-5 h-3.5 w-3.5 rounded-full bg-slate-900 border-2 border-blue-500" />
                      
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="font-bold text-white text-sm capitalize">{appt.department} Consultation</h5>
                          <p className="text-xs text-slate-400">Doctor: <span className="text-slate-300 font-semibold">{appt.doctor}</span></p>
                        </div>
                        <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                          appt.status === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : appt.status === 'scheduled'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {appt.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-xs pt-2 border-t border-slate-800/40 text-slate-400">
                        <div>
                          <span className="block text-[9px] text-slate-500 font-bold uppercase">Date & Time</span>
                          <span className="text-slate-300 font-medium">{new Date(appt.date).toLocaleDateString()} at {appt.time}</span>
                        </div>
                        <div>
                          <span className="block text-[9px] text-slate-500 font-bold uppercase">Consultation Type</span>
                          <span className="text-slate-300 uppercase font-bold text-[10px]">{appt.type}</span>
                        </div>
                      </div>

                      {appt.reason && (
                        <div className="pt-2 text-xs text-slate-400 border-t border-slate-800/40">
                          <strong className="text-slate-500 uppercase text-[9px] block">Reason for Visit:</strong>
                          <p className="text-slate-300 italic">"{appt.reason}"</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Patient Modal */}
      {editPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-850 rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setEditPatient(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-full cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-black text-white mb-5 font-heading">Edit Patient Demographics</h3>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-medium outline-none text-slate-200 focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone Number</label>
                <input
                  type="text"
                  required
                  maxLength="10"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-medium outline-none text-slate-200 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date of Birth</label>
                  <input
                    type="date"
                    required
                    value={editForm.dob}
                    onChange={(e) => setEditForm({ ...editForm, dob: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-medium outline-none text-slate-200 focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gender</label>
                  <select
                    value={editForm.gender}
                    onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none text-slate-350 focus:border-blue-500 cursor-pointer"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Treatment Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none text-slate-350 focus:border-blue-500 cursor-pointer"
                >
                  <option value="Active">Active</option>
                  <option value="In-Treatment">In-Treatment</option>
                  <option value="Discharged">Discharged</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditPatient(null)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-5 py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl text-xs transition-all shadow-md shadow-blue-500/10 cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
