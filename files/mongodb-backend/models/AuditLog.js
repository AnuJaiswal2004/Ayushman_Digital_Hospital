const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  audit_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  user_id: {
    type: String,
    required: true,
    ref: 'UserAccount',
    index: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'login',
      'logout',
      'create',
      'read',
      'update',
      'delete',
      'export',
      'approve',
      'reject',
      'cancel'
    ],
    index: true
  },
  details: {
    type: String,
    trim: true
  },
  created_at: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true,
  collection: 'audit_logs'
});

// Indexes
auditLogSchema.index({ user_id: 1, created_at: -1 });
auditLogSchema.index({ action: 1, created_at: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
