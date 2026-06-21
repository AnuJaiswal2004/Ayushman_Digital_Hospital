import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['info', 'booking', 'emergency', 'availability', 'billing'],
    default: 'info'
  },
  targetUserId: {
    type: String,
    default: ''
  },
  targetRoles: [{
    type: String,
    enum: ['admin', 'superadmin', 'doctor', 'receptionist', 'patient']
  }],
  readBy: [{
    type: String // Usernames / Patient IDs that read it
  }],
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
