import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const patientSchema = new mongoose.Schema({
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
  abha: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  dob: {
    type: String,
    required: true
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true
  },
  password: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Active', 'Discharged', 'In-Treatment'],
    default: 'Active'
  },
  registrationDate: {
    type: Date,
    default: Date.now
  },
  // Embedded EMR arrays as requested
  vitals: [{
    temperature: String,
    pulse: String,
    bloodPressure: String,
    notes: String,
    recordedBy: String,
    recordedAt: {
      type: Date,
      default: Date.now
    }
  }],
  allergies: [String],
  diagnoses: [{
    disease: String,
    diagnosedBy: String,
    diagnosedAt: {
      type: Date,
      default: Date.now
    }
  }],
  surgeries: [String],
  labReports: [{
    id: String,
    testName: String,
    date: String,
    result: String,
    notes: String,
    status: {
      type: String,
      default: 'completed'
    }
  }]
}, {
  timestamps: true
});

// Hash password before saving
patientSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
patientSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const Patient = mongoose.model('Patient', patientSchema);
export default Patient;
