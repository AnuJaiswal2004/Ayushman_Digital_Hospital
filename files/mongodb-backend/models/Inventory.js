const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  inventory_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  drug_id: {
    type: String,
    required: true,
    ref: 'Drug',
    index: true
  },
  qty_available: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  location: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true,
  collection: 'inventory'
});

// Indexes
inventorySchema.index({ drug_id: 1, location: 1 });
inventorySchema.index({ qty_available: 1 });

module.exports = mongoose.model('Inventory', inventorySchema);
