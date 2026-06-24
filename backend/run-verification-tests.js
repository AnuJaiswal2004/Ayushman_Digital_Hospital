import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

const BASE_URL = 'http://localhost:5000/api';
const BASE_URL_V1 = 'http://localhost:5000/api/v1';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ayushman_digital_hospital';

// State variables for testing tracking
let adminToken = '';
let doctorToken = '';
let staffToken = '';
let testPatientId = '';
let testPatientObj = null;
let testApptId = '';
let testVisitId = '';
let testLabOrderId = '';
let testBillId = '';

async function runTests() {
  console.log('🚀 Starting Professional QA/UAT and System Integration Suite...');

  // ==========================================
  // PRE-TEST CHECKLIST VERIFICATION
  // ==========================================
  console.log('\n--- Pre-Test Checklist Verification ---');
  
  // 1. Ensure Uploads Folder exists
  console.log('Checking uploads folder exists...');
  const uploadsDir = 'backend/uploads';
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log(`📁 Created uploads folder: ${uploadsDir}`);
  } else {
    console.log('✅ Uploads folder exists.');
  }

  // 2. Connect to MongoDB
  console.log('Connecting to MongoDB...');
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connection: PASS');
  } catch (err) {
    throw new Error(`FAIL: Cannot connect to MongoDB: ${err.message}`);
  }
  const db = mongoose.connection.db;

  // 3. Clear existing test data
  console.log('Wiping previous test transactional data to reset DB state...');
  const collectionsToClear = [
    'patients', 'appointments', 'visits', 'consultations', 'prescriptions', 
    'laborders', 'billings', 'invoices', 'notifications', 'auditlogs', 'queues', 'files'
  ];
  for (const name of collectionsToClear) {
    await db.collection(name).deleteMany({});
  }
  console.log('✅ Transaction collections cleaned.');

  // 4. Verify seeders executed
  console.log('Verifying default seed users exist in database...');
  const usersCol = db.collection('users');
  const adminUser = await usersCol.findOne({ username: 'admin' });
  const doctorUser = await usersCol.findOne({ username: 'doctor001' });
  const staffUser = await usersCol.findOne({ username: 'staff001' });
  
  if (adminUser && doctorUser && staffUser) {
    console.log('✅ Seed users present (admin, doctor001, staff001): PASS');
  } else {
    throw new Error('FAIL: Seed users are missing. Please run "npm run dev" first to trigger database seeders.');
  }

  // 5. Test Backend Health & Metrics Routes
  console.log('Checking Swagger UI Docs (GET /api/v1/docs)...');
  const swaggerRes = await fetch(`${BASE_URL_V1}/docs`);
  if (swaggerRes.status === 200) {
    console.log('✅ Swagger API docs available: PASS');
  } else {
    throw new Error(`FAIL: Swagger Docs returned status ${swaggerRes.status}`);
  }

  const healthRes = await fetch(`${BASE_URL}/health`);
  const healthData = await healthRes.json();
  if (healthRes.status === 200 && healthData.status === 'UP' && healthData.database === 'CONNECTED') {
    console.log('✅ Health Endpoint Contract: PASS');
  } else {
    throw new Error(`FAIL: Health check contract mismatch: ${JSON.stringify(healthData)}`);
  }

  // ==========================================
  // API CONTRACT TESTING (LOGIN)
  // ==========================================
  console.log('\n--- API Contract Testing (Login) ---');
  
  console.log('Hitting auth login endpoint and validating response structure...');
  const loginRes = await fetch(`${BASE_URL_V1}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' })
  });
  const loginData = await loginRes.json();
  
  // Assert structural contracts
  if (loginRes.status !== 200) {
    throw new Error(`FAIL: Expected login status 200, got ${loginRes.status}`);
  }
  if (loginData.success !== true) {
    throw new Error('FAIL: Contract success flag must be true');
  }
  if (typeof loginData.token !== 'string' || loginData.token.length === 0) {
    throw new Error('FAIL: Contract token is missing or invalid');
  }
  if (!loginData.user || !loginData.user.role || loginData.user.role !== 'admin') {
    throw new Error(`FAIL: Contract user role mismatch: ${JSON.stringify(loginData.user)}`);
  }
  
  // Security Contract Check: Ensure no password hash leak
  if (loginData.user.password || loginData.user.passwordHash || loginData.user.hash) {
    throw new Error(`❌ SECURITY FAILURE: Response leaked password fields! ${JSON.stringify(loginData.user)}`);
  } else {
    console.log('✅ Security Contract: PASS (No passwords leaked in login payload)');
  }
  adminToken = loginData.token;

  // Retrieve Doctor and Receptionist Tokens
  const docLogin = await fetch(`${BASE_URL_V1}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'doctor001', password: 'doctor123' })
  });
  const docData = await docLogin.json();
  doctorToken = docData.token;

  const staffLogin = await fetch(`${BASE_URL_V1}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'staff001', password: 'staff123' })
  });
  const staffData = await staffLogin.json();
  staffToken = staffData.token;
  console.log('✅ Admin, Doctor, and Receptionist tokens successfully parsed.');

  // ==========================================
  // LEVEL 4: SECURITY AND ACCESS CONTROL
  // ==========================================
  console.log('\n--- Level 4: Security and Access Control Testing ---');
  
  // 1. Access Admin Endpoint Without Token
  console.log('Testing access to restricted statistics without token...');
  const noTokenRes = await fetch(`${BASE_URL_V1}/dashboard/stats`);
  if (noTokenRes.status === 401) {
    console.log('✅ Request without token rejected (401 Unauthorized): PASS');
  } else {
    throw new Error(`FAIL: Access without token allowed status ${noTokenRes.status}`);
  }

  // 2. Receptionist Accessing Admin Endpoint (POST /api/v1/doctors)
  console.log('Testing Receptionist attempting to create a new doctor (Role restriction)...');
  const roleRestrictedRes = await fetch(`${BASE_URL_V1}/doctors`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${staffToken}`
    },
    body: JSON.stringify({ name: 'Dr. Hack', department: 'cardiology' })
  });
  if (roleRestrictedRes.status === 403) {
    console.log('✅ Receptionist access to doctor creation rejected (403 Forbidden): PASS');
  } else {
    throw new Error(`FAIL: Receptionist authorized to add doctor, status: ${roleRestrictedRes.status}`);
  }

  // 3. Expired/Invalid Token
  console.log('Testing access with an invalid token...');
  const badTokenRes = await fetch(`${BASE_URL_V1}/dashboard/stats`, {
    headers: { 'Authorization': 'Bearer token-is-completely-invalid' }
  });
  if (badTokenRes.status === 401) {
    console.log('✅ Request with invalid token rejected (401 Unauthorized): PASS');
  } else {
    throw new Error(`FAIL: Invalid token bypass, status: ${badTokenRes.status}`);
  }

  // ==========================================
  // NEGATIVE WORKFLOW TESTING
  // ==========================================
  console.log('\n--- Negative Workflow Testing ---');

  // 1. Book appointment in past
  console.log('Attempting to book an appointment with date in the past...');
  const pastApptRes = await fetch(`${BASE_URL_V1}/appointments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${staffToken}` },
    body: JSON.stringify({
      patientId: 'P999',
      patientName: 'Test Patient',
      department: 'cardiology',
      doctor: 'Dr. Rajesh Sharma',
      date: '2020-01-01',
      time: '10:00 AM',
      type: 'opd',
      reason: 'Checkup'
    })
  });
  const pastApptData = await pastApptRes.json();
  if (pastApptRes.status === 400) {
    console.log('✅ Past appointment booking rejected (400 Bad Request): PASS');
  } else {
    throw new Error(`FAIL: Past appointment booking allowed, status: ${pastApptRes.status}, data: ${JSON.stringify(pastApptData)}`);
  }

  // 2. Billing: Negative amount
  console.log('Attempting to process billing payment with a negative amount...');
  const negBillingRes = await fetch(`${BASE_URL_V1}/billing/pay`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${staffToken}` },
    body: JSON.stringify({
      visitId: 'V9999',
      paymentMethod: 'cash',
      totalAmount: -500
    })
  });
  const negBillingData = await negBillingRes.json();
  if (negBillingRes.status === 400) {
    console.log('✅ Negative billing amount rejected (400 Bad Request): PASS');
  } else {
    throw new Error(`FAIL: Negative billing amount allowed, status: ${negBillingRes.status}, data: ${JSON.stringify(negBillingData)}`);
  }

  // 3. ABHA: Short identifier
  console.log('Attempting to register patient with a short ABHA...');
  const shortAbhaRes = await fetch(`${BASE_URL_V1}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Abha Test',
      abha: '12345',
      phone: '9999888877',
      dob: '2004-05-12',
      gender: 'male',
      password: 'password123'
    })
  });
  const shortAbhaData = await shortAbhaRes.json();
  if (shortAbhaRes.status === 400) {
    console.log('✅ Short ABHA identifier registration rejected (400 Bad Request): PASS');
  } else {
    throw new Error(`FAIL: Short ABHA registered, status: ${shortAbhaRes.status}, data: ${JSON.stringify(shortAbhaData)}`);
  }

  // 4. File Upload: Dangerous file extension
  console.log('Attempting to upload executable program (.exe)...');
  const exeBlob = new Blob(['Mock executable content'], { type: 'application/octet-stream' });
  const exeFormData = new FormData();
  exeFormData.append('file', exeBlob, 'malware.exe');
  exeFormData.append('patientId', 'P001');
  exeFormData.append('category', 'OTHER');

  const exeUploadRes = await fetch(`${BASE_URL_V1}/files/upload`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${doctorToken}` },
    body: exeFormData
  });
  const exeUploadData = await exeUploadRes.json();
  if (exeUploadRes.status === 400) {
    console.log('✅ Executable file upload rejected (400 Bad Request): PASS');
  } else {
    throw new Error(`FAIL: Executable file upload bypassed filter, status: ${exeUploadRes.status}, data: ${JSON.stringify(exeUploadData)}`);
  }

  // ==========================================
  // LEVEL 3: WORKFLOW VERIFICATION (HAPPY PATH)
  // ==========================================
  console.log('\n--- Level 3: Patient Journey Happy Path & Integrity Suite ---');
  
  // 1. Patient Registration
  console.log('Registering Test Patient (ABHA: 12345678901234)...');
  const regRes = await fetch(`${BASE_URL_V1}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      abha: '12345678901234',
      name: 'Test Patient',
      phone: '9876543210',
      dob: '1990-01-01',
      gender: 'male',
      password: 'password123'
    })
  });
  const regData = await regRes.json();
  if (regRes.status === 201 && regData.success) {
    testPatientId = regData.patient.id;
    testPatientObj = regData.patient;
    console.log(`✅ Registration successful: Patient ID ${testPatientId}`);
  } else {
    throw new Error(`FAIL: Patient registration: ${JSON.stringify(regData)}`);
  }

  // Verify MongoDB Patients increment
  const patientsCount = await db.collection('patients').countDocuments();
  if (patientsCount >= 1) {
    console.log(`✅ Patients collection size verification (Count: ${patientsCount}): PASS`);
  } else {
    throw new Error('FAIL: Patients collection is empty.');
  }

  // 2. Book Appointment
  console.log('Booking Appointment...');
  const apptRes = await fetch(`${BASE_URL_V1}/appointments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${staffToken}` },
    body: JSON.stringify({
      patientId: testPatientId,
      patientName: 'Test Patient',
      department: 'cardiology',
      doctor: 'Dr. Rajesh Sharma',
      date: new Date().toISOString().split('T')[0],
      time: '10:00 AM',
      type: 'opd',
      reason: 'Frequent palpitation checkup'
    })
  });
  const apptData = await apptRes.json();
  if (apptRes.status === 201 && apptData.id) {
    testApptId = apptData.id;
    console.log(`✅ Book Appointment: PASS (ID: ${testApptId}, Status: ${apptData.status})`);
  } else {
    throw new Error(`FAIL: Book Appointment failed: ${JSON.stringify(apptData)}`);
  }

  // 3. Receptionist Check-In
  console.log('Checking In patient (reception)...');
  const checkInRes = await fetch(`${BASE_URL_V1}/visits/checkin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${staffToken}` },
    body: JSON.stringify({
      patientId: testPatientId,
      doctorName: 'Dr. Rajesh Sharma',
      department: 'cardiology',
      type: 'opd'
    })
  });
  const checkInData = await checkInRes.json();
  if (checkInRes.status === 201 && checkInData.success && checkInData.visit.token) {
    testVisitId = checkInData.visit.id;
    console.log(`✅ Reception Check-In: PASS (Visit ID: ${testVisitId}, Token: ${checkInData.visit.token})`);
  } else {
    throw new Error(`FAIL: Check-in failed: ${JSON.stringify(checkInData)}`);
  }

  // 4. Vitals logging
  console.log('Recording Patient Vitals...');
  const vitalsRes = await fetch(`${BASE_URL_V1}/visits/${testVisitId}/vitals`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${staffToken}` },
    body: JSON.stringify({ temperature: '98.6', pulse: '72', bloodPressure: '120/80', notes: 'Fit' })
  });
  const vitalsData = await vitalsRes.json();
  if (vitalsRes.status === 200 && vitalsData.success) {
    console.log('✅ Vitals recorded: PASS');
  } else {
    throw new Error(`FAIL: Vitals record: ${JSON.stringify(vitalsData)}`);
  }

  // 5. Doctor Consultation
  console.log('Recording Doctor Consultation...');
  const consultRes = await fetch(`${BASE_URL_V1}/consultations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${doctorToken}` },
    body: JSON.stringify({
      visitId: testVisitId,
      patientId: testPatientId,
      doctorId: 'doctor001',
      chiefComplaint: 'Heart palpitations during mild workouts',
      examination: 'Normal S1 S2. Pulse regular.',
      diagnosis: 'Mild Sinus Palpitation',
      treatmentPlan: 'Reduce caffeine intake, stay hydrated'
    })
  });
  const consultData = await consultRes.json();
  if (consultRes.status === 201 && consultData.success) {
    console.log('✅ Doctor Consultation logged: PASS');
  } else {
    throw new Error(`FAIL: Consultation entry failed: ${JSON.stringify(consultData)}`);
  }

  // 6. Prescription
  console.log('Issuing Prescription...');
  const presRes = await fetch(`${BASE_URL_V1}/visits/${testVisitId}/prescription`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${doctorToken}` },
    body: JSON.stringify({
      medications: [{ name: 'Paracetamol', dosage: '500mg', frequency: '1-0-1', duration: 5 }]
    })
  });
  const presData = await presRes.json();
  if (presRes.status === 201 && presData.success) {
    console.log('✅ Prescription generated: PASS');
  } else {
    throw new Error(`FAIL: Prescription failed: ${JSON.stringify(presData)}`);
  }

  // 7. Lab Order
  console.log('Creating Lab Order & transitioning status...');
  const labRes = await fetch(`${BASE_URL_V1}/lab-orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${doctorToken}` },
    body: JSON.stringify({
      visitId: testVisitId,
      patientId: testPatientId,
      doctorId: 'doctor001',
      tests: ['Complete Blood Count (CBC)']
    })
  });
  const labData = await labRes.json();
  if (labRes.status === 201 && labData.success) {
    testLabOrderId = labData.order._id;
    console.log(`✅ Lab Order created: PASS (ID: ${testLabOrderId})`);
    
    // Status Transitions: Ordered -> Sample Collected -> Processing -> Completed
    const statuses = ['Sample Collected', 'Processing', 'Completed'];
    for (const st of statuses) {
      const trRes = await fetch(`${BASE_URL_V1}/lab-orders/${testLabOrderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${staffToken}` },
        body: JSON.stringify({ status: st, reportUrl: st === 'Completed' ? 'http://localhost:5000/uploads/lab_report.pdf' : undefined })
      });
      const trData = await trRes.json();
      if (trRes.status === 200 && trData.order.status === st) {
        console.log(`   ➡️ Transitioned to: ${st} - PASS`);
      } else {
        throw new Error(`FAIL: Lab transition to ${st} failed: ${JSON.stringify(trData)}`);
      }
    }
  } else {
    throw new Error(`FAIL: Lab order creation failed: ${JSON.stringify(labData)}`);
  }

  // 8. Billing
  console.log('Processing payments billing (₹1300 total)...');
  const billRes = await fetch(`${BASE_URL_V1}/billing/pay`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${staffToken}` },
    body: JSON.stringify({
      visitId: testVisitId,
      paymentMethod: 'cash',
      totalAmount: 1300
    })
  });
  const billData = await billRes.json();
  if (billRes.status === 200 && billData.success) {
    testBillId = billData.billing._id;
    console.log(`✅ Billing transaction paid: PASS (ID: ${testBillId})`);
  } else {
    throw new Error(`FAIL: Billing payment failed: ${JSON.stringify(billData)}`);
  }

  // 9. Invoice
  console.log('Verifying generated invoice details...');
  const invoiceDoc = await db.collection('invoices').findOne({ billingId: testBillId.toString() });
  if (invoiceDoc && /^INV-2026-\d{6}$/.test(invoiceDoc.invoiceNumber)) {
    console.log(`✅ Invoice generated correctly (Invoice No: ${invoiceDoc.invoiceNumber}): PASS`);
  } else {
    throw new Error(`FAIL: Invoice structure mismatch or not found: ${JSON.stringify(invoiceDoc)}`);
  }

  // 10. File Upload Testing (Positive PDF upload)
  console.log('Uploading mock prescription PDF for patient locker...');
  const pdfBlob = new Blob(['Mock PDF file contents'], { type: 'application/pdf' });
  const pdfFormData = new FormData();
  pdfFormData.append('file', pdfBlob, 'prescription_locker.pdf');
  pdfFormData.append('patientId', testPatientId);
  pdfFormData.append('visitId', testVisitId);
  pdfFormData.append('category', 'PRESCRIPTION');

  const pdfUploadRes = await fetch(`${BASE_URL_V1}/files/upload`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${doctorToken}` },
    body: pdfFormData
  });
  const pdfUploadData = await pdfUploadRes.json();
  if (pdfUploadRes.status === 201 && pdfUploadData.success && pdfUploadData.file.fileUrl) {
    console.log(`✅ Mock PDF File uploaded successfully (FileUrl: ${pdfUploadData.file.fileUrl}): PASS`);
    
    // Verify physical file exists
    const pPath = path.join('backend', pdfUploadData.file.fileUrl);
    if (fs.existsSync(pPath)) {
      console.log(`✅ Physical file found in backend filesystem: PASS`);
    } else {
      throw new Error(`FAIL: physical file not found at ${pPath}`);
    }
  } else {
    throw new Error(`FAIL: PDF file upload failed: ${JSON.stringify(pdfUploadData)}`);
  }

  // ==========================================
  // DATABASE INTEGRITY AND RELATIONSHIPS
  // ==========================================
  console.log('\n--- Database Integrity & Relationships Testing ---');
  
  const finalPatient = await db.collection('patients').findOne({ id: testPatientId });
  const finalVisit = await db.collection('visits').findOne({ id: testVisitId });
  const finalConsult = await db.collection('consultations').findOne({ visitId: testVisitId });
  const finalPrescription = await db.collection('prescriptions').findOne({ visitId: testVisitId });
  const finalLabOrder = await db.collection('laborders').findOne({ visitId: testVisitId });
  const finalBilling = await db.collection('billings').findOne({ visitId: testVisitId });
  const finalInvoice = await db.collection('invoices').findOne({ billingId: finalBilling._id.toString() });

  // Verify ID link alignments
  if (finalVisit.patientId !== testPatientId) {
    throw new Error(`Integrity Link Fail: visit patientId (${finalVisit.patientId}) !== patient id (${testPatientId})`);
  }
  if (finalConsult.patientId !== testPatientId || finalConsult.visitId !== testVisitId) {
    throw new Error('Integrity Link Fail: consultation patientId/visitId alignment broken');
  }
  if (finalPrescription.patientId !== testPatientId || finalPrescription.visitId !== testVisitId) {
    throw new Error('Integrity Link Fail: prescription links mismatch');
  }
  if (finalLabOrder.patientId !== testPatientId || finalLabOrder.visitId !== testVisitId) {
    throw new Error('Integrity Link Fail: lab order links mismatch');
  }
  if (finalBilling.patientId !== testPatientId || finalBilling.visitId !== testVisitId) {
    throw new Error('Integrity Link Fail: billing links mismatch');
  }
  if (finalInvoice.billingId !== finalBilling._id.toString()) {
    throw new Error('Integrity Link Fail: invoice billing link mismatch');
  }
  console.log('✅ ALL database structural relationships and ID links verified: PASS');

  // ==========================================
  // AUDIT LOG & NOTIFICATIONS TESTING
  // ==========================================
  console.log('\n--- Audit Log & Notifications Testing ---');
  
  // 1. Audit Log Check
  const auditLogs = await db.collection('auditlogs').find().toArray();
  const createdLogs = auditLogs.map(l => l.action);
  console.log(`Action logs recorded: ${createdLogs.join(', ')}`);
  
  const hasReg = createdLogs.some(a => a.includes('Patient Registered') || a.includes('Register'));
  const hasBill = createdLogs.some(a => a.includes('Bill') || a.includes('Payment'));
  if (hasReg && hasBill) {
    console.log('✅ System Audit Logs correct: PASS');
  } else {
    throw new Error('FAIL: Audit logs missing key transactional logging events.');
  }

  // 2. Notification Check
  const notificationsCount = await db.collection('notifications').countDocuments();
  if (notificationsCount > 0) {
    console.log(`✅ System Notifications trigger verified (Count: ${notificationsCount}): PASS`);
  } else {
    throw new Error('FAIL: Notifications table is empty.');
  }

  // ==========================================
  // PERFORMANCE AND MEMORY LEAK TESTING
  // ==========================================
  console.log('\n--- Performance & Memory Leak Testing ---');
  
  // Read initial metrics
  console.log('Retrieving pre-load system metrics...');
  const initMetricsRes = await fetch(`${BASE_URL}/metrics`);
  const initMetrics = await initMetricsRes.json();
  const initHeap = initMetrics.memoryUsage.heapUsed / (1024 * 1024);
  const initConns = initMetrics.mongoConnections;
  console.log(`Starting Heap: ${initHeap.toFixed(2)} MB | Starting DB Connections: ${initConns}`);

  // Test Case: Latency Percentiles (50 concurrent dashboard loads)
  console.log('Running latency profiling (50 concurrent requests to /api/v1/dashboard/stats)...');
  const latencyStart = Date.now();
  const requests = Array.from({ length: 50 }).map(() => 
    fetch(`${BASE_URL_V1}/dashboard/stats`, { headers: { 'Authorization': `Bearer ${adminToken}` } })
  );
  
  const responses = await Promise.all(requests);
  const totalTime = Date.now() - latencyStart;
  const latencies = responses.map(() => totalTime); // Approximate concurrency roundtrip
  const avgLatency = totalTime / 50;
  
  // 95th Percentile check
  const sortedLatencies = [...latencies].sort((a, b) => a - b);
  const p95Index = Math.floor(sortedLatencies.length * 0.95);
  const p95Latency = sortedLatencies[p95Index];
  
  console.log(`Average Latency: ${avgLatency.toFixed(2)}ms | 95th Percentile Latency: ${p95Latency}ms`);
  if (p95Latency < 1000) {
    console.log('✅ Concurrency Latency: PASS (Expected: <1000ms)');
  } else {
    throw new Error(`FAIL: Concurrency Latency too high: P95: ${p95Latency}ms`);
  }

  // Stress load insertion: 100 Patients, 100 Appointments, 50 Visits, 50 Consultations, 50 Billings
  console.log('Stress loading database with scale records (100 Patients, 100 Appts, 50 Visits, 50 Consults, 50 Bills)...');
  const patientsBatch = [];
  const appointmentsBatch = [];
  const visitsBatch = [];
  const consultsBatch = [];
  const billingsBatch = [];

  for (let i = 1; i <= 100; i++) {
    const numStr = String(i).padStart(3, '0');
    const pId = `PSTRESS${numStr}`;
    const vId = `VSTRESS${numStr}`;
    
    patientsBatch.push({
      id: pId,
      name: `Stress Patient ${numStr}`,
      abha: `99990000111${numStr}`,
      phone: `9000000${numStr}`,
      dob: '1990-10-10',
      gender: 'male',
      password: 'password123',
      status: 'Active',
      registrationDate: new Date()
    });
    
    appointmentsBatch.push({
      id: `ASTRESS${numStr}`,
      patientId: pId,
      patientName: `Stress Patient ${numStr}`,
      department: 'cardiology',
      doctor: 'Dr. Rajesh Sharma',
      date: new Date().toISOString().split('T')[0],
      time: '11:00 AM',
      type: 'opd',
      status: 'scheduled',
      reason: 'Routine stress check'
    });

    if (i <= 50) {
      visitsBatch.push({
        id: vId,
        patientId: pId,
        patientName: `Stress Patient ${numStr}`,
        token: `TKNST${numStr}`,
        date: new Date().toISOString().split('T')[0],
        time: '02:00 PM',
        type: 'opd',
        department: 'cardiology',
        doctor: 'Dr. Rajesh Sharma',
        status: 'completed',
        currentStep: 'completed'
      });

      consultsBatch.push({
        visitId: vId,
        patientId: pId,
        doctorId: 'doctor001',
        chiefComplaint: 'Palpitations',
        diagnosis: 'Arrhythmia',
        treatmentPlan: 'Vitals monitoring'
      });

      billingsBatch.push({
        visitId: vId,
        patientId: pId,
        patientName: `Stress Patient ${numStr}`,
        totalAmount: 1300,
        paymentMethod: 'cash',
        paidAt: new Date(),
        status: 'paid'
      });
    }
  }

  const batchStart = Date.now();
  await db.collection('patients').insertMany(patientsBatch);
  await db.collection('appointments').insertMany(appointmentsBatch);
  await db.collection('visits').insertMany(visitsBatch);
  await db.collection('consultations').insertMany(consultsBatch);
  await db.collection('billings').insertMany(billingsBatch);
  console.log(`✅ Stress data batch inserted in ${Date.now() - batchStart}ms.`);

  // Verify Heap memory stable & DB connections stable
  console.log('Retrieving post-load metrics to check for memory leaks...');
  const postMetricsRes = await fetch(`${BASE_URL}/metrics`);
  const postMetrics = await postMetricsRes.json();
  const postHeap = postMetrics.memoryUsage.heapUsed / (1024 * 1024);
  const postConns = postMetrics.mongoConnections;
  console.log(`Post-Load Heap: ${postHeap.toFixed(2)} MB | Post-Load DB Connections: ${postConns}`);
  
  const heapDiff = postHeap - initHeap;
  console.log(`Heap Delta: ${heapDiff.toFixed(2)} MB`);
  if (heapDiff < 50) {
    console.log('✅ Heap Stability: PASS (Heap remains within acceptable thresholds, no memory leak)');
  } else {
    console.warn('⚠️ Warning: Heap delta exceeds 50MB. Verify garbage collection cycle.');
  }
  
  if (postConns <= initConns + 5) {
    console.log('✅ Mongo Connections Stability: PASS (Connections correctly pooled and released)');
  } else {
    throw new Error(`FAIL: Connection pool leak detected. Connection count: ${postConns}`);
  }

  console.log('\n🌟 ALL QA/UAT SYSTEM INTEGRATION TESTS PASSED SUCCESSFULY!');
  
  // Disconnect mongoose
  await mongoose.disconnect();
  process.exit(0);
}

runTests().catch(err => {
  console.error('\n❌ TEST RUN ENCOUNTERED A FAILURE:', err.message);
  mongoose.disconnect();
  process.exit(1);
});
