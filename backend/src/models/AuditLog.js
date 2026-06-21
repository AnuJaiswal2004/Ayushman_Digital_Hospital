import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true // e.g. "Doctor Created", "Patient Registered", "Bill Generated", "Appointment Cancelled"
  },
  entity: {
    type: String,
    required: true // e.g. "Doctor", "Patient", "Billing", "Appointment"
  },
  entityId: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
