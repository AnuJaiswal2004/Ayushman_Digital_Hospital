const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  dept_id: {
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
  location: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  collection: 'departments'
});

// Indexes
departmentSchema.index({ name: 1 });

module.exports = mongoose.model('Department', departmentSchema);
