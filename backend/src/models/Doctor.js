import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  specialization: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  experience: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Available', 'Unavailable'],
    default: 'Available'
  }
}, {
  timestamps: true
});

const Doctor = mongoose.model('Doctor', doctorSchema);
export default Doctor;
