const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  doc_id: {
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
  uploaded_by: {
    type: String,
    required: true,
    ref: 'Staff'
  },
  path: {
    type: String,
    required: true,
    trim: true
  },
  doc_type: {
    type: String,
    required: true,
    enum: ['Prescription', 'Lab Report', 'Scan', 'X-Ray', 'Medical Certificate', 'Other'],
    default: 'Other'
  },
  uploaded_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'documents'
});

// Indexes
documentSchema.index({ visit_id: 1, uploaded_at: -1 });
documentSchema.index({ doc_type: 1 });

module.exports = mongoose.model('Document', documentSchema);
