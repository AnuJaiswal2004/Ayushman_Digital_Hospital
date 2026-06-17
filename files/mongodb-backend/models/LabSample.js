const mongoose = require('mongoose');

const labSampleSchema = new mongoose.Schema({
  sample_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  lab_order_id: {
    type: String,
    required: true,
    ref: 'LabOrder',
    index: true
  },
  barcode: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  collected_at: {
    type: Date,
    default: Date.now
  },
  collected_by: {
    type: String,
    required: true,
    ref: 'Staff'
  },
  status: {
    type: String,
    required: true,
    enum: ['collected', 'transported', 'received', 'processed'],
    default: 'collected',
    index: true
  }
}, {
  timestamps: true,
  collection: 'lab_samples'
});

// Indexes
labSampleSchema.index({ lab_order_id: 1 });
labSampleSchema.index({ barcode: 1 });

module.exports = mongoose.model('LabSample', labSampleSchema);
