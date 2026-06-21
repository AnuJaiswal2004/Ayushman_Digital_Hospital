import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true // in bytes
  },
  fileUrl: {
    type: String,
    required: true
  },
  patientId: {
    type: String,
    required: true
  },
  visitId: {
    type: String,
    default: ''
  },
  uploadedBy: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['PRESCRIPTION', 'LAB_REPORT', 'XRAY', 'MRI', 'CT_SCAN', 'OTHER'],
    required: true,
    default: 'OTHER'
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const FileModel = mongoose.model('File', fileSchema);
export default FileModel;
