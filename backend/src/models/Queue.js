import mongoose from 'mongoose';

const queueSchema = new mongoose.Schema({
  tokenNumber: {
    type: String,
    required: true
  },
  patientId: {
    type: String,
    required: true
  },
  visitId: {
    type: String,
    required: true,
    unique: true
  },
  departmentId: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  currentStage: {
    type: String,
    enum: ['Waiting', 'Vitals', 'Consultation', 'Billing', 'Completed'],
    default: 'Waiting'
  },
  estimatedWaitTime: {
    type: Number, // minutes
    default: 15
  },
  queuePosition: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['WAITING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED'],
    default: 'WAITING'
  }
}, {
  timestamps: true
});

const Queue = mongoose.model('Queue', queueSchema);
export default Queue;
