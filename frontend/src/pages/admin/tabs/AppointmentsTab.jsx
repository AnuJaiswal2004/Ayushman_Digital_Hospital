import React, { useState, useEffect } from 'react';
import { Search, Calendar, CalendarClock, Ban, CheckCircle2, X } from 'lucide-react';
import { apiService } from '../../../services/api.js';
import Modal from '../../../components/ui/Modal.jsx';
import Input from '../../../components/ui/Input.jsx';
import Select from '../../../components/ui/Select.jsx';
import Button from '../../../components/ui/Button.jsx';
import Badge from '../../../components/ui/Badge.jsx';
import Table from '../../../components/ui/Table.jsx';

export default function AppointmentsTab() {
  const [appointments, setAppointments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');

  // Reschedule Form State
  const [rescheduleApt, setRescheduleApt] = useState(null);
  const [rescheduleForm, setRescheduleForm] = useState({
    date: '',
    time: ''
  });

  const loadAppointments = async () => {
    const list = await apiService.getAppointments();
    // Sort scheduled first, then by date descending
    const sorted = list.sort((a, b) => {
      if (a.status === 'scheduled' && b.status !== 'scheduled') return -1;
      if (a.status !== 'scheduled' && b.status === 'scheduled') return 1;
      return new Date(b.date) - new Date(a.date);
    });
    setAppointments(sorted);
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const handleCancel = async (id) => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      try {
        await apiService.cancelAppointment(id);
        loadAppointments();
        alert('Appointment cancelled successfully.');
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
      alert('Please select both date and time slot.');
      return;
    }

    try {
      await apiService.rescheduleAppointment(rescheduleApt.id, rescheduleForm.date, rescheduleForm.time);
      setRescheduleApt(null);
      loadAppointments();
      alert('Appointment rescheduled successfully.');
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
      <div className="flex flex-col md:flex-row gap-4 card-surface p-4 border border-slate-200 dark:border-slate-800">
        <div className="flex-1">
          <Input
            type="text"
            icon={Search}
            placeholder="Search appointments by Patient, Doctor, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap sm:flex-nowrap gap-3">
          <div className="relative w-full sm:w-auto">
            <Input
              type="date"
              icon={Calendar}
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="min-w-[145px]"
            />
          </div>

          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="min-w-[140px]"
            options={[
              { value: 'All', label: 'All Statuses' },
              { value: 'scheduled', label: 'Scheduled' },
              { value: 'completed', label: 'Completed' },
              { value: 'cancelled', label: 'Cancelled' }
            ]}
          />
        </div>
      </div>

      {/* Appointments Table */}
      <Table headers={['ID', 'Patient', 'Doctor', 'Department', 'Date & Time', 'Type', 'Status', 'Actions']}>
        {filteredAppointments.length === 0 ? (
          <tr>
            <td colSpan="8" className="py-8 text-center text-slate-500 font-medium">
              No appointments found matching filters.
            </td>
          </tr>
        ) : (
          filteredAppointments.map((a) => (
            <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-all border-b border-slate-100 dark:border-slate-800/60">
              <td className="py-4 px-5 font-mono text-xs text-blue-500 dark:text-blue-400 font-bold">{a.id}</td>
              <td className="py-4 px-5 font-bold text-slate-800 dark:text-white">{a.patientName}</td>
              <td className="py-4 px-5 text-slate-600 dark:text-slate-200">{a.doctor}</td>
              <td className="py-4 px-5 text-xs text-slate-400 dark:text-slate-400 capitalize">{a.department}</td>
              <td className="py-4 px-5 text-xs text-slate-500 dark:text-slate-300">
                <div>{new Date(a.date).toLocaleDateString()}</div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono font-bold mt-0.5">{a.time}</div>
              </td>
              <td className="py-4 px-5 text-xs">
                <Badge variant={a.type === 'opd' ? 'info' : 'indigo'}>
                  {a.type}
                </Badge>
              </td>
              <td className="py-4 px-5">
                <Badge 
                  variant={
                    a.status === 'completed' ? 'success' : 
                    a.status === 'scheduled' ? 'warning' : 'danger'
                  }
                >
                  {a.status}
                </Badge>
              </td>
              <td className="py-4 px-5 text-right">
                {a.status === 'scheduled' ? (
                  <div className="flex justify-end gap-2">
                    <Button
                      onClick={() => handleRescheduleClick(a)}
                      variant="outline"
                      className="p-2 h-9 w-9 rounded-xl"
                      title="Reschedule Visit"
                    >
                      <CalendarClock className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => handleCancel(a.id)}
                      variant="outline"
                      className="p-2 h-9 w-9 rounded-xl hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500"
                      title="Cancel Appointment"
                    >
                      <Ban className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 flex items-center justify-end gap-1.5 font-bold mr-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> ARCHIVED
                  </span>
                )}
              </td>
            </tr>
          ))
        )}
      </Table>

      {/* Reschedule Modal */}
      <Modal
        isOpen={!!rescheduleApt}
        onClose={() => setRescheduleApt(null)}
        title="Reschedule Visit"
      >
        {rescheduleApt && (
          <div className="space-y-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Patient: <strong className="text-slate-800 dark:text-white">{rescheduleApt.patientName}</strong>
            </p>

            <form onSubmit={handleRescheduleSubmit} className="space-y-4">
              <Input
                label="New Appointment Date"
                type="date"
                required
                value={rescheduleForm.date}
                onChange={(e) => setRescheduleForm({ ...rescheduleForm, date: e.target.value })}
              />

              <Select
                label="New Time Slot"
                required
                value={rescheduleForm.time}
                onChange={(e) => setRescheduleForm({ ...rescheduleForm, time: e.target.value })}
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

              <div className="pt-2 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setRescheduleApt(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="indigo"
                >
                  Confirm Slot
                </Button>
              </div>
            </form>
          </div>
        )}
      </Modal>
    </div>
  );
}
