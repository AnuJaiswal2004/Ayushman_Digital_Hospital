import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ayushman_digital_hospital';

async function main() {
  const action = process.argv[2] || 'stats';
  const collectionName = process.argv[3];

  await mongoose.connect(MONGODB_URI);

  const db = mongoose.connection.db;

  if (action === 'stats') {
    console.log('=== Database Collection Stats ===');
    const collections = await db.listCollections().toArray();
    for (const col of collections) {
      const count = await db.collection(col.name).countDocuments();
      console.log(`- Collection: ${col.name.padEnd(20)} | Documents: ${count}`);
    }
  } else if (action === 'query') {
    if (!collectionName) {
      console.error('Please specify a collection name.');
      process.exit(1);
    }
    console.log(`=== Querying Collection: ${collectionName} ===`);
    const records = await db.collection(collectionName).find().sort({ createdAt: -1 }).limit(10).toArray();
    console.log(JSON.stringify(records, null, 2));
  } else if (action === 'clear') {
    if (!collectionName) {
      console.error('Please specify a collection name to clear.');
      process.exit(1);
    }
    console.log(`=== Clearing Collection: ${collectionName} ===`);
    const result = await db.collection(collectionName).deleteMany({});
    console.log(`Deleted ${result.deletedCount} documents.`);
  } else if (action === 'details') {
    console.log('=== Database Details ===');
    // List patients
    const patients = await db.collection('patients').find().toArray();
    console.log(`Patients: ${patients.length}`);
    patients.forEach(p => console.log(`  - ID: ${p.id}, Name: ${p.name}, ABHA: ${p.abha}, Phone: ${p.phone}`));

    // List visits
    const visits = await db.collection('visits').find().toArray();
    console.log(`Visits: ${visits.length}`);
    visits.forEach(v => console.log(`  - ID: ${v._id || v.id}, Patient: ${v.patientName}, Doctor: ${v.doctor}, Status: ${v.status}, Token: ${v.token}`));

    // List consultations
    const consultations = await db.collection('consultations').find().toArray();
    console.log(`Consultations: ${consultations.length}`);

    // List prescriptions
    const prescriptions = await db.collection('prescriptions').find().toArray();
    console.log(`Prescriptions: ${prescriptions.length}`);

    // List billing
    const billings = await db.collection('billings').find().toArray();
    console.log(`Billings: ${billings.length}`);
  }

  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
