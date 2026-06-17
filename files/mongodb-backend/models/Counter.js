const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
  counter_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  dept_id: {
    type: String,
    required: true,
    ref: 'Department',
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  staff_required: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  }
}, {
  timestamps: true,
  collection: 'counters'
});

// Indexes
counterSchema.index({ dept_id: 1 });

module.exports = mongoose.model('Counter', counterSchema);
