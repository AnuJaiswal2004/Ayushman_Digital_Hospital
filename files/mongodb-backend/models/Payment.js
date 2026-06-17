const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  payment_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  bill_id: {
    type: String,
    required: true,
    ref: 'Bill',
    index: true
  },
  amount: {
    type: mongoose.Schema.Types.Decimal128,
    required: true,
    min: 0
  },
  method: {
    type: String,
    required: true,
    enum: ['Cash', 'Card', 'UPI', 'Net Banking', 'Insurance', 'Other'],
    default: 'Cash'
  },
  paid_at: {
    type: Date,
    default: Date.now
  },
  txn_ref: {
    type: String,
    trim: true,
    index: true
  }
}, {
  timestamps: true,
  collection: 'payments'
});

// Indexes
paymentSchema.index({ bill_id: 1, paid_at: -1 });
paymentSchema.index({ txn_ref: 1 });
paymentSchema.index({ paid_at: -1 });

module.exports = mongoose.model('Payment', paymentSchema);
