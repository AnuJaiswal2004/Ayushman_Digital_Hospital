import React, { useState, useEffect } from 'react';
import { UserPlus, UserCheck, CheckCircle2, Award, ListOrdered, Thermometer, Ban, Search, Clock, Plus, HelpCircle, HeartPulse, User } from 'lucide-react';
import { apiService } from '../../../services/api.js';

export default function ReceptionTab() {
  // Global lists
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  
  // Registration state
  const [regForm, setRegForm] = useState({
    name: '',
    abha: '',
    phone: '',
    dob: '',
    gender: 'male',
    password: 'password'
  });
  
  // Booking state
  const [bookForm, setBookForm] = useState({
    patientId: '',
    department: '',
    doctor: '',
    date: new Date().toISOString().split('T')[0],
    time: '',
    type: 'opd',
    reason: ''
  });

  // Vitals state (Receptionist can log vitals on-the-spot)
  const [vitalsApt, setVitalsApt] = useState(null);
  const [vitalsForm, setVitalsForm] = useState({
    temp: '',
    pulse: '',
    bpSys: '',
    bpDia: '',
    notes: ''
  });

  // Search queries
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    const allP = await apiService.getPatients();
    const allD = await apiService.getDoctors();
    const allA = await apiService.getAppointments();
    setPatients(allP);
    setDoctors(allD);
    setAppointments(allA);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!regForm.name || !regForm.phone || !regForm.dob) {
      alert('Please fill Name, Phone, and DOB');
      return;
    }
    
    // Auto-generate ABHA ID if blank
    let abhaStr = regForm.abha.trim();
    if (!abhaStr) {
      abhaStr = Math.floor(10000000000000 + Math.random() * 90000000000000).toString();
    }

    try {
      const patientData = { ...regForm, abha: abhaStr };
      const newP = await apiService.registerPatient(patientData);
      alert(`Patient registered successfully!\nABHA ID: ${abhaStr}`);
      
      // Auto fill patient in booking form
      setBookForm(prev => ({ ...prev, patientId: newP.id }));
      setRegForm({
        name: '',
        abha: '',
        phone: '',
        dob: '',
        gender: 'male',
        password: 'password'
      });
      loadData();
    } catch (err) {
      alert('Failed to register patient');
    }
  };

  const handleCheckIn = async (e) => {
    e.preventDefault();
    if (!bookForm.patientId || !bookForm.doctor || !bookForm.time) {
      alert('Please select Patient, Doctor, and Time Slot');
      return;
    }

    const patientObj = patients.find(p => p.id === bookForm.patientId);
    if (!patientObj) return;

    try {
      const tokenStr = 'TKN' + String(appointments.length + 1).padStart(3, '0');
      await apiService.bookAppointment({
        patientId: patientObj.id,
        patientName: patientObj.name,
        department: bookForm.department || 'general',
        doctor: bookForm.doctor,
        date: bookForm.date,
        time: bookForm.time,
        type: bookForm.type,
        reason: bookForm.reason || 'Walk-in check-in',
        token: tokenStr
      });

      alert(`Checked in successfully! Token: ${tokenStr}`);
      setBookForm({
        patientId: '',
        department: '',
        doctor: '',
        date: new Date().toISOString().split('T')[0],
        time: '',
        type: 'opd',
        reason: ''
      });
      loadData();
    } catch (err) {
      alert('Check-in failed');
    }
  };

  const handleDoctorReassign = async (aptId, newDoctorName) => {
    try {
      const docObj = doctors.find(d => d.name === newDoctorName);
      const allAppts = JSON.parse(localStorage.getItem('appointments')) || [];
      const idx = allAppts.findIndex(a => a.id === aptId || a._id === aptId);
      if (idx !== -1) {
        allAppts[idx].doctor = newDoctorName;
        if (docObj) {
          allAppts[idx].department = docObj.department;
        }
        localStorage.setItem('appointments', JSON.stringify(allAppts));
        loadData();
        alert('Doctor reassigned successfully!');
      }
    } catch (err) {
      alert('Reassignment failed');
    }
  };

  const handleCancel = async (aptId) => {
    if (window.confirm('Cancel check-in queue token?')) {
      try {
        await apiService.updateAppointmentStatus(aptId, 'cancelled');
        loadData();
      } catch (err) {
        alert('Failed to cancel');
      }
    }
  };

  const handleSaveVitals = (e) => {
    e.preventDefault();
    const { temp, pulse, bpSys, bpDia, notes } = vitalsForm;
    if (!temp || !pulse || !bpSys || !bpDia) {
      alert('Please fill all vitals');
      return;
    }

    try {
      const allAppts = JSON.parse(localStorage.getItem('appointments')) || [];
      const idx = allAppts.findIndex(a => a.id === vitalsApt.id || a._id === vitalsApt.id);
      if (idx !== -1) {
        allAppts[idx].vitals = {
          temperature: temp,
          pulse,
          bloodPressure: `${bpSys}/${bpDia}`,
          notes,
          recordedBy: 'Receptionist Desk',
          recordedAt: new Date().toISOString()
        };
        localStorage.setItem('appointments', JSON.stringify(allAppts));
        alert('Vitals logged successfully. Patient queue forwarded to Consultation.');
        setVitalsApt(null);
        setVitalsForm({ temp: '', pulse: '', bpSys: '', bpDia: '', notes: '' });
        loadData();
      }
    } catch (err) {
      alert('Failed to log vitals');
    }
  };

  // Filter queue for today
  const todayStr = new Date().toISOString().split('T')[0];
  const activeTodayQueue = appointments.filter(a => {
    const matchesSearch = a.patientName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          a.doctor.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (a.token && a.token.toLowerCase().includes(searchQuery.toLowerCase()));
    return a.date === todayStr && matchesSearch;
  });

  const getQueueStatusText = (a) => {
    if (a.status === 'cancelled') return 'Cancelled';
    if (a.billing) return 'Discharged';
    if (a.consultation) return 'Billing Desk';
    if (a.vitals) return 'Ready for Consult';
    return 'Waiting for Vitals';
  };

  return (
    <div className="space-y-6 max-w-5xl w-full">
      {/* Upper registration and check-in cards */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Form 1: Walk-in Registration (md:col-span-6) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 md:col-span-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="bg-emerald-500/10 p-2.5 rounded-xl text-emerald-600">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800 font-heading">Walk-in Patient Registration</h3>
              <p className="text-[10px] text-slate-400 font-medium">Quickly register patient arriving at front desk</p>
            </div>
          </div>

          <form onSubmit={handleRegister} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Patient Name</label>
                <input
                  type="text"
                  required
                  value={regForm.name}
                  onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                  placeholder="Full Name"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-lg p-2 text-xs outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Phone Number</label>
                <input
                  type="tel"
                  required
                  maxLength="10"
                  value={regForm.phone}
                  onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                  placeholder="10-digit mobile"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-lg p-2 text-xs outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Date of Birth</label>
                <input
                  type="date"
                  required
                  value={regForm.dob}
                  onChange={(e) => setRegForm({ ...regForm, dob: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-lg p-2 text-xs outline-none text-slate-650"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Gender</label>
                <select
                  value={regForm.gender}
                  onChange={(e) => setRegForm({ ...regForm, gender: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-lg p-2 text-xs outline-none cursor-pointer"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase">ABHA ID (14 digits - blank to auto-generate)</label>
              <input
                type="text"
                maxLength="14"
                value={regForm.abha}
                onChange={(e) => setRegForm({ ...regForm, abha: e.target.value })}
                placeholder="Auto-generates if left blank"
                className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-lg p-2 text-xs outline-none font-mono"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-xs transition-all cursor-pointer"
            >
              Register Walk-in & Load Check-in
            </button>
          </form>
        </div>

        {/* Form 2: Token Gen & Check-in (md:col-span-6) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 md:col-span-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="bg-indigo-500/10 p-2.5 rounded-xl text-indigo-600">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800 font-heading">Token Check-in & Appointment Booking</h3>
              <p className="text-[10px] text-slate-400 font-medium">Issue active token and assign practitioner roster</p>
            </div>
          </div>

          <form onSubmit={handleCheckIn} className="space-y-3">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase">Select Patient</label>
              <select
                value={bookForm.patientId}
                required
                onChange={(e) => setBookForm({ ...bookForm, patientId: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-lg p-2 text-xs outline-none cursor-pointer text-slate-700 font-medium"
              >
                <option value="">Choose registered patient...</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.name} (Phone: {p.phone})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Department</label>
                <select
                  value={bookForm.department}
                  onChange={(e) => setBookForm({ ...bookForm, department: e.target.value, doctor: '' })}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-lg p-2 text-xs outline-none cursor-pointer"
                >
                  <option value="">General (Default)</option>
                  <option value="cardiology">Cardiology</option>
                  <option value="pediatrics">Pediatrics</option>
                  <option value="orthopedics">Orthopedics</option>
                  <option value="dermatology">Dermatology</option>
                  <option value="general">General Medicine</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Assign Doctor</label>
                <select
                  value={bookForm.doctor}
                  required
                  onChange={(e) => {
                    const docObj = doctors.find(d => d.name === e.target.value);
                    setBookForm({ 
                      ...bookForm, 
                      doctor: e.target.value, 
                      department: docObj ? docObj.department : bookForm.department 
                    });
                  }}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-lg p-2 text-xs outline-none cursor-pointer text-slate-700 font-medium"
                >
                  <option value="">Choose Doctor...</option>
                  {doctors.filter(d => !bookForm.department || d.department === bookForm.department).map(d => (
                    <option key={d.id} value={d.name}>{d.name} ({d.specialization})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Appointment Time Slot</label>
                <select
                  value={bookForm.time}
                  required
                  onChange={(e) => setBookForm({ ...bookForm, time: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-lg p-2 text-xs outline-none cursor-pointer"
                >
                  <option value="">Choose Slot...</option>
                  <option value="09:00 AM">09:00 AM</option>
                  <option value="10:00 AM">10:00 AM</option>
                  <option value="11:00 AM">11:00 AM</option>
                  <option value="02:00 PM">02:00 PM</option>
                  <option value="03:00 PM">03:00 PM</option>
                  <option value="04:00 PM">04:00 PM</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Traffic Type</label>
                <select
                  value={bookForm.type}
                  onChange={(e) => setBookForm({ ...bookForm, type: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-lg p-2 text-xs outline-none cursor-pointer"
                >
                  <option value="opd">OPD (In-Person)</option>
                  <option value="telemedicine">Telemedicine (Online)</option>
                  <option value="emergency">Emergency Case</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase">Reason for Consultation</label>
              <input
                type="text"
                value={bookForm.reason}
                onChange={(e) => setBookForm({ ...bookForm, reason: e.target.value })}
                placeholder="Primary complaint..."
                className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-lg p-2 text-xs outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-650 hover:bg-indigo-700 text-white font-bold py-2 rounded-xl text-xs transition-all cursor-pointer"
            >
              Generate Queue Token & Check-in
            </button>
          </form>
        </div>
      </div>

      {/* Queue Management Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-base text-slate-850 font-heading">Queue Management Desk</h3>
            <p className="text-xs text-slate-400 font-medium">Real-time patient check-ins and clinical flows today</p>
          </div>
          
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search active tokens..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs font-semibold outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/40">
                <th className="py-3 px-4">Token</th>
                <th className="py-3 px-4">Patient</th>
                <th className="py-3 px-4">Assigned Doctor</th>
                <th className="py-3 px-4">Slot</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Active Stage</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-655">
              {activeTodayQueue.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-6 text-center text-slate-400 font-medium">No check-ins active in the queue today.</td>
                </tr>
              ) : (
                activeTodayQueue.map(a => {
                  const stage = getQueueStatusText(a);
                  return (
                    <tr key={a.id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 font-mono font-bold text-emerald-600 text-[11px]">{a.token || 'OPD-N/A'}</td>
                      <td className="py-3 px-4 font-bold text-slate-800">{a.patientName}</td>
                      <td className="py-3 px-4">
                        <select
                          value={a.doctor}
                          onChange={(e) => handleDoctorReassign(a.id || a._id, e.target.value)}
                          disabled={a.status === 'completed' || a.status === 'cancelled'}
                          className="bg-slate-50 border border-slate-200/80 rounded p-1 text-[11px] outline-none cursor-pointer max-w-[150px] font-semibold text-slate-700"
                        >
                          {doctors.map(d => (
                            <option key={d.id} value={d.name}>{d.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-4 font-mono text-[10px]">{a.time}</td>
                      <td className="py-3 px-4">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                          a.type === 'emergency' ? 'bg-rose-100 text-rose-700' : a.type === 'telemedicine' ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {a.type}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                          stage === 'Discharged' 
                            ? 'bg-slate-100 text-slate-500 border border-slate-200' 
                            : stage === 'Billing Desk'
                            ? 'bg-amber-100 text-amber-700 border border-amber-200'
                            : stage === 'Ready for Consult'
                            ? 'bg-teal-100 text-teal-700 border border-teal-200 animate-pulse-soft'
                            : stage === 'Cancelled'
                            ? 'bg-rose-100 text-rose-600 border border-rose-200'
                            : 'bg-blue-100 text-blue-700 border border-blue-200'
                        }`}>
                          {stage}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1.5">
                        {stage === 'Waiting for Vitals' && (
                          <button
                            onClick={() => {
                              setVitalsApt(a);
                              setVitalsForm({ temp: '', pulse: '', bpSys: '', bpDia: '', notes: '' });
                            }}
                            className="text-xs text-emerald-650 hover:underline hover:text-emerald-700 font-bold cursor-pointer"
                          >
                            Log Vitals
                          </button>
                        )}
                        {a.status === 'scheduled' && (
                          <button
                            onClick={() => handleCancel(a.id || a._id)}
                            className="text-xs text-rose-500 hover:underline hover:text-rose-600 font-bold cursor-pointer"
                          >
                            Remove
                          </button>
                        )}
                        {a.status !== 'scheduled' && (
                          <span className="text-[10px] text-slate-400 font-semibold font-mono uppercase">ARCHIVED</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vitals Log Modal */}
      {vitalsApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 relative">
            <h3 className="text-sm font-black text-slate-800 mb-2 font-heading">Record Quick Vitals</h3>
            <p className="text-[10px] text-slate-400 mb-4">Patient: <strong className="text-slate-800">{vitalsApt.patientName}</strong> (Token: {vitalsApt.token})</p>
            
            <form onSubmit={handleSaveVitals} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Temp (°F)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    placeholder="e.g. 98.6"
                    value={vitalsForm.temp}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, temp: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Pulse (BPM)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 72"
                    value={vitalsForm.pulse}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, pulse: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">BP Systolic</label>
                  <input
                    type="number"
                    required
                    placeholder="mmHg"
                    value={vitalsForm.bpSys}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, bpSys: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">BP Diastolic</label>
                  <input
                    type="number"
                    required
                    placeholder="mmHg"
                    value={vitalsForm.bpDia}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, bpDia: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Clinical Notes</label>
                <textarea
                  placeholder="Notes..."
                  value={vitalsForm.notes}
                  onChange={(e) => setVitalsForm({ ...vitalsForm, notes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-none"
                  rows="2"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setVitalsApt(null)}
                  className="bg-slate-250 hover:bg-slate-300 text-slate-700 font-bold px-4 py-2 rounded-lg text-xs cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="bg-emerald-650 hover:bg-emerald-750 text-white font-bold px-4 py-2 rounded-lg text-xs cursor-pointer"
                >
                  Save Vitals & Forward
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
