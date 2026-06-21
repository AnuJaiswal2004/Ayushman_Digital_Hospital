import Doctor from '../models/Doctor.js';

const mockDoctors = [
  { id: 'D001', name: 'Dr. Rajesh Sharma', specialization: 'Cardiologist', department: 'cardiology', experience: '15 years', status: 'Available' },
  { id: 'D002', name: 'Dr. Priya Mehta', specialization: 'Pediatrician', department: 'pediatrics', experience: '10 years', status: 'Available' },
  { id: 'D003', name: 'Dr. Amit Kumar', specialization: 'Orthopedic Surgeon', department: 'orthopedics', experience: '12 years', status: 'Available' },
  { id: 'D004', name: 'Dr. Sunita Rao', specialization: 'Dermatologist', department: 'dermatology', experience: '8 years', status: 'Available' },
  { id: 'D005', name: 'Dr. Vikram Malhotra', specialization: 'General Physician', department: 'general', experience: '20 years', status: 'Available' }
];

export const seedDoctors = async () => {
  try {
    const count = await Doctor.countDocuments();
    if (count === 0) {
      console.log('🌱 Seeding doctors database...');
      await Doctor.insertMany(mockDoctors);
      console.log('✅ Doctors database seeded successfully.');
    } else {
      console.log('📋 Doctors collection is already populated.');
    }
  } catch (error) {
    console.error(`❌ Doctor seeding failed: ${error.message}`);
    throw error;
  }
};
