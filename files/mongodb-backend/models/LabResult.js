const mongoose = require('mongoose');

const labResultSchema = new mongoose.Schema({
  result_id: {
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
  result_payload: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  reported_at: {
    type: Date,
    default: Date.now
  },
  reported_by: {
    type: String,
    required: true,
    ref: 'Staff'
  }
}, {
  timestamps: true,
  collection: 'lab_results'
});

// Indexes
labResultSchema.index({ lab_order_id: 1 });
labResultSchema.index({ reported_at: -1 });

module.exports = mongoose.model('LabResult', labResultSchema);
