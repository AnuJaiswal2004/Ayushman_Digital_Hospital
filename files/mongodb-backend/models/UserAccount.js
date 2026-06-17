const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userAccountSchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    index: true
  },
  password_hash: {
    type: String,
    required: true
  },
  staff_id: {
    type: String,
    ref: 'Staff',
    index: true
  },
  role: {
    type: String,
    required: true,
    enum: ['Admin', 'Doctor', 'Nurse', 'Lab Technician', 'Pharmacist', 'Receptionist', 'Patient'],
    index: true
  }
}, {
  timestamps: true,
  collection: 'user_accounts'
});

// Indexes
userAccountSchema.index({ username: 1 });
userAccountSchema.index({ staff_id: 1 });

// Hash password before saving
userAccountSchema.pre('save', async function(next) {
  if (!this.isModified('password_hash')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password_hash = await bcrypt.hash(this.password_hash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userAccountSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password_hash);
};

module.exports = mongoose.model('UserAccount', userAccountSchema);
