import mongoose from 'mongoose';

const visitSchema = new mongoose.Schema({
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
  token: {
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
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  currentStep: {
    type: String,
    enum: ['vitals', 'consultation', 'billing', 'completed'],
    default: 'vitals'
  },
  vitals: {
    temperature: String,
    pulse: String,
    bloodPressure: String,
    notes: String,
    recordedBy: String,
    recordedAt: Date
  },
  consultation: {
    complaint: String,
    examination: String,
    diagnosis: String,
    treatment: String,
    consultedBy: String,
    consultedAt: Date
  },
  prescription: {
    medications: [{
      name: String,
      dosage: String,
      frequency: String,
      duration: Number
    }],
    prescribedBy: String,
    prescribedAt: Date
  },
  billing: {
    totalAmount: Number,
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'upi', 'insurance', 'pending'],
      default: 'pending'
    },
    paidAt: Date,
    processedBy: String,
    status: {
      type: String,
      enum: ['pending', 'paid'],
      default: 'pending'
    }
  },
  appointmentId: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

const Visit = mongoose.model('Visit', visitSchema);
export default Visit;
