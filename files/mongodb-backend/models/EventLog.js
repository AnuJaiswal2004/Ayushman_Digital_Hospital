const mongoose = require('mongoose');

const eventLogSchema = new mongoose.Schema({
  event_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  visit_id: {
    type: String,
    required: true,
    ref: 'Visit',
    index: true
  },
  event_type: {
    type: String,
    required: true,
    enum: [
      'visit_created',
      'vitals_recorded',
      'consultation_started',
      'consultation_completed',
      'lab_ordered',
      'lab_sample_collected',
      'lab_result_ready',
      'prescription_issued',
      'pharmacy_order_created',
      'pharmacy_dispensed',
      'bill_created',
      'payment_received',
      'visit_completed'
    ],
    index: true
  },
  payload: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  created_at: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true,
  collection: 'event_logs'
});

// Indexes
eventLogSchema.index({ visit_id: 1, created_at: -1 });
eventLogSchema.index({ event_type: 1, created_at: -1 });

module.exports = mongoose.model('EventLog', eventLogSchema);
