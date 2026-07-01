import React, { useState, useEffect } from 'react';
import { Award, Plus, Building2, Briefcase, CheckCircle, Ban, X } from 'lucide-react';
import { apiService } from '../../../services/api.js';
import Modal from '../../../components/ui/Modal.jsx';
import Input from '../../../components/ui/Input.jsx';
import Select from '../../../components/ui/Select.jsx';
import Button from '../../../components/ui/Button.jsx';
import Badge from '../../../components/ui/Badge.jsx';
import Card from '../../../components/ui/Card.jsx';

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
      <div className="flex justify-between items-center text-left">
        <div>
          <h3 className="font-bold text-base text-slate-800 dark:text-white font-heading">Doctor Directory</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Manage clinical providers and specializations</p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          variant="primary"
        >
          <Plus className="h-4 w-4" /> Add Doctor
        </Button>
      </div>

      {/* Grid of Doctors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {doctors.map((doc) => (
          <Card key={doc.id} className="relative overflow-hidden group hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all text-left">
            {/* Status indicator glow border */}
            <div className={`absolute top-0 left-0 right-0 h-1.5 ${
              doc.status === 'Available' ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-slate-300 dark:bg-slate-700'
            }`} />

            <div className="flex gap-4 items-center pt-2">
              {/* Doctor Avatar */}
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold font-heading text-sm shadow-md shrink-0">
                {getInitials(doc.name)}
              </div>
              <div className="truncate">
                <h4 className="font-bold text-slate-800 dark:text-white text-base truncate font-heading group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {doc.name}
                </h4>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium font-sans flex items-center gap-1">
                  <Award className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                  {doc.specialization}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 py-3 border-y border-slate-100 dark:border-slate-800/80 text-xs font-semibold text-slate-500 dark:text-slate-400 mt-4">
              <div className="space-y-1">
                <span className="text-[9px] text-slate-400 dark:text-slate-550 font-bold uppercase tracking-wider block">Department</span>
                <span className="text-slate-700 dark:text-slate-350 capitalize flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5 text-slate-400 dark:text-slate-600" />
                  {doc.department}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] text-slate-400 dark:text-slate-550 font-bold uppercase tracking-wider block">Experience</span>
                <span className="text-slate-700 dark:text-slate-350 flex items-center gap-1">
                  <Briefcase className="h-3.5 w-3.5 text-slate-400 dark:text-slate-600" />
                  {doc.experience}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-3">
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
                  doc.status === 'Available' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'
                }`}
                title="Click to toggle availability status"
              >
                {doc.status === 'Available' ? (
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <Ban className="h-3.5 w-3.5 text-slate-400" />
                )}
                {doc.status || 'Available'}
              </span>
              <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500 font-bold uppercase">ID: {doc.id}</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Add Doctor Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Register Doctor Profile"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name (with Dr. prefix)"
            type="text"
            name="name"
            required
            value={formData.name}
            onChange={handleInputChange}
            placeholder="e.g., Dr. Rajesh Sharma"
          />

          <Input
            label="Medical Specialization"
            type="text"
            name="specialization"
            required
            value={formData.specialization}
            onChange={handleInputChange}
            placeholder="e.g., Cardiologist, Pediatrician"
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Department"
              name="department"
              value={formData.department}
              onChange={handleInputChange}
              options={[
                { value: 'cardiology', label: 'Cardiology' },
                { value: 'pediatrics', label: 'Pediatrics' },
                { value: 'orthopedics', label: 'Orthopedics' },
                { value: 'dermatology', label: 'Dermatology' },
                { value: 'general', label: 'General Medicine' }
              ]}
            />
            <Input
              label="Experience (years)"
              type="number"
              name="experience"
              required
              value={formData.experience}
              onChange={handleInputChange}
              placeholder="e.g., 10"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowAddModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
            >
              Register Doctor
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
