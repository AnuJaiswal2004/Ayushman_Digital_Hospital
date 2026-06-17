const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
  prescr_id: {
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
  raw_prescription: {
    type: String,
    trim: true
  },
  issued_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'prescriptions'
});

// Indexes
prescriptionSchema.index({ visit_id: 1 });
prescriptionSchema.index({ consult_id: 1 });
prescriptionSchema.index({ issued_at: -1 });

module.exports = mongoose.model('Prescription', prescriptionSchema);
