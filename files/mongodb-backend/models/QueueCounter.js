const mongoose = require('mongoose');

const queueCounterSchema = new mongoose.Schema({
  qc_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  counter_id: {
    type: String,
    required: true,
    ref: 'Counter',
    index: true
  },
  queue_length: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  last_updated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'queue_counters'
});

// Indexes
queueCounterSchema.index({ counter_id: 1 });
queueCounterSchema.index({ last_updated: -1 });

module.exports = mongoose.model('QueueCounter', queueCounterSchema);
