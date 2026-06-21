import mongoose from 'mongoose';

const labOrderSchema = new mongoose.Schema({
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
  tests: [{
    type: String,
    required: true
  }],
  status: {
    type: String,
    enum: ['Ordered', 'Sample Collected', 'Processing', 'Completed'],
    default: 'Ordered'
  },
  instructions: {
    type: String,
    default: ''
  },
  reportUrl: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

const LabOrder = mongoose.model('LabOrder', labOrderSchema);
export default LabOrder;
