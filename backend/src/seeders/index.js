import { seedUsers } from './userSeeder.js';
import { seedDoctors } from './doctorSeeder.js';
import { seedDepartments } from './departmentSeeder.js';

export const runSeeders = async () => {
  console.log('🚀 Running database seeders...');
  try {
    await seedUsers();
    await seedDoctors();
    await seedDepartments();
    console.log('✨ All seeders completed.');
  } catch (error) {
    console.error(`🚨 Seeder coordinator encountered error: ${error.message}`);
    throw error;
  }
};
