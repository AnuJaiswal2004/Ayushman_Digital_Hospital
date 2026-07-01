import React, { useState, useEffect } from 'react';
import { Search, Eye, Edit2, Calendar, FileText, Activity, X } from 'lucide-react';
import { apiService } from '../../../services/api.js';
import Modal from '../../../components/ui/Modal.jsx';
import Input from '../../../components/ui/Input.jsx';
import Select from '../../../components/ui/Select.jsx';
import Button from '../../../components/ui/Button.jsx';
import Badge from '../../../components/ui/Badge.jsx';
import Table from '../../../components/ui/Table.jsx';
import Card from '../../../components/ui/Card.jsx';

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

  const getPatientTimeline = (patientId) => {
    return appointments
      .filter((a) => a.patientId === patientId)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 card-surface p-4 border border-slate-200 dark:border-slate-800">
        <div className="flex-1">
          <Input
            type="text"
            icon={Search}
            placeholder="Search patients by name, ABHA ID, phone, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="min-w-[140px]"
          options={[
            { value: 'All', label: 'All Statuses' },
            { value: 'Active', label: 'Active' },
            { value: 'In-Treatment', label: 'In-Treatment' },
            { value: 'Discharged', label: 'Discharged' }
          ]}
        />
      </div>

      {/* Patient Table */}
      <Table headers={['ID', 'Name', 'ABHA ID', 'Phone', 'Date of Birth', 'Status', 'Actions']}>
        {filteredPatients.length === 0 ? (
          <tr>
            <td colSpan="7" className="py-8 text-center text-slate-500 font-medium">
              No patients found matching your search.
            </td>
          </tr>
        ) : (
          filteredPatients.map((p) => (
            <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-all border-b border-slate-100 dark:border-slate-800/60">
              <td className="py-4 px-5 font-mono text-xs text-blue-500 dark:text-blue-400 font-bold">{p.id}</td>
              <td className="py-4 px-5 font-bold text-slate-800 dark:text-white">{p.name}</td>
              <td className="py-4 px-5 font-mono text-xs text-slate-400 dark:text-slate-450">{p.abha}</td>
              <td className="py-4 px-5 font-mono text-xs text-slate-400 dark:text-slate-455">{p.phone}</td>
              <td className="py-4 px-5 text-xs text-slate-400 dark:text-slate-450">{new Date(p.dob).toLocaleDateString()}</td>
              <td className="py-4 px-5">
                <Badge 
                  variant={
                    p.status === 'Active' ? 'success' : 
                    p.status === 'In-Treatment' ? 'warning' : 'secondary'
                  }
                >
                  {p.status || 'Active'}
                </Badge>
              </td>
              <td className="py-4 px-5 text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    onClick={() => setViewPatient(p)}
                    variant="outline"
                    className="p-2 h-9 w-9 rounded-xl"
                    title="View History"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => handleEditClick(p)}
                    variant="outline"
                    className="p-2 h-9 w-9 rounded-xl hover:bg-emerald-500/10 hover:text-emerald-500 hover:border-emerald-500"
                    title="Edit Patient"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))
        )}
      </Table>

      {/* View Patient Modal */}
      <Modal
        isOpen={!!viewPatient}
        onClose={() => setViewPatient(null)}
        title="Patient Details"
        size="lg"
      >
        {viewPatient && (
          <div className="space-y-6">
            {/* Demographics */}
            <div className="border-b border-slate-100 dark:border-slate-800 pb-5 space-y-2 text-left">
              <Badge variant="info" className="mb-2">ABHA CARD IDENTIFICATION</Badge>
              <h3 className="text-lg font-black text-slate-800 dark:text-white font-heading">{viewPatient.name}</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-medium text-slate-500 dark:text-slate-400 pt-2">
                <div>
                  <span className="block text-[10px] text-slate-400 dark:text-slate-550 font-bold uppercase">Patient ID</span>
                  <span className="text-slate-800 dark:text-white font-mono">{viewPatient.id}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 dark:text-slate-550 font-bold uppercase">ABHA ID</span>
                  <span className="text-slate-800 dark:text-white font-mono">{viewPatient.abha}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 dark:text-slate-550 font-bold uppercase">Phone Number</span>
                  <span className="text-slate-800 dark:text-white font-mono">{viewPatient.phone}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 dark:text-slate-550 font-bold uppercase">Date of Birth</span>
                  <span className="text-slate-800 dark:text-white">{new Date(viewPatient.dob).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Medical Timeline */}
            <div className="space-y-4 text-left">
              <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-slate-800">
                <Activity className="h-4 w-4 text-blue-500" />
                Clinical Journey & Visits
              </h4>

              {getPatientTimeline(viewPatient.id).length === 0 ? (
                <div className="text-center py-10 text-slate-400 dark:text-slate-500 font-medium text-sm">
                  No registered clinic visits or appointments found.
                </div>
              ) : (
                <div className="space-y-4 relative border-l border-slate-200 dark:border-slate-800 pl-4.5 ml-2.5 pt-2">
                  {getPatientTimeline(viewPatient.id).map((appt) => (
                    <div key={appt.id} className="relative space-y-2 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200/60 dark:border-slate-850">
                      {/* Timeline dot */}
                      <div className="absolute -left-[24.5px] top-5 h-3.5 w-3.5 rounded-full bg-white dark:bg-slate-900 border-2 border-blue-500" />
                      
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="font-bold text-slate-800 dark:text-white text-sm capitalize">{appt.department} Consultation</h5>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Doctor: <span className="text-slate-700 dark:text-slate-300 font-semibold">{appt.doctor}</span></p>
                        </div>
                        <Badge 
                          variant={
                            appt.status === 'completed' ? 'success' : 
                            appt.status === 'scheduled' ? 'warning' : 'danger'
                          }
                        >
                          {appt.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-xs pt-2 border-t border-slate-100 dark:border-slate-800/60 text-slate-500 dark:text-slate-400">
                        <div>
                          <span className="block text-[9px] text-slate-400 dark:text-slate-550 font-bold uppercase">Date & Time</span>
                          <span className="text-slate-700 dark:text-slate-300 font-medium">{new Date(appt.date).toLocaleDateString()} at {appt.time}</span>
                        </div>
                        <div>
                          <span className="block text-[9px] text-slate-400 dark:text-slate-550 font-bold uppercase">Consultation Type</span>
                          <span className="text-slate-700 dark:text-slate-300 uppercase font-bold text-[10px]">{appt.type}</span>
                        </div>
                      </div>

                      {appt.reason && (
                        <div className="pt-2 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/60">
                          <strong className="text-slate-450 dark:text-slate-550 uppercase text-[9px] block">Reason for Visit:</strong>
                          <p className="text-slate-655 dark:text-slate-300 italic">"{appt.reason}"</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Patient Modal */}
      <Modal
        isOpen={!!editPatient}
        onClose={() => setEditPatient(null)}
        title="Edit Patient Demographics"
      >
        {editPatient && (
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <Input
              label="Full Name"
              type="text"
              required
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            />

            <Input
              label="Phone Number"
              type="text"
              required
              maxLength="10"
              value={editForm.phone}
              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Date of Birth"
                type="date"
                required
                value={editForm.dob}
                onChange={(e) => setEditForm({ ...editForm, dob: e.target.value })}
              />

              <Select
                label="Gender"
                value={editForm.gender}
                onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                options={[
                  { value: 'male', label: 'Male' },
                  { value: 'female', label: 'Female' },
                  { value: 'other', label: 'Other' }
                ]}
              />
            </div>

            <Select
              label="Treatment Status"
              value={editForm.status}
              onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
              options={[
                { value: 'Active', label: 'Active' },
                { value: 'In-Treatment', label: 'In-Treatment' },
                { value: 'Discharged', label: 'Discharged' }
              ]}
            />

            <div className="pt-2 flex justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setEditPatient(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
              >
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
