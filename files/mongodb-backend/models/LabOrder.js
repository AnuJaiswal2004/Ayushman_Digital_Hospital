const mongoose = require('mongoose');

const labOrderSchema = new mongoose.Schema({
  lab_order_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  consult_id: {
    type: String,
    required: true,
    ref: 'Consultation',
    index: true
  },
  visit_id: {
    type: String,
    required: true,
    ref: 'Visit',
    index: true
  },
  requested_by: {
    type: String,
    required: true,
    ref: 'Staff'
  },
  ordered_at: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'sample_collected', 'processing', 'completed', 'cancelled'],
    default: 'pending',
    index: true
  }
}, {
  timestamps: true,
  collection: 'lab_orders'
});

// Indexes
labOrderSchema.index({ visit_id: 1, status: 1 });
labOrderSchema.index({ status: 1, ordered_at: -1 });

module.exports = mongoose.model('LabOrder', labOrderSchema);
