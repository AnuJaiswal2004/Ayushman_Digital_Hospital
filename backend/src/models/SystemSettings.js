import mongoose from 'mongoose';

const systemSettingsSchema = new mongoose.Schema({
  hospitalName: {
    type: String,
    required: true,
    default: 'Ayushman Digital Hospital'
  },
  address: {
    type: String,
    required: true,
    default: 'Near Central Park, Chanakyapuri, New Delhi, India'
  },
  phone: {
    type: String,
    required: true,
    default: '+91-11-2345-6789'
  },
  bookingWindowDays: {
    type: Number,
    required: true,
    default: 30
  },
  consultationFee: {
    type: Number,
    required: true,
    default: 350
  },
  notificationSettings: {
    emailAlerts: { type: Boolean, default: true },
    smsAlerts: { type: Boolean, default: true }
  },
  theme: {
    type: String,
    default: 'light'
  }
}, {
  timestamps: true
});

const SystemSettings = mongoose.model('SystemSettings', systemSettingsSchema);
export default SystemSettings;
