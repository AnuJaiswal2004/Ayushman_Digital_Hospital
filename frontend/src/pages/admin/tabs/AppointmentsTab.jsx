import React, { useState, useEffect } from 'react';
import { Search, Calendar, CalendarClock, Ban, CheckCircle2, X } from 'lucide-react';
import { apiService } from '../../../services/api.js';

export default function AppointmentsTab() {
  const [appointments, setAppointments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');
  
  // Reschedule state
  const [rescheduleApt, setRescheduleApt] = useState(null);
  const [rescheduleForm, setRescheduleForm] = useState({
    date: '',
    time: ''
  });

  const loadAppointments = async () => {
    const list = await apiService.getAppointments();
    setAppointments(list);
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const handleCancel = async (id) => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      try {
        await apiService.updateAppointmentStatus(id, 'cancelled');
        loadAppointments();
        alert('Appointment cancelled successfully');
      } catch (err) {
        alert('Failed to cancel appointment');
      }
    }
  };

  const handleRescheduleClick = (appt) => {
    setRescheduleApt(appt);
    setRescheduleForm({
      date: appt.date,
      time: appt.time
    });
  };

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!rescheduleForm.date || !rescheduleForm.time) {
      alert('Please select a date and time');
      return;
    }
    
    // Validate date is not in the past
    const selectedDate = new Date(rescheduleForm.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      alert('Cannot reschedule appointments in the past');
      return;
    }

    try {
      const id = rescheduleApt.id || rescheduleApt._id;
      await apiService.rescheduleAppointment(id, rescheduleForm.date, rescheduleForm.time);
      setRescheduleApt(null);
      loadAppointments();
      alert('Appointment rescheduled successfully');
    } catch (err) {
      alert('Failed to reschedule appointment');
    }
  };

  const filteredAppointments = appointments.filter((a) => {
    const matchesSearch = 
      a.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.doctor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.id.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesStatus = statusFilter === 'All' || a.status === statusFilter;
    const matchesDate = !dateFilter || a.date === dateFilter;
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 h-4.5 w-4.5" />
          <input
            type="text"
            placeholder="Search appointments by Patient, Doctor, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-850 focus:border-blue-500 rounded-xl pl-11 pr-4 py-2.5 text-sm font-medium outline-none text-slate-200"
          />
        </div>
        
        <div className="flex flex-wrap sm:flex-nowrap gap-3">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 h-4 w-4 pointer-events-none" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-slate-950 border border-slate-850 focus:border-blue-500 rounded-xl pl-9 pr-3 py-2.5 text-xs font-semibold outline-none text-slate-300 w-full min-w-[145px]"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-850 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none text-slate-350 min-w-[140px] cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Appointments Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-900/40">
                <th className="py-4 px-6">ID</th>
                <th className="py-4 px-6">Patient</th>
                <th className="py-4 px-6">Doctor</th>
                <th className="py-4 px-6">Department</th>
                <th className="py-4 px-6">Date & Time</th>
                <th className="py-4 px-6">Type</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
              {filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-500 font-medium">
                    No appointments found matching filters.
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-800/10">
                    <td className="py-4 px-6 font-mono text-xs text-blue-400 font-bold">{a.id}</td>
                    <td className="py-4 px-6 font-bold text-white">{a.patientName}</td>
                    <td className="py-4 px-6 text-slate-200">{a.doctor}</td>
                    <td className="py-4 px-6 text-xs text-slate-400 capitalize">{a.department}</td>
                    <td className="py-4 px-6 text-xs text-slate-300">
                      <div>{new Date(a.date).toLocaleDateString()}</div>
                      <div className="text-[10px] text-slate-500 font-mono font-bold mt-0.5">{a.time}</div>
                    </td>
                    <td className="py-4 px-6 text-xs">
                      <span className={`px-2 py-0.5 rounded font-bold uppercase text-[9px] ${
                        a.type === 'opd' 
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                          : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                      }`}>
                        {a.type}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        a.status === 'completed' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : a.status === 'scheduled'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      {a.status === 'scheduled' ? (
                        <div className="flex justify-end gap-2.5">
                          <button
                            onClick={() => handleRescheduleClick(a)}
                            className="bg-slate-800 text-slate-300 hover:bg-indigo-600 hover:text-white p-2 rounded-xl transition-all cursor-pointer"
                            title="Reschedule Visit"
                          >
                            <CalendarClock className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleCancel(a.id)}
                            className="bg-slate-800 text-slate-300 hover:bg-rose-600 hover:text-white p-2 rounded-xl transition-all cursor-pointer"
                            title="Cancel Appointment"
                          >
                            <Ban className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] font-mono text-slate-500 flex items-center justify-end gap-1.5 font-bold mr-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-slate-650" /> ARCHIVED
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reschedule Modal */}
      {rescheduleApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-850 rounded-2xl shadow-2xl max-w-sm w-full p-6 relative">
            <button
              onClick={() => setRescheduleApt(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-full cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-black text-white mb-2 font-heading">Reschedule Visit</h3>
            <p className="text-xs text-slate-400 mb-5">Patient: <strong className="text-white">{rescheduleApt.patientName}</strong></p>

            <form onSubmit={handleRescheduleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">New Appointment Date</label>
                <input
                  type="date"
                  required
                  value={rescheduleForm.date}
                  onChange={(e) => setRescheduleForm({ ...rescheduleForm, date: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-medium outline-none text-slate-200 focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">New Time Slot</label>
                <select
                  required
                  value={rescheduleForm.time}
                  onChange={(e) => setRescheduleForm({ ...rescheduleForm, time: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none text-slate-350 focus:border-blue-500 cursor-pointer"
                >
                  <option value="">Select Time Slot</option>
                  <option value="09:00 AM">09:00 AM</option>
                  <option value="10:00 AM">10:00 AM</option>
                  <option value="11:00 AM">11:00 AM</option>
                  <option value="02:00 PM">02:00 PM</option>
                  <option value="03:00 PM">03:00 PM</option>
                  <option value="04:00 PM">04:00 PM</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setRescheduleApt(null)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-5 py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2.5 rounded-xl text-xs transition-all shadow-md shadow-indigo-500/10 cursor-pointer"
                >
                  Confirm Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
