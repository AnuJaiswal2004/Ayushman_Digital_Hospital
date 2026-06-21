import mongoose from 'mongoose';

const billingSchema = new mongoose.Schema({
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
  totalAmount: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'upi', 'insurance'],
    required: true
  },
  paidAt: {
    type: Date,
    default: Date.now
  },
  processedBy: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'paid'],
    default: 'paid'
  }
}, {
  timestamps: true
});

const Billing = mongoose.model('Billing', billingSchema);
export default Billing;
