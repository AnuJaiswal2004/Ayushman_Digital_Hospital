const mongoose = require('mongoose');

const consultationSchema = new mongoose.Schema({
  consult_id: {
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
  staff_id: {
    type: String,
    required: true,
    ref: 'Staff',
    index: true
  },
  notes: {
    type: String,
    trim: true
  },
  doctor_orders: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  consult_time: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'consultations'
});

// Indexes
consultationSchema.index({ visit_id: 1 });
consultationSchema.index({ staff_id: 1, consult_time: -1 });

module.exports = mongoose.model('Consultation', consultationSchema);
