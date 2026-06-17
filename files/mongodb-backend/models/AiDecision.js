const mongoose = require('mongoose');

const aiDecisionSchema = new mongoose.Schema({
  decision_id: {
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
  next_step: {
    type: String,
    required: true,
    enum: ['registration', 'vitals', 'consultation', 'lab', 'pharmacy', 'billing', 'discharge'],
    index: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  eta_seconds: {
    type: Number,
    min: 0
  },
  message: {
    type: String,
    trim: true
  },
  created_at: {
    type: Date,
    default: Date.now,
    index: true
  },
  source: {
    type: String,
    required: true,
    enum: ['AI Assistant', 'Manual', 'System', 'Rule Engine'],
    default: 'AI Assistant'
  }
}, {
  timestamps: true,
  collection: 'ai_decisions'
});

// Indexes
aiDecisionSchema.index({ visit_id: 1, created_at: -1 });
aiDecisionSchema.index({ next_step: 1 });

module.exports = mongoose.model('AiDecision', aiDecisionSchema);
