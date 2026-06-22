import User from '../models/User.js';

const mockUsers = [
  { username: 'superadmin', password: 'superadmin123', name: 'Super Administrator', role: 'superadmin', staffId: 'SUPER001' },
  { username: 'admin', password: 'admin123', name: 'System Administrator', role: 'admin', staffId: 'ADMIN001' },
  { username: 'doctor001', password: 'doctor123', name: 'Dr. Rajesh Sharma', role: 'doctor', staffId: 'STAFF001', department: 'cardiology' },
  { username: 'doctor002', password: 'doctor123', name: 'Dr. Priya Mehta', role: 'doctor', staffId: 'STAFF002', department: 'pediatrics' },
  { username: 'receptionist', password: 'receptionist123', name: 'Asha Sharma', role: 'receptionist', staffId: 'STAFF003' },
  { username: 'staff001', password: 'staff123', name: 'Staff Receptionist', role: 'receptionist', staffId: 'STAFF004' }
];

export const seedUsers = async () => {
  try {
    for (const userData of mockUsers) {
      const existing = await User.findOne({ username: userData.username });
      if (!existing) {
        console.log(`🌱 Seeding user ${userData.username}...`);
        const user = new User(userData);
        await user.save();
      }
    }
    console.log('✅ Users database seeding verification complete.');
  } catch (error) {
    console.error(`❌ User seeding failed: ${error.message}`);
    throw error;
  }
};
