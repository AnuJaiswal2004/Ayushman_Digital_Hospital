import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  patientId: {
    type: String,
    required: true
  },
  patientName: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  doctor: {
    type: String,
    required: true
  },
  date: {
    type: String, // YYYY-MM-DD
    required: true
  },
  time: {
    type: String, // HH:MM AM/PM
    required: true
  },
  type: {
    type: String,
    enum: ['opd', 'telemedicine', 'emergency'],
    default: 'opd'
  },
  reason: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  visitId: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

const Appointment = mongoose.model('Appointment', appointmentSchema);
export default Appointment;
