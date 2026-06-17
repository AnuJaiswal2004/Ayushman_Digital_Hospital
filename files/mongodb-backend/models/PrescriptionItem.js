const mongoose = require('mongoose');

const prescriptionItemSchema = new mongoose.Schema({
  item_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  prescr_id: {
    type: String,
    required: true,
    ref: 'Prescription',
    index: true
  },
  drug_id: {
    type: String,
    required: true,
    ref: 'Drug',
    index: true
  },
  dosage: {
    type: String,
    required: true,
    trim: true
  },
  duration_days: {
    type: Number,
    required: true,
    min: 1
  }
}, {
  timestamps: true,
  collection: 'prescription_items'
});

// Indexes
prescriptionItemSchema.index({ prescr_id: 1 });
prescriptionItemSchema.index({ drug_id: 1 });

module.exports = mongoose.model('PrescriptionItem', prescriptionItemSchema);
