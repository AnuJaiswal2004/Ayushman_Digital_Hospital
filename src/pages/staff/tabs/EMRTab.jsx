import React, { useState, useEffect } from 'react';
import { 
  Activity, Microscope, Pill, Stethoscope, Calendar, Plus, 
  Trash2, ShieldAlert, Scissors, ChevronRight, Save, User, Search, HeartPulse
} from 'lucide-react';
import { apiService } from '../../../services/api.js';

export default function EMRTab({ patientId = '', readOnly = false }) {
  // Global and local state
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(patientId);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Editing state for clinical stats
  const [isEditingStats, setIsEditingStats] = useState(false);
  const [statsForm, setStatsForm] = useState({
    bloodPressure: '',
    sugar: '',
    weight: '',
    height: ''
  });

  // Adding history entries
  const [newAllergy, setNewAllergy] = useState('');
  const [newDisease, setNewDisease] = useState('');
  const [newSurgery, setNewSurgery] = useState('');

  // Add Lab Test Form
  const [showLabForm, setShowLabForm] = useState(false);
  const [labForm, setLabForm] = useState({
    testName: '',
    date: new Date().toISOString().split('T')[0],
    result: '',
    notes: ''
  });

  const loadData = async () => {
    const allPatients = await apiService.getPatients();
    const allAppointments = await apiService.getAppointments();
    setPatients(allPatients);

    let activeId = selectedPatientId;
    if (!activeId && allPatients.length > 0) {
      activeId = allPatients[0].id;
      setSelectedPatientId(activeId);
    }

    if (activeId) {
      const p = allPatients.find(item => item.id === activeId || item._id === activeId);
      setSelectedPatient(p || null);
      if (p) {
        // Populate stats form
        setStatsForm({
          bloodPressure: p.emr?.bloodPressure || '',
          sugar: p.emr?.sugar || '',
          weight: p.emr?.weight || '',
          height: p.emr?.height || ''
        });
      }
      // Load appointments for this patient
      const patientAppts = allAppointments.filter(
        a => a.patientId === activeId && a.status !== 'cancelled'
      );
      setAppointments(patientAppts);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedPatientId]);

  // Handle switching patient (only when patientId prop is not supplied, i.e., in staff/admin views)
  const handlePatientChange = (id) => {
    setSelectedPatientId(id);
    setIsEditingStats(false);
    setShowLabForm(false);
  };

  const handleUpdateStats = async (e) => {
    e.preventDefault();
    if (!selectedPatient) return;
    try {
      const updatedEMR = {
        ...(selectedPatient.emr || {}),
        bloodPressure: statsForm.bloodPressure,
        sugar: statsForm.sugar,
        weight: statsForm.weight,
        height: statsForm.height
      };
      await apiService.updatePatient(selectedPatient.id || selectedPatient._id, { emr: updatedEMR });
      alert('Vitals updated successfully!');
      setIsEditingStats(false);
      loadData();
    } catch (err) {
      alert('Failed to update vitals');
    }
  };

  const handleAddHistory = async (type, val, setter) => {
    if (!selectedPatient || !val.trim()) return;
    try {
      const emr = selectedPatient.emr || {};
      const list = emr[type] || [];
      const updatedEMR = {
        ...emr,
        [type]: [...list, val.trim()]
      };
      await apiService.updatePatient(selectedPatient.id || selectedPatient._id, { emr: updatedEMR });
      setter('');
      loadData();
    } catch (err) {
      alert('Failed to update medical history');
    }
  };

  const handleRemoveHistory = async (type, idx) => {
    if (!selectedPatient) return;
    if (!window.confirm('Remove this medical history record?')) return;
    try {
      const emr = selectedPatient.emr || {};
      const list = emr[type] || [];
      const updatedList = list.filter((_, i) => i !== idx);
      const updatedEMR = {
        ...emr,
        [type]: updatedList
      };
      await apiService.updatePatient(selectedPatient.id || selectedPatient._id, { emr: updatedEMR });
      loadData();
    } catch (err) {
      alert('Failed to remove history record');
    }
  };

  const handleAddLabTest = async (e) => {
    e.preventDefault();
    if (!selectedPatient || !labForm.testName || !labForm.result) {
      alert('Please fill out test name and result');
      return;
    }
    try {
      const emr = selectedPatient.emr || {};
      const list = emr.labTests || [];
      const newTest = {
        id: 'LAB' + String(list.length + 1).padStart(3, '0'),
        testName: labForm.testName,
        date: labForm.date,
        result: labForm.result,
        notes: labForm.notes
      };
      const updatedEMR = {
        ...emr,
        labTests: [...list, newTest]
      };
      await apiService.updatePatient(selectedPatient.id || selectedPatient._id, { emr: updatedEMR });
      alert('Lab Test report added successfully!');
      setShowLabForm(false);
      setLabForm({ testName: '', date: new Date().toISOString().split('T')[0], result: '', notes: '' });
      loadData();
    } catch (err) {
      alert('Failed to record lab test');
    }
  };

  // Compile timeline items
  const getTimelineItems = () => {
    if (!selectedPatient) return [];
    const events = [];

    // 1. Consultations (Completed appointments)
    appointments.forEach(a => {
      if (a.status === 'completed') {
        events.push({
          type: 'Consultation',
          date: a.date,
          title: 'Consultation Check-out',
          description: `${a.department.toUpperCase()} - ${a.doctor}`,
          meta: a.consultation?.diagnosis ? `Diagnosis: ${a.consultation.diagnosis}` : 'Consultation complete',
          details: a.consultation?.complaint ? `Complaint: ${a.consultation.complaint}` : '',
          color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
        });

        // 2. Prescriptions (Medications issued during consultations)
        if (a.consultation?.medications && a.consultation.medications.length > 0) {
          const medsList = a.consultation.medications
            .map(m => `${m.name} (${m.dosage} - ${m.frequency})`)
            .join(', ');
          events.push({
            type: 'Prescription',
            date: a.date,
            title: 'Digital Prescription Issued',
            description: `Roster doctor: ${a.doctor}`,
            meta: medsList,
            details: `Duration: ${a.consultation.medications[0].duration || 'As prescribed'}`,
            color: 'bg-blue-500/10 text-blue-600 border-blue-500/20'
          });
        }
      }

      // 4. Follow-up (Upcoming scheduled visits)
      if (a.status === 'scheduled') {
        const isFuture = new Date(a.date) >= new Date().setHours(0, 0, 0, 0);
        if (isFuture) {
          events.push({
            type: 'Follow-up',
            date: a.date,
            title: 'Scheduled Follow-up',
            description: `Dept: ${a.department.toUpperCase()} - ${a.doctor}`,
            meta: `Reason: ${a.reason || 'General check-up'}`,
            details: `Time slot: ${a.time}`,
            color: 'bg-amber-500/10 text-amber-600 border-amber-500/20'
          });
        }
      }
    });

    // 3. Lab Tests (From patient emr storage)
    if (selectedPatient.emr?.labTests) {
      selectedPatient.emr.labTests.forEach(test => {
        events.push({
          type: 'Lab Test',
          date: test.date,
          title: test.testName,
          description: `Diagnostic Result: ${test.result}`,
          meta: test.notes ? `Clinical notes: ${test.notes}` : '',
          details: `Reference ID: ${test.id}`,
          color: 'bg-purple-500/10 text-purple-600 border-purple-500/20'
        });
      });
    }

    // Sort chronologically descending
    events.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Group by Year
    const grouped = {};
    events.forEach(event => {
      const year = new Date(event.date).getFullYear() || new Date().getFullYear();
      if (!grouped[year]) {
        grouped[year] = [];
      }
      grouped[year].push(event);
    });

    return Object.entries(grouped).sort((a, b) => b[0] - a[0]); // Sort years descending
  };

  const timelineGrouped = getTimelineItems();

  // Filter patients list for lookup selector
  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.phone.includes(searchQuery) ||
    p.abha.includes(searchQuery)
  );

  return (
    <div className="space-y-6 max-w-5xl w-full">
      {/* 1. Patient Selector (Only render if patientId prop is not supplied) */}
      {!patientId && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600/10 p-2 rounded-xl text-blue-600">
              <Search className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800 font-heading">Digital Health Locker Lookup</h3>
              <p className="text-[10px] text-slate-400 font-medium">Verify credentials and retrieve diagnostic clinical records</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search patient by Name, Phone, or ABHA ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs outline-none focus:border-blue-500"
              />
            </div>
            <select
              value={selectedPatientId}
              onChange={(e) => handlePatientChange(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-semibold outline-none cursor-pointer text-slate-700 min-w-[200px]"
            >
              {filteredPatients.map(p => (
                <option key={p.id} value={p.id}>{p.name} (ABHA: {p.abha.slice(0, 4)}...)</option>
              ))}
              {filteredPatients.length === 0 && <option value="">No patients found...</option>}
            </select>
          </div>
        </div>
      )}

      {selectedPatient ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: EMR Health Vitals & Roster Cards */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Demographic Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="bg-slate-100 p-2 rounded-xl text-slate-600">
                  <User className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-800 leading-none">{selectedPatient.name}</h4>
                  <p className="text-[10px] text-slate-400 font-mono mt-1">ABHA ID: {selectedPatient.abha}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-500">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">DOB</span>
                  <span className="text-slate-700">{new Date(selectedPatient.dob).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">Gender</span>
                  <span className="text-slate-700 capitalize">{selectedPatient.gender}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">Phone</span>
                  <span className="text-slate-700 font-mono">{selectedPatient.phone}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">Status</span>
                  <span className="text-emerald-600 font-bold">ABDM Synced</span>
                </div>
              </div>
            </div>

            {/* Vitals Indicators */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-600" />
                  <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Clinical Vitals indicators</h4>
                </div>
                {!readOnly && !isEditingStats && (
                  <button 
                    onClick={() => setIsEditingStats(true)} 
                    className="text-xs text-blue-600 hover:text-blue-700 font-bold hover:underline cursor-pointer"
                  >
                    Edit
                  </button>
                )}
              </div>

              {isEditingStats ? (
                <form onSubmit={handleUpdateStats} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase">BP (mmHg)</label>
                      <input 
                        type="text" 
                        placeholder="e.g. 120/80" 
                        value={statsForm.bloodPressure}
                        onChange={(e) => setStatsForm({ ...statsForm, bloodPressure: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase">Sugar (mg/dL)</label>
                      <input 
                        type="text" 
                        placeholder="e.g. 95" 
                        value={statsForm.sugar}
                        onChange={(e) => setStatsForm({ ...statsForm, sugar: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase">Weight (kg)</label>
                      <input 
                        type="text" 
                        placeholder="e.g. 70" 
                        value={statsForm.weight}
                        onChange={(e) => setStatsForm({ ...statsForm, weight: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase">Height (cm)</label>
                      <input 
                        type="text" 
                        placeholder="e.g. 175" 
                        value={statsForm.height}
                        onChange={(e) => setStatsForm({ ...statsForm, height: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end pt-1">
                    <button 
                      type="button" 
                      onClick={() => setIsEditingStats(false)} 
                      className="bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-lg text-[10px]"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="bg-blue-600 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] flex items-center gap-1"
                    >
                      <Save className="h-3.5 w-3.5" /> Save Vitals
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-3">
                    <div className="bg-red-500/10 p-2 rounded-lg text-red-500">
                      <Activity className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 block uppercase">Blood Pressure</span>
                      <strong className="text-xs text-slate-700">{selectedPatient.emr?.bloodPressure || 'N/A'} mmHg</strong>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-3">
                    <div className="bg-amber-500/10 p-2 rounded-lg text-amber-500">
                      <HeartPulse className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 block uppercase">Blood Sugar</span>
                      <strong className="text-xs text-slate-700">{selectedPatient.emr?.sugar || 'N/A'} mg/dL</strong>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-3">
                    <div className="bg-blue-500/10 p-2 rounded-lg text-blue-500">
                      <Activity className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 block uppercase">Body Weight</span>
                      <strong className="text-xs text-slate-700">{selectedPatient.emr?.weight || 'N/A'} kg</strong>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-3">
                    <div className="bg-emerald-500/10 p-2 rounded-lg text-emerald-500">
                      <Activity className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 block uppercase">Height</span>
                      <strong className="text-xs text-slate-700">{selectedPatient.emr?.height || 'N/A'} cm</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Medical History Elements (Allergies, Chronic Diseases, Surgery History) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100">Medical history & risks</h4>
              
              {/* Allergies */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-rose-500 font-bold text-[10px] uppercase">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  <span>Allergies / Drug Reactions</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(selectedPatient.emr?.allergies || []).map((a, i) => (
                    <span key={i} className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-100 px-2 py-0.5 rounded text-[10px] font-bold">
                      {a}
                      {!readOnly && (
                        <button onClick={() => handleRemoveHistory('allergies', i)} className="text-[10px] text-rose-400 hover:text-rose-600 font-black ml-0.5 cursor-pointer">×</button>
                      )}
                    </span>
                  ))}
                  {(selectedPatient.emr?.allergies || []).length === 0 && (
                    <span className="text-slate-400 text-[10px] italic">No allergies recorded</span>
                  )}
                </div>
                {!readOnly && (
                  <div className="flex gap-2 pt-1">
                    <input 
                      type="text" 
                      placeholder="Add Substance..." 
                      value={newAllergy}
                      onChange={(e) => setNewAllergy(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-[10px] outline-none flex-1 font-medium"
                    />
                    <button 
                      onClick={() => handleAddHistory('allergies', newAllergy, setNewAllergy)}
                      className="bg-rose-500 hover:bg-rose-600 text-white p-1.5 rounded-lg text-[10px] font-bold cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Chronic Diseases */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-blue-500 font-bold text-[10px] uppercase">
                  <Stethoscope className="h-3.5 w-3.5" />
                  <span>Chronic Diseases / Conditions</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(selectedPatient.emr?.diseases || []).map((d, i) => (
                    <span key={i} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded text-[10px] font-bold">
                      {d}
                      {!readOnly && (
                        <button onClick={() => handleRemoveHistory('diseases', i)} className="text-[10px] text-blue-400 hover:text-blue-600 font-black ml-0.5 cursor-pointer">×</button>
                      )}
                    </span>
                  ))}
                  {(selectedPatient.emr?.diseases || []).length === 0 && (
                    <span className="text-slate-400 text-[10px] italic">No active diagnoses</span>
                  )}
                </div>
                {!readOnly && (
                  <div className="flex gap-2 pt-1">
                    <input 
                      type="text" 
                      placeholder="Add Condition..." 
                      value={newDisease}
                      onChange={(e) => setNewDisease(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-[10px] outline-none flex-1 font-medium"
                    />
                    <button 
                      onClick={() => handleAddHistory('diseases', newDisease, setNewDisease)}
                      className="bg-blue-500 hover:bg-blue-600 text-white p-1.5 rounded-lg text-[10px] font-bold cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Surgery History */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-purple-500 font-bold text-[10px] uppercase">
                  <Scissors className="h-3.5 w-3.5" />
                  <span>Surgery & Operative History</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(selectedPatient.emr?.surgeries || []).map((s, i) => (
                    <span key={i} className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 border border-purple-100 px-2 py-0.5 rounded text-[10px] font-bold">
                      {s}
                      {!readOnly && (
                        <button onClick={() => handleRemoveHistory('surgeries', i)} className="text-[10px] text-purple-400 hover:text-purple-600 font-black ml-0.5 cursor-pointer">×</button>
                      )}
                    </span>
                  ))}
                  {(selectedPatient.emr?.surgeries || []).length === 0 && (
                    <span className="text-slate-400 text-[10px] italic">No surgical history logged</span>
                  )}
                </div>
                {!readOnly && (
                  <div className="flex gap-2 pt-1">
                    <input 
                      type="text" 
                      placeholder="Add Surgery (e.g. Hernia 2021)..." 
                      value={newSurgery}
                      onChange={(e) => setNewSurgery(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-[10px] outline-none flex-1 font-medium"
                    />
                    <button 
                      onClick={() => handleAddHistory('surgeries', newSurgery, setNewSurgery)}
                      className="bg-purple-500 hover:bg-purple-600 text-white p-1.5 rounded-lg text-[10px] font-bold cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Year-Grouped Tree Clinical Timeline */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Add Lab Test Card */}
            {!readOnly && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Microscope className="h-4 w-4 text-purple-600" />
                    <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Log Patient Diagnostic Lab report</h4>
                  </div>
                  <button 
                    onClick={() => setShowLabForm(!showLabForm)} 
                    className="text-xs text-purple-600 hover:text-purple-700 font-bold hover:underline cursor-pointer"
                  >
                    {showLabForm ? 'Close' : 'Record'}
                  </button>
                </div>

                {showLabForm && (
                  <form onSubmit={handleAddLabTest} className="space-y-3 animate-fade-in">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Test Name</label>
                        <input 
                          type="text" 
                          required
                          placeholder="e.g. CBC, Lipid Profile, MRI" 
                          value={labForm.testName}
                          onChange={(e) => setLabForm({ ...labForm, testName: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Report Date</label>
                        <input 
                          type="date" 
                          required
                          value={labForm.date}
                          onChange={(e) => setLabForm({ ...labForm, date: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-none text-slate-650"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase">Result Value / Conclusion</label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. Hemoglobin: 14.2 g/dL (Normal)" 
                        value={labForm.result}
                        onChange={(e) => setLabForm({ ...labForm, result: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase">Lab Notes / Comments</label>
                      <textarea 
                        placeholder="Diagnostic remarks..." 
                        value={labForm.notes}
                        onChange={(e) => setLabForm({ ...labForm, notes: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-none"
                        rows="2"
                      />
                    </div>
                    <button 
                      type="submit" 
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded-xl text-xs transition-all cursor-pointer"
                    >
                      Save Lab Report & Update Timeline
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Tree-style Timeline */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Calendar className="h-4.5 w-4.5 text-blue-600" />
                <h4 className="font-extrabold text-sm text-slate-800 font-heading">Clinical Medical Timeline</h4>
              </div>

              {timelineGrouped.length === 0 ? (
                <div className="text-center py-12 text-slate-400 font-medium text-xs">
                  No clinical events recorded for this patient file yet.
                </div>
              ) : (
                <div className="space-y-8 pl-2">
                  {timelineGrouped.map(([year, events]) => (
                    <div key={year} className="relative space-y-4">
                      {/* Year Header Group */}
                      <div className="flex items-center gap-3 relative z-10">
                        <span className="bg-slate-800 text-slate-100 px-3 py-1 rounded-xl text-xs font-black font-mono shadow-sm">
                          {year}
                        </span>
                        <div className="h-[1px] bg-slate-200 flex-1" />
                      </div>

                      {/* Tree branch content */}
                      <div className="relative border-l-2 border-slate-150 pl-6 ml-4 space-y-4 pt-1">
                        {events.map((evt, idx) => {
                          const IconComp = 
                            evt.type === 'Consultation' ? Stethoscope :
                            evt.type === 'Prescription' ? Pill :
                            evt.type === 'Lab Test' ? Microscope : Calendar;

                          return (
                            <div key={idx} className="relative group">
                              {/* Horizontal branch line connecting from border-l */}
                              <div className="absolute -left-[30px] top-4.5 w-[20px] h-[2px] bg-slate-150 group-last:bg-gradient-to-r group-last:from-slate-150 group-last:to-transparent" />
                              
                              {/* Connector Dot */}
                              <div className={`absolute -left-[30px] -translate-x-[6.5px] top-2.5 h-4 w-4 rounded-full flex items-center justify-center border-2 border-white shadow-sm transition-transform group-hover:scale-110 z-10 ${
                                evt.type === 'Consultation' ? 'bg-emerald-500 text-white' :
                                evt.type === 'Prescription' ? 'bg-blue-500 text-white' :
                                evt.type === 'Lab Test' ? 'bg-purple-500 text-white' : 'bg-amber-500 text-white'
                              }`}>
                                <IconComp className="h-2 w-2" />
                              </div>

                              {/* Timeline Card */}
                              <div className="bg-slate-50/50 hover:bg-slate-50 border border-slate-200/80 rounded-2xl p-4 shadow-sm transition-all hover:border-slate-300">
                                <div className="flex justify-between items-start gap-3">
                                  <div>
                                    <span className={`inline-flex px-1.5 py-0.5 rounded text-[8px] font-black uppercase border tracking-wider ${evt.color}`}>
                                      {evt.type}
                                    </span>
                                    <h5 className="font-extrabold text-slate-800 text-xs mt-1.5 leading-tight">{evt.title}</h5>
                                    <p className="text-[10px] text-slate-500 font-semibold mt-1">{evt.description}</p>
                                  </div>
                                  <span className="text-[9px] font-bold text-slate-400 font-mono bg-white border border-slate-150 px-2 py-0.5 rounded">
                                    {new Date(evt.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                  </span>
                                </div>

                                {evt.meta && (
                                  <p className="text-[10px] text-slate-600 font-semibold bg-white border border-slate-200/40 rounded-lg p-2.5 mt-2.5 leading-relaxed">
                                    {evt.meta}
                                  </p>
                                )}
                                
                                {evt.details && (
                                  <p className="text-[9px] text-slate-400 font-medium italic mt-1.5 pl-1.5 border-l-2 border-slate-200">
                                    {evt.details}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl text-slate-400 font-medium text-xs">
          Please select a patient file from the lookup selector to load their clinical EMR files.
        </div>
      )}
    </div>
  );
}
