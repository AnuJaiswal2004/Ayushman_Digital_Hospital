const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
  staff_id: {
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
  role: {
    type: String,
    required: true,
    enum: ['Doctor', 'Nurse', 'Lab Technician', 'Pharmacist', 'Receptionist', 'Admin'],
    index: true
  },
  dept_id: {
    type: String,
    ref: 'Department',
    index: true
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'staff'
});

// Indexes
staffSchema.index({ dept_id: 1, active: 1 });
staffSchema.index({ role: 1, active: 1 });

module.exports = mongoose.model('Staff', staffSchema);
