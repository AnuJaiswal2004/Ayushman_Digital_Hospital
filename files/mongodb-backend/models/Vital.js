const mongoose = require('mongoose');

const vitalSchema = new mongoose.Schema({
  vital_id: {
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
    ref: 'Staff'
  },
  temperature: {
    type: Number,
    min: 35,
    max: 43
  },
  pulse: {
    type: Number,
    min: 40,
    max: 200
  },
  bp_systolic: {
    type: Number,
    min: 70,
    max: 250
  },
  bp_diastolic: {
    type: Number,
    min: 40,
    max: 150
  },
  recorded_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'vitals'
});

// Indexes
vitalSchema.index({ visit_id: 1, recorded_at: -1 });

module.exports = mongoose.model('Vital', vitalSchema);
