const mongoose = require('mongoose');
const connectDB = require('./config/database');
const models = require('./models');

// Sample seed data
const seedData = async () => {
  try {
    await connectDB();
    
    console.log('🌱 Starting database seeding...');

    // Clear existing data (optional - comment out if you want to keep existing data)
    // await Promise.all(Object.values(models).map(model => model.deleteMany({})));
    // console.log('Cleared existing data');

    // Seed Departments
    const departments = await models.Department.insertMany([
      { dept_id: 'DEPT001', name: 'Cardiology', location: 'Building A, Floor 2' },
      { dept_id: 'DEPT002', name: 'Orthopedics', location: 'Building B, Floor 1' },
      { dept_id: 'DEPT003', name: 'Pediatrics', location: 'Building A, Floor 3' },
      { dept_id: 'DEPT004', name: 'General Medicine', location: 'Building C, Floor 1' },
      { dept_id: 'DEPT005', name: 'Laboratory', location: 'Building A, Ground Floor' }
    ]);
    console.log('✅ Departments seeded');

    // Seed Staff
    const staff = await models.Staff.insertMany([
      { staff_id: 'STAFF001', name: 'Dr. Rajesh Sharma', role: 'Doctor', dept_id: 'DEPT001', active: true },
      { staff_id: 'STAFF002', name: 'Dr. Priya Mehta', role: 'Doctor', dept_id: 'DEPT003', active: true },
      { staff_id: 'STAFF003', name: 'Nurse Anjali Kumar', role: 'Nurse', dept_id: 'DEPT001', active: true },
      { staff_id: 'STAFF004', name: 'Lab Tech Suresh Patel', role: 'Lab Technician', dept_id: 'DEPT005', active: true },
      { staff_id: 'STAFF005', name: 'Pharmacist Ravi Singh', role: 'Pharmacist', dept_id: null, active: true },
      { staff_id: 'STAFF006', name: 'Receptionist Meera Joshi', role: 'Receptionist', dept_id: null, active: true }
    ]);
    console.log('✅ Staff seeded');

    // Seed Counters
    const counters = await models.Counter.insertMany([
      { counter_id: 'CTR001', dept_id: 'DEPT001', name: 'Cardiology Counter 1', staff_required: 1 },
      { counter_id: 'CTR002', dept_id: 'DEPT002', name: 'Orthopedics Counter 1', staff_required: 1 },
      { counter_id: 'CTR003', dept_id: 'DEPT003', name: 'Pediatrics Counter 1', staff_required: 2 },
      { counter_id: 'CTR004', dept_id: 'DEPT005', name: 'Lab Sample Collection', staff_required: 1 }
    ]);
    console.log('✅ Counters seeded');

    // Seed Drugs
    const drugs = await models.Drug.insertMany([
      { drug_id: 'DRUG001', name: 'Paracetamol', form: 'Tablet', manufacturer: 'Generic Pharma' },
      { drug_id: 'DRUG002', name: 'Amoxicillin', form: 'Capsule', manufacturer: 'MediCare Ltd' },
      { drug_id: 'DRUG003', name: 'Cough Syrup', form: 'Syrup', manufacturer: 'HealthCare Inc' },
      { drug_id: 'DRUG004', name: 'Aspirin', form: 'Tablet', manufacturer: 'Generic Pharma' },
      { drug_id: 'DRUG005', name: 'Insulin', form: 'Injection', manufacturer: 'DiabetesCare' }
    ]);
    console.log('✅ Drugs seeded');

    // Seed Inventory
    const inventory = await models.Inventory.insertMany([
      { inventory_id: 'INV001', drug_id: 'DRUG001', qty_available: 500, location: 'Pharmacy Main' },
      { inventory_id: 'INV002', drug_id: 'DRUG002', qty_available: 200, location: 'Pharmacy Main' },
      { inventory_id: 'INV003', drug_id: 'DRUG003', qty_available: 100, location: 'Pharmacy Main' },
      { inventory_id: 'INV004', drug_id: 'DRUG004', qty_available: 300, location: 'Pharmacy Main' },
      { inventory_id: 'INV005', drug_id: 'DRUG005', qty_available: 50, location: 'Cold Storage' }
    ]);
    console.log('✅ Inventory seeded');

    // Seed User Accounts (passwords will be hashed automatically)
    const users = await models.UserAccount.insertMany([
      { user_id: 'USER001', username: 'admin', password_hash: 'admin123', role: 'Admin' },
      { user_id: 'USER002', username: 'dr.sharma', password_hash: 'doctor123', staff_id: 'STAFF001', role: 'Doctor' },
      { user_id: 'USER003', username: 'nurse.anjali', password_hash: 'nurse123', staff_id: 'STAFF003', role: 'Nurse' },
      { user_id: 'USER004', username: 'lab.suresh', password_hash: 'lab123', staff_id: 'STAFF004', role: 'Lab Technician' },
      { user_id: 'USER005', username: 'pharm.ravi', password_hash: 'pharm123', staff_id: 'STAFF005', role: 'Pharmacist' }
    ]);
    console.log('✅ User accounts seeded');

    // Seed Sample Patient
    const patients = await models.Patient.insertMany([
      {
        patient_id: 'PAT001',
        name: 'Amit Kumar',
        phone: '9876543210',
        abha_id: '12345678901234',
        dob: new Date('1990-05-15'),
        address: '123 Main Street, Delhi',
        consent_for_notifications: true
      },
      {
        patient_id: 'PAT002',
        name: 'Sita Devi',
        phone: '9876543211',
        abha_id: '12345678901235',
        dob: new Date('1985-08-20'),
        address: '456 Park Avenue, Mumbai',
        consent_for_notifications: true
      }
    ]);
    console.log('✅ Sample patients seeded');

    console.log('🎉 Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run seeding
seedData();
