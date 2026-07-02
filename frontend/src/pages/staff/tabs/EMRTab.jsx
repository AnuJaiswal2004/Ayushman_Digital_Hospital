import React, { useState, useEffect } from 'react';
import { 
  HeartPulse, Activity, FileSpreadsheet, User, 
  Plus, Trash2, CalendarClock, Stethoscope, Search, X 
} from 'lucide-react';
import { apiService } from '../../../services/api.js';
import Modal from '../../../components/ui/Modal.jsx';
import Input from '../../../components/ui/Input.jsx';
import Select from '../../../components/ui/Select.jsx';
import Button from '../../../components/ui/Button.jsx';
import Badge from '../../../components/ui/Badge.jsx';
import Table from '../../../components/ui/Table.jsx';
import Card from '../../../components/ui/Card.jsx';

export default function EMRTab({ readOnly = false, initialPatientId = null }) {
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  
  // Roster Vitals
  const [isEditingStats, setIsEditingStats] = useState(false);
  const [statsForm, setStatsForm] = useState({
    bloodPressure: '',
    sugar: '',
    weight: '',
    height: ''
  });

  // Prescriptions List inside consultation form
  const [medsList, setMedsList] = useState([]);
  const [medInput, setMedInput] = useState({
    name: '',
    dosage: '10mg',
    frequency: 'Once Daily',
    duration: '5 Days'
  });

  // Consult Notes Form
  const [consultForm, setConsultForm] = useState({
    complaint: '',
    diagnosis: '',
    symptoms: '',
    prognosis: ''
  });

  // Lab Test Form
  const [labForm, setLabForm] = useState({
    testName: 'Complete Blood Count (CBC)',
    result: '',
    date: new Date().toISOString().split('T')[0]
  });

  const loadData = async () => {
    const listPatients = await apiService.getPatients();
    const listAppts = await apiService.getAppointments();
    setPatients(listPatients);
    setAppointments(listAppts);

    // Auto select first patient or initial patient
    if (initialPatientId) {
      setSelectedPatientId(initialPatientId);
    } else if (listPatients.length > 0 && !selectedPatientId) {
      setSelectedPatientId(listPatients[0].id);
    }
  };

  useEffect(() => {
    loadData();
  }, [initialPatientId]);

  // Load patient details on select
  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  useEffect(() => {
    if (selectedPatient) {
      setStatsForm({
        bloodPressure: selectedPatient.emr?.bloodPressure || '',
        sugar: selectedPatient.emr?.sugar || '',
        weight: selectedPatient.emr?.weight || '',
        height: selectedPatient.emr?.height || ''
      });
    }
  }, [selectedPatientId, patients]);

  const handleUpdateStats = async (e) => {
    e.preventDefault();
    try {
      await apiService.updatePatientVitals(selectedPatientId, statsForm);
      setIsEditingStats(false);
      loadData();
      alert('Vitals updated successfully.');
    } catch (err) {
      alert('Failed to update stats');
    }
  };

  const handleAddMed = () => {
    if (!medInput.name) {
      alert('Please fill medication name');
      return;
    }
    setMedsList([...medsList, medInput]);
    setMedInput({ name: '', dosage: '10mg', frequency: 'Once Daily', duration: '5 Days' });
  };

  const handleRemoveMed = (idx) => {
    setMedsList(medsList.filter((_, i) => i !== idx));
  };

  const handleConsultSubmit = async (e) => {
    e.preventDefault();
    if (!consultForm.complaint || !consultForm.diagnosis) {
      alert('Please fill at least complaint and diagnosis');
      return;
    }

    try {
      // Find the today's scheduled appointment for this patient
      const todayStr = new Date().toISOString().split('T')[0];
      const activeAppt = appointments.find(
        a => a.patientId === selectedPatientId && a.status === 'scheduled' && a.date === todayStr
      );

      if (!activeAppt) {
        alert('No active scheduled appointment found for today. Make sure patient is checked in.');
        return;
      }

      await apiService.completeAppointmentConsultation(activeAppt.id, {
        complaint: consultForm.complaint,
        diagnosis: consultForm.diagnosis,
        symptoms: consultForm.symptoms,
        prognosis: consultForm.prognosis,
        medications: medsList
      });

      // Notify
      await apiService.addNotification({
        title: '✅ Consultation Completed',
        message: `Dr. completed check-out for ${selectedPatient.name}. Forwarded to Billing desk.`,
        type: 'consultation',
        targetRoles: ['admin', 'billing', 'receptionist']
      });

      alert('Consultation recorded successfully!');
      setConsultForm({ complaint: '', diagnosis: '', symptoms: '', prognosis: '' });
      setMedsList([]);
      loadData();
    } catch (err) {
      alert('Failed to record consultation: ' + err.message);
    }
  };

  const handleLabSubmit = async (e) => {
    e.preventDefault();
    if (!labForm.result) {
      alert('Please fill lab test result');
      return;
    }

    try {
      await apiService.addLabTest(selectedPatientId, labForm);
      alert('Lab diagnostic recorded successfully!');
      setLabForm({ testName: 'Complete Blood Count (CBC)', result: '', date: new Date().toISOString().split('T')[0] });
      loadData();
    } catch (err) {
      alert('Failed to record lab test');
    }
  };

  const getTimelineItems = () => {
    if (!selectedPatient) return [];
    const events = [];

    // Consultations (Completed appointments)
    appointments.forEach(a => {
      if (a.patientId === selectedPatientId && a.status === 'completed') {
        events.push({
          type: 'Consultation',
          date: a.date,
          title: 'Consultation Check-out',
          description: `${a.department.toUpperCase()} - ${a.doctor}`,
          meta: a.consultation?.diagnosis ? `Diagnosis: ${a.consultation.diagnosis}` : 'Consultation complete',
          details: a.consultation?.complaint ? `Complaint: ${a.consultation.complaint}` : '',
          color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
        });

        // Prescriptions (Medications issued during consultations)
        if (a.consultation?.medications && a.consultation.medications.length > 0) {
          const medsJoined = a.consultation.medications
            .map(m => `${m.name} (${m.dosage} - ${m.frequency})`)
            .join(', ');
          events.push({
            type: 'Prescription',
            date: a.date,
            title: 'Digital Prescription Issued',
            description: `Roster doctor: ${a.doctor}`,
            meta: medsJoined,
            details: `Duration: ${a.consultation.medications[0].duration || 'As prescribed'}`,
            color: 'bg-blue-500/10 text-blue-600 border-blue-500/20'
          });
        }
      }

      // Follow-up (Upcoming scheduled visits)
      if (a.patientId === selectedPatientId && a.status === 'scheduled') {
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

    // Lab Tests (From patient emr storage)
    if (selectedPatient.emr?.labTests) {
      selectedPatient.emr.labTests.forEach(test => {
        events.push({
          type: 'Lab Test',
          date: test.date,
          title: test.testName,
          description: `Diagnostic Result: ${test.result}`,
          meta: 'Report verified by National Pathology Desk',
          details: `Logged on: ${new Date(test.date).toLocaleDateString()}`,
          color: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20'
        });
      });
    }

    // Sort by date descending
    return events.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const timelineItems = getTimelineItems();

  return (
    <div className="space-y-6 max-w-5xl w-full text-left">
      {/* Patient selector bar */}
      <div className="flex flex-col sm:flex-row gap-4 card-surface p-4 border border-slate-200 dark:border-slate-800 justify-between items-start sm:items-center">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-500/10 p-2.5 rounded-xl text-indigo-500 shrink-0">
            <HeartPulse className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white font-heading">Electronic Medical Record (EMR)</h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Verify patient histories and issue prescriptions</p>
          </div>
        </div>

        <div className="w-full sm:w-80">
          <Select
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            options={
              patients.length === 0
                ? [{ value: '', label: 'No patients registered' }]
                : patients.map(p => ({ value: p.id, label: `${p.name} (ABHA: ${p.abha})` }))
            }
          />
        </div>
      </div>

      {selectedPatient ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT PANEL: Demographics, Vitals, Timeline */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Demographics Card */}
            <Card elevated className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <User className="h-4.5 w-4.5 text-blue-500" />
                <h4 className="font-bold text-xs text-slate-800 dark:text-white uppercase tracking-wider">Demographics</h4>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <div>
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 block uppercase font-bold">Patient Name</span>
                  <span className="text-slate-800 dark:text-white text-sm font-bold block mt-0.5">{selectedPatient.name}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 block uppercase font-bold">ABHA Card ID</span>
                  <span className="text-slate-800 dark:text-white font-mono block mt-0.5">{selectedPatient.abha}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 block uppercase font-bold">Age / Gender</span>
                  <span className="text-slate-700 dark:text-slate-400 capitalize block mt-0.5">
                    {new Date().getFullYear() - new Date(selectedPatient.dob).getFullYear()} Years / {selectedPatient.gender}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 block uppercase font-bold">Phone</span>
                  <span className="text-slate-700 dark:text-slate-400 font-mono block mt-0.5">{selectedPatient.phone}</span>
                </div>
              </div>
            </Card>

            {/* Vitals Indicators */}
            <Card elevated className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-600" />
                  <h4 className="font-bold text-xs text-slate-800 dark:text-white uppercase tracking-wider">Clinical Vitals</h4>
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
                    <Input
                      label="BP (mmHg)"
                      type="text"
                      placeholder="e.g. 120/80"
                      value={statsForm.bloodPressure}
                      onChange={(e) => setStatsForm({ ...statsForm, bloodPressure: e.target.value })}
                    />
                    <Input
                      label="Sugar (mg/dL)"
                      type="text"
                      placeholder="e.g. 95"
                      value={statsForm.sugar}
                      onChange={(e) => setStatsForm({ ...statsForm, sugar: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Weight (kg)"
                      type="text"
                      placeholder="e.g. 70"
                      value={statsForm.weight}
                      onChange={(e) => setStatsForm({ ...statsForm, weight: e.target.value })}
                    />
                    <Input
                      label="Height (cm)"
                      type="text"
                      placeholder="e.g. 175"
                      value={statsForm.height}
                      onChange={(e) => setStatsForm({ ...statsForm, height: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-2 pt-1 justify-end">
                    <Button type="button" variant="secondary" onClick={() => setIsEditingStats(false)} className="py-1.5 px-3">
                      Cancel
                    </Button>
                    <Button type="submit" variant="primary" className="py-1.5 px-3">
                      Save Vitals
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-4 gap-3 text-center">
                  <div className="bg-slate-50 dark:bg-slate-950 p-2.5 border border-slate-200/60 dark:border-slate-800 rounded-xl">
                    <span className="text-[8px] text-slate-400 dark:text-slate-500 font-bold block uppercase">BP</span>
                    <span className="text-slate-800 dark:text-white font-mono text-xs font-black block mt-0.5">{selectedPatient.emr?.bloodPressure || 'N/A'}</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950 p-2.5 border border-slate-200/60 dark:border-slate-800 rounded-xl">
                    <span className="text-[8px] text-slate-400 dark:text-slate-500 font-bold block uppercase">Sugar</span>
                    <span className="text-slate-800 dark:text-white font-mono text-xs font-black block mt-0.5">{selectedPatient.emr?.sugar || 'N/A'}</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950 p-2.5 border border-slate-200/60 dark:border-slate-800 rounded-xl">
                    <span className="text-[8px] text-slate-400 dark:text-slate-500 font-bold block uppercase">Weight</span>
                    <span className="text-slate-800 dark:text-white font-mono text-xs font-black block mt-0.5">{selectedPatient.emr?.weight ? `${selectedPatient.emr.weight}kg` : 'N/A'}</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950 p-2.5 border border-slate-200/60 dark:border-slate-800 rounded-xl">
                    <span className="text-[8px] text-slate-400 dark:text-slate-500 font-bold block uppercase">Height</span>
                    <span className="text-slate-800 dark:text-white font-mono text-xs font-black block mt-0.5">{selectedPatient.emr?.height ? `${selectedPatient.emr.height}cm` : 'N/A'}</span>
                  </div>
                </div>
              )}
            </Card>

            {/* Timeline */}
            <Card elevated className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <CalendarClock className="h-4 w-4 text-blue-500" />
                <h4 className="font-bold text-xs text-slate-800 dark:text-white uppercase tracking-wider">Clinical Timeline</h4>
              </div>

              {timelineItems.length === 0 ? (
                <div className="text-center py-6 text-slate-400 dark:text-slate-500 text-xs font-medium">
                  No registered medical history events found.
                </div>
              ) : (
                <div className="space-y-4 relative border-l border-slate-200 dark:border-slate-800 pl-4.5 ml-2 pt-1.5">
                  {timelineItems.map((item, idx) => (
                    <div key={idx} className="relative space-y-1">
                      {/* Timeline dot */}
                      <div className="absolute -left-[24.5px] top-1.5 h-3.5 w-3.5 rounded-full bg-white dark:bg-slate-900 border-2 border-indigo-500" />
                      
                      <div className="flex justify-between items-start">
                        <span className="font-mono text-[9px] text-slate-400 dark:text-slate-500 font-bold">{new Date(item.date).toLocaleDateString()}</span>
                        <span className="text-[8px] font-mono font-bold uppercase tracking-wide text-blue-500">{item.type}</span>
                      </div>
                      <h5 className="font-bold text-slate-800 dark:text-white text-xs leading-tight">{item.title}</h5>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">{item.description}</p>
                      
                      {item.meta && (
                        <div className="text-[10px] text-slate-600 dark:text-slate-300 font-medium bg-slate-50 dark:bg-slate-950 p-2 rounded border border-slate-100 dark:border-slate-800 mt-1">
                          {item.meta}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>

          </div>

          {/* RIGHT PANEL: Consultations Desk, Diagnostic Tests */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Consultation desk */}
            {!readOnly && (
              <Card className="space-y-5">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div className="bg-emerald-500/10 p-2.5 rounded-xl text-emerald-600 shrink-0">
                    <Stethoscope className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white font-heading">Consultation Notes & Check-out</h3>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Record diagnosis and issue prescriptions</p>
                  </div>
                </div>

                <form onSubmit={handleConsultSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Chief Complaint"
                      type="text"
                      required
                      value={consultForm.complaint}
                      onChange={(e) => setConsultForm({ ...consultForm, complaint: e.target.value })}
                      placeholder="e.g. Chronic chest pain"
                    />
                    <Input
                      label="Diagnosis Summary"
                      type="text"
                      required
                      value={consultForm.diagnosis}
                      onChange={(e) => setConsultForm({ ...consultForm, diagnosis: e.target.value })}
                      placeholder="e.g. Mild angina"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Associated Symptoms"
                      type="text"
                      value={consultForm.symptoms}
                      onChange={(e) => setConsultForm({ ...consultForm, symptoms: e.target.value })}
                      placeholder="e.g. Shortness of breath"
                    />
                    <Input
                      label="Prognosis / Advice"
                      type="text"
                      value={consultForm.prognosis}
                      onChange={(e) => setConsultForm({ ...consultForm, prognosis: e.target.value })}
                      placeholder="e.g. Low sodium diet, rest"
                    />
                  </div>

                  {/* Roster Prescriptions */}
                  <div className="border border-slate-200/60 dark:border-slate-800 rounded-xl p-4 space-y-3.5 bg-slate-50/50 dark:bg-slate-950/40">
                    <h4 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Add Medication to Digital Prescription</h4>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                      <div className="col-span-2 sm:col-span-1">
                        <Input
                          label="Medicine"
                          type="text"
                          value={medInput.name}
                          onChange={(e) => setMedInput({ ...medInput, name: e.target.value })}
                          placeholder="Paracetamol"
                        />
                      </div>

                      <Select
                        label="Dosage"
                        value={medInput.dosage}
                        onChange={(e) => setMedInput({ ...medInput, dosage: e.target.value })}
                        options={[
                          { value: '10mg', label: '10mg' },
                          { value: '50mg', label: '50mg' },
                          { value: '100mg', label: '100mg' },
                          { value: '500mg', label: '500mg' },
                          { value: '1 Tablet', label: '1 Tablet' },
                          { value: '2 Tablets', label: '2 Tablets' }
                        ]}
                      />

                      <Select
                        label="Frequency"
                        value={medInput.frequency}
                        onChange={(e) => setMedInput({ ...medInput, frequency: e.target.value })}
                        options={[
                          { value: 'Once Daily', label: 'Once Daily (1-0-0)' },
                          { value: 'Twice Daily', label: 'Twice Daily (1-0-1)' },
                          { value: 'Thrice Daily', label: 'Thrice Daily (1-1-1)' },
                          { value: 'As Needed', label: 'As Needed (SOS)' }
                        ]}
                      />

                      <Select
                        label="Duration"
                        value={medInput.duration}
                        onChange={(e) => setMedInput({ ...medInput, duration: e.target.value })}
                        options={[
                          { value: '3 Days', label: '3 Days' },
                          { value: '5 Days', label: '5 Days' },
                          { value: '1 Week', label: '1 Week' },
                          { value: '2 Weeks', label: '2 Weeks' },
                          { value: '1 Month', label: '1 Month' }
                        ]}
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={handleAddMed}
                        className="py-1.5 px-4"
                      >
                        + Add Medication
                      </Button>
                    </div>

                    {/* Roster prescription list */}
                    {medsList.length > 0 && (
                      <div className="border-t border-slate-200 dark:border-slate-800 pt-3 space-y-2">
                        {medsList.map((m, idx) => (
                          <div key={idx} className="flex justify-between items-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-2.5 rounded-lg text-xs font-semibold">
                            <div>
                              <span className="text-slate-800 dark:text-white font-bold">{m.name}</span>
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium ml-2">({m.dosage} - {m.frequency} for {m.duration})</span>
                            </div>
                            <Button
                              type="button"
                              onClick={() => handleRemoveMed(idx)}
                              variant="outline"
                              className="p-1 h-7 w-7 rounded-md hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500 border-none"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <Button
                    type="submit"
                    variant="emerald"
                    className="w-full py-3"
                  >
                    Check Out & Forward to Billing
                  </Button>
                </form>
              </Card>
            )}

            {/* Lab diagnostics */}
            {!readOnly && (
              <Card className="space-y-5">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div className="bg-indigo-500/10 p-2.5 rounded-xl text-indigo-600 shrink-0">
                    <FileSpreadsheet className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white font-heading">Diagnostic Lab Entry</h3>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Record diagnostic parameters directly into EMR</p>
                  </div>
                </div>

                <form onSubmit={handleLabSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Select
                      label="Select Diagnostic Test"
                      value={labForm.testName}
                      onChange={(e) => setLabForm({ ...labForm, testName: e.target.value })}
                      options={[
                        { value: 'Complete Blood Count (CBC)', label: 'Complete Blood Count (CBC)' },
                        { value: 'Lipid Profile Panel', label: 'Lipid Profile Panel' },
                        { value: 'Hemoglobin A1c (HbA1c)', label: 'Hemoglobin A1c (HbA1c)' },
                        { value: 'Electrocardiogram (ECG)', label: 'Electrocardiogram (ECG)' },
                        { value: 'Urinalysis Roster', label: 'Urinalysis Roster' }
                      ]}
                    />

                    <Input
                      label="Lab Outcome / Result"
                      type="text"
                      required
                      value={labForm.result}
                      onChange={(e) => setLabForm({ ...labForm, result: e.target.value })}
                      placeholder="e.g. normal, 140 mg/dL, elevated"
                    />
                  </div>

                  <div className="flex justify-end pt-1">
                    <Button
                      type="submit"
                      variant="indigo"
                      className="px-6"
                    >
                      Record Lab Outcome
                    </Button>
                  </div>
                </form>
              </Card>
            )}

          </div>

        </div>
      ) : (
        <div className="text-center py-20 card-surface border border-slate-200 dark:border-slate-800 shadow-sm text-slate-400 font-medium">
          Select or check-in patients to inspect clinical records.
        </div>
      )}
    </div>
  );
}
