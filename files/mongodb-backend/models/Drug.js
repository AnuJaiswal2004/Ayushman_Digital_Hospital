const mongoose = require('mongoose');

const drugSchema = new mongoose.Schema({
  drug_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  form: {
    type: String,
    required: true,
    enum: ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Ointment', 'Drop', 'Inhaler', 'Other'],
    default: 'Tablet'
  },
  manufacturer: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  collection: 'drugs'
});

// Indexes
drugSchema.index({ name: 1 });
drugSchema.index({ form: 1 });

module.exports = mongoose.model('Drug', drugSchema);
