const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema({
  visit_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  patient_id: {
    type: String,
    required: true,
    ref: 'Patient',
    index: true
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  visit_type: {
    type: String,
    required: true,
    enum: ['OPD', 'Emergency', 'Telemedicine', 'Follow-up'],
    default: 'OPD'
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  current_step: {
    type: String,
    enum: ['registration', 'vitals', 'consultation', 'lab', 'pharmacy', 'billing', 'completed'],
    default: 'registration'
  },
  billed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  collection: 'visits'
});

// Indexes
visitSchema.index({ patient_id: 1, created_at: -1 });
visitSchema.index({ current_step: 1 });
visitSchema.index({ billed: 1 });
visitSchema.index({ token: 1 });

module.exports = mongoose.model('Visit', visitSchema);
