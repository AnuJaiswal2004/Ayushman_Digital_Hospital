import mongoose from 'mongoose';

const consultationSchema = new mongoose.Schema({
  visitId: {
    type: String,
    required: true
  },
  patientId: {
    type: String,
    required: true
  },
  doctorId: {
    type: String,
    required: true
  },
  chiefComplaint: {
    type: String,
    required: true
  },
  examination: {
    type: String,
    default: ''
  },
  diagnosis: {
    type: String,
    required: true
  },
  treatmentPlan: {
    type: String,
    default: ''
  },
  consultationDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const Consultation = mongoose.model('Consultation', consultationSchema);
export default Consultation;
