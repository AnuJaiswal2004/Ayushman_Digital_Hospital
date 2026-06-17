const mongoose = require('mongoose');

const pharmacyOrderSchema = new mongoose.Schema({
  pharm_order_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  prescr_id: {
    type: String,
    required: true,
    ref: 'Prescription',
    index: true
  },
  visit_id: {
    type: String,
    required: true,
    ref: 'Visit',
    index: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'processing', 'ready', 'dispensed', 'cancelled'],
    default: 'pending',
    index: true
  }
}, {
  timestamps: true,
  collection: 'pharmacy_orders'
});

// Indexes
pharmacyOrderSchema.index({ visit_id: 1 });
pharmacyOrderSchema.index({ status: 1, created_at: -1 });

module.exports = mongoose.model('PharmacyOrder', pharmacyOrderSchema);
