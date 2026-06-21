import mongoose from 'mongoose';

const prescriptionSchema = new mongoose.Schema({
  visitId: {
    type: String,
    required: true
  },
  patientId: {
    type: String,
    required: true
  },
  patientName: {
    type: String,
    required: true
  },
  doctorName: {
    type: String,
    required: true
  },
  medications: [{
    name: { type: String, required: true },
    dosage: { type: String, required: true },
    frequency: { type: String, required: true },
    duration: { type: Number, required: true } // days
  }],
  prescribedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const Prescription = mongoose.model('Prescription', prescriptionSchema);
export default Prescription;
