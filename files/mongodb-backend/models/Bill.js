const mongoose = require('mongoose');

const billSchema = new mongoose.Schema({
  bill_id: {
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
  total_amount: {
    type: mongoose.Schema.Types.Decimal128,
    required: true,
    default: 0
  },
  paid_amount: {
    type: mongoose.Schema.Types.Decimal128,
    default: 0
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'partial', 'paid', 'cancelled'],
    default: 'pending',
    index: true
  }
}, {
  timestamps: true,
  collection: 'bills'
});

// Indexes
billSchema.index({ visit_id: 1 });
billSchema.index({ status: 1, created_at: -1 });

// Virtual for balance due
billSchema.virtual('balance_due').get(function() {
  return parseFloat(this.total_amount) - parseFloat(this.paid_amount);
});

module.exports = mongoose.model('Bill', billSchema);
