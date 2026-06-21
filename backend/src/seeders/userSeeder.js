import User from '../models/User.js';

const mockUsers = [
  { username: 'superadmin', password: 'superadmin123', name: 'Super Administrator', role: 'superadmin', staffId: 'SUPER001' },
  { username: 'admin', password: 'admin123', name: 'System Administrator', role: 'admin', staffId: 'ADMIN001' },
  { username: 'doctor001', password: 'doctor123', name: 'Dr. Rajesh Sharma', role: 'doctor', staffId: 'STAFF001', department: 'cardiology' },
  { username: 'doctor002', password: 'doctor123', name: 'Dr. Priya Mehta', role: 'doctor', staffId: 'STAFF002', department: 'pediatrics' },
  { username: 'receptionist', password: 'receptionist123', name: 'Asha Sharma', role: 'receptionist', staffId: 'STAFF003' }
];

export const seedUsers = async () => {
  try {
    const count = await User.countDocuments();
    if (count === 0) {
      console.log('🌱 Seeding users database...');
      // Since pre-save middleware hashes password, creating items one by one or using save triggers it
      for (const userData of mockUsers) {
        const user = new User(userData);
        await user.save();
      }
      console.log('✅ Users database seeded successfully.');
    } else {
      console.log('📋 Users collection is already populated.');
    }
  } catch (error) {
    console.error(`❌ User seeding failed: ${error.message}`);
    throw error;
  }
};
