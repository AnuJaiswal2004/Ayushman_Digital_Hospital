import Department from '../models/Department.js';

const mockDepartments = [
  { name: 'Cardiology', key: 'cardiology', hod: 'Dr. Rajesh Sharma', doctors: 6, totalBeds: 30, occupiedBeds: 22, status: 'Active' },
  { name: 'Pediatrics', key: 'pediatrics', hod: 'Dr. Priya Mehta', doctors: 4, totalBeds: 20, occupiedBeds: 8, status: 'Active' },
  { name: 'Orthopedics', key: 'orthopedics', hod: 'Dr. Amit Kumar', doctors: 5, totalBeds: 25, occupiedBeds: 13, status: 'Active' },
  { name: 'Dermatology', key: 'dermatology', hod: 'Dr. Sunita Rao', doctors: 3, totalBeds: 15, occupiedBeds: 5, status: 'Active' },
  { name: 'General Medicine', key: 'general', hod: 'Dr. Vikram Malhotra', doctors: 12, totalBeds: 50, occupiedBeds: 38, status: 'Active' }
];

export const seedDepartments = async () => {
  try {
    const count = await Department.countDocuments();
    if (count === 0) {
      console.log('🌱 Seeding departments database...');
      await Department.insertMany(mockDepartments);
      console.log('✅ Departments database seeded successfully.');
    } else {
      console.log('📋 Departments collection is already populated.');
    }
  } catch (error) {
    console.error(`❌ Department seeding failed: ${error.message}`);
    throw error;
  }
};
