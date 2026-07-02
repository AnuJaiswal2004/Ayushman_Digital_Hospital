import React, { useState, useEffect } from 'react';
import { 
  UserPlus, CalendarCheck, ClipboardList, Search, 
  Trash2, Edit, AlertCircle, CheckCircle, RefreshCcw, X 
} from 'lucide-react';
import { apiService } from '../../../services/api.js';
import Modal from '../../../components/ui/Modal.jsx';
import Input from '../../../components/ui/Input.jsx';
import Select from '../../../components/ui/Select.jsx';
import Button from '../../../components/ui/Button.jsx';
import Badge from '../../../components/ui/Badge.jsx';

export default function ReceptionTab() {
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Form States
  const [regForm, setRegForm] = useState({
    name: '',
    phone: '',
    dob: '',
    gender: 'male',
    abha: ''
  });

  const [checkInForm, setCheckInForm] = useState({
    patientId: '',
    doctor: 'Dr. Rajesh Sharma',
    department: 'cardiology',
    reason: '',
    type: 'opd'
  });

  // Modal State
  const [editPatient, setEditPatient] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    dob: '',
    gender: 'male'
  });

  const loadData = async () => {
    const listPatients = await apiService.getPatients();
    const listAppts = await apiService.getAppointments();
    setPatients(listPatients);
    setAppointments(listAppts);

    if (listPatients.length > 0 && !checkInForm.patientId) {
      setCheckInForm(prev => ({ ...prev, patientId: listPatients[0].id }));
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleInputChange = (e) => {
    setRegForm({ ...regForm, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!regForm.name || !regForm.phone || !regForm.dob || !regForm.abha) {
      alert('Please fill all required fields including ABHA ID');
      return;
    }

    try {
      await apiService.addPatient({
        ...regForm,
        status: 'Active',
        registrationDate: new Date().toISOString()
      });
      alert(`Patient "${regForm.name}" registered successfully under ABDM roster.`);
      setRegForm({ name: '', phone: '', dob: '', gender: 'male', abha: '' });
      loadData();
    } catch (err) {
      alert('Failed to register patient: ' + err.message);
    }
  };

  const handleCheckIn = async (e) => {
    e.preventDefault();
    if (!checkInForm.patientId) {
      alert('No patient selected.');
      return;
    }

    const patientObj = patients.find(p => p.id === checkInForm.patientId);
    if (!patientObj) return;

    try {
      const idxCount = appointments.filter(a => a.date === new Date().toISOString().split('T')[0]).length + 1;
      const apptData = {
        patientId: patientObj.id,
        patientName: patientObj.name,
        doctor: checkInForm.doctor,
        department: checkInForm.department,
        reason: checkInForm.reason || 'General checkup',
        type: checkInForm.type,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        token: `OPD-${String(idxCount).padStart(3, '0')}`,
        status: 'scheduled'
      };

      await apiService.addAppointment(apptData);

      // System notification
      await apiService.addNotification({
        title: '🆕 Walk-In Checked In',
        message: `Patient ${patientObj.name} checked in for ${checkInForm.doctor} (${checkInForm.department}). Token: ${apptData.token}`,
        type: 'appointment',
        targetRoles: ['admin', 'doctor', 'receptionist']
      });

      alert(`Check-in successful! Token: ${apptData.token}`);
      setCheckInForm(prev => ({ ...prev, reason: '' }));
      loadData();
    } catch (err) {
      alert('Failed to check in patient');
    }
  };

  const handleEditClick = (patient) => {
    setEditPatient(patient);
    setEditForm({
      name: patient.name,
      phone: patient.phone,
      dob: patient.dob,
      gender: patient.gender || 'male'
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiService.updatePatient(editPatient.id, editForm);
      setEditPatient(null);
      loadData();
      alert('Patient updated successfully.');
    } catch (err) {
      alert('Failed to update patient');
    }
  };

  const handleCancelAppointment = async (apptId, patientName) => {
    if (window.confirm(`Are you sure you want to cancel appointment for ${patientName}?`)) {
      try {
        await apiService.cancelAppointment(apptId);
        loadData();
        alert('Appointment cancelled.');
      } catch (err) {
        alert('Failed to cancel appointment');
      }
    }
  };

  // Filter queue for today
  const todayStr = new Date().toISOString().split('T')[0];
  const todayQueue = appointments.filter(a => a.date === todayStr);

  const filteredQueue = todayQueue.filter(a => 
    a.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.doctor.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.token?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getQueueStatusText = (a) => {
    if (a.status === 'cancelled') return 'Cancelled';
    if (a.billing) return 'Discharged';
    if (a.consultation) return 'Billing Desk';
    if (a.vitals) return 'Ready for Consult';
    return 'Waiting for Vitals';
  };

  return (
    <div className="space-y-6 max-w-5xl w-full text-left">
      {/* Upper registration and check-in cards */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Form 1: Walk-in Registration (md:col-span-6) */}
        <div className="elevated-surface p-6 md:col-span-6 space-y-4 shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="bg-emerald-500/10 p-2.5 rounded-xl text-emerald-600 shrink-0">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white font-heading">Walk-in Patient Registration</h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Quickly register patient arriving at front desk</p>
            </div>
          </div>

          <form onSubmit={handleRegister} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Patient Name"
                type="text"
                required
                value={regForm.name}
                onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                placeholder="Full Name"
              />
              <Input
                label="Phone Number"
                type="tel"
                required
                maxLength="10"
                value={regForm.phone}
                onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                placeholder="10-digit Mobile"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Date of Birth"
                type="date"
                required
                value={regForm.dob}
                onChange={(e) => setRegForm({ ...regForm, dob: e.target.value })}
              />
              <Select
                label="Gender"
                value={regForm.gender}
                onChange={(e) => setRegForm({ ...regForm, gender: e.target.value })}
                options={[
                  { value: 'male', label: 'Male' },
                  { value: 'female', label: 'Female' },
                  { value: 'other', label: 'Other' }
                ]}
              />
            </div>

            <Input
              label="ABHA Health Roster ID"
              type="text"
              required
              maxLength="14"
              name="abha"
              value={regForm.abha}
              onChange={handleInputChange}
              placeholder="e.g. 1111-2222-3333"
            />

            <Button
              type="submit"
              variant="emerald"
              className="w-full py-2.5 mt-2"
            >
              Add Patient profile
            </Button>
          </form>
        </div>

        {/* Form 2: Check-in (md:col-span-6) */}
        <div className="elevated-surface p-6 md:col-span-6 space-y-4 shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="bg-blue-500/10 p-2.5 rounded-xl text-blue-600 shrink-0">
              <CalendarCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white font-heading">Patient Check-In (Book Slot)</h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Verify patient list and allocate clinical slot</p>
            </div>
          </div>

          <form onSubmit={handleCheckIn} className="space-y-3">
            <Select
              label="Select Registered Patient"
              value={checkInForm.patientId}
              onChange={(e) => setCheckInForm({ ...checkInForm, patientId: e.target.value })}
              options={
                patients.length === 0 
                  ? [{ value: '', label: 'No patients found' }]
                  : patients.map(p => ({ value: p.id, label: `${p.name} (ABHA: ${p.abha})` }))
              }
            />

            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Clinic Department"
                value={checkInForm.department}
                onChange={(e) => setCheckInForm({ ...checkInForm, department: e.target.value, doctor: e.target.value === 'cardiology' ? 'Dr. Rajesh Sharma' : 'Dr. Asha Sharma' })}
                options={[
                  { value: 'cardiology', label: 'Cardiology' },
                  { value: 'pediatrics', label: 'Pediatrics' },
                  { value: 'orthopedics', label: 'Orthopedics' },
                  { value: 'dermatology', label: 'Dermatology' },
                  { value: 'general', label: 'General Medicine' }
                ]}
              />

              <Select
                label="Assign Provider"
                value={checkInForm.doctor}
                onChange={(e) => setCheckInForm({ ...checkInForm, doctor: e.target.value })}
                options={[
                  { value: 'Dr. Rajesh Sharma', label: 'Dr. Rajesh Sharma' },
                  { value: 'Dr. Asha Sharma', label: 'Dr. Asha Sharma' },
                  { value: 'Dr. Rohan Mehra', label: 'Dr. Rohan Mehra' }
                ]}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Consultation Channel"
                value={checkInForm.type}
                onChange={(e) => setCheckInForm({ ...checkInForm, type: e.target.value })}
                options={[
                  { value: 'opd', label: 'OPD Checkup' },
                  { value: 'teleconsultation', label: 'Tele-consult' }
                ]}
              />

              <Input
                label="Reason / Chief Complaint"
                type="text"
                value={checkInForm.reason}
                onChange={(e) => setCheckInForm({ ...checkInForm, reason: e.target.value })}
                placeholder="e.g. Cough, Fever"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full py-2.5 mt-2"
            >
              Assign Token & Check In
            </Button>
          </form>
        </div>

      </div>

      {/* Queue section (md:col-span-12) */}
      <div className="elevated-surface p-6 shadow-sm space-y-4 border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-500/10 p-2.5 rounded-xl text-indigo-600 shrink-0">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white font-heading">Today's Clinic Queue</h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Real-time status of arriving patients</p>
            </div>
          </div>

          <div className="relative w-full sm:w-64">
            <Input
              type="text"
              icon={Search}
              placeholder="Search by name, token..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200/60 dark:border-slate-800 rounded-xl">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-900/40">
                <th className="py-3.5 px-5">Token</th>
                <th className="py-3.5 px-5">Patient Name</th>
                <th className="py-3.5 px-5">Roster Doctor</th>
                <th className="py-3.5 px-5">Department</th>
                <th className="py-3.5 px-5">Check-In Time</th>
                <th className="py-3.5 px-5">Type</th>
                <th className="py-3.5 px-5">Queue Status</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-600 dark:text-slate-400">
              {filteredQueue.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400 dark:text-slate-500">
                    No active patients checked in today.
                  </td>
                </tr>
              ) : (
                filteredQueue.map(a => {
                  const statusText = getQueueStatusText(a);
                  const patientObj = patients.find(p => p.id === a.patientId);

                  return (
                    <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/20 transition-colors">
                      <td className="py-3.5 px-5 font-mono text-[10px] text-blue-500 dark:text-blue-400 font-extrabold">{a.token || 'OPD-N/A'}</td>
                      <td className="py-3.5 px-5 font-bold text-slate-800 dark:text-white">{a.patientName}</td>
                      <td className="py-3.5 px-5">{a.doctor}</td>
                      <td className="py-3.5 px-5 capitalize">{a.department}</td>
                      <td className="py-3.5 px-5 font-mono text-[10px]">{a.time}</td>
                      <td className="py-3.5 px-5 uppercase text-[9px] font-black">{a.type}</td>
                      <td className="py-3.5 px-5">
                        <Badge 
                          variant={
                            a.status === 'cancelled' ? 'danger' :
                            a.billing ? 'secondary' :
                            a.consultation ? 'indigo' :
                            a.vitals ? 'success' : 'warning'
                          }
                        >
                          {statusText}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex justify-end gap-1.5">
                          {patientObj && (
                            <Button
                              onClick={() => handleEditClick(patientObj)}
                              variant="outline"
                              className="p-1.5 h-8 w-8 rounded-lg"
                              title="Update Demographics"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {a.status !== 'cancelled' && !a.billing && (
                            <Button
                              onClick={() => handleCancelAppointment(a.id, a.patientName)}
                              variant="outline"
                              className="p-1.5 h-8 w-8 rounded-lg hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500"
                              title="Dismiss / Cancel Check-in"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Patient Modal */}
      <Modal
        isOpen={!!editPatient}
        onClose={() => setEditPatient(null)}
        title="Update Demographics"
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
              type="tel"
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
                Save Roster Details
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
