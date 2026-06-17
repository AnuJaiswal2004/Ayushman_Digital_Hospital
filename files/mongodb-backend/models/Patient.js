const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  patient_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  abha_id: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  dob: {
    type: Date,
    required: true
  },
  address: {
    type: String,
    trim: true
  },
  consent_for_notifications: {
    type: Boolean,
    default: false
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'patients'
});

// Indexes for better query performance
patientSchema.index({ abha_id: 1 });
patientSchema.index({ phone: 1 });
patientSchema.index({ created_at: -1 });

module.exports = mongoose.model('Patient', patientSchema);
