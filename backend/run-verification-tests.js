import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const BASE_URL = 'http://localhost:5000/api';
const BASE_URL_V1 = 'http://localhost:5000/api/v1';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ayushman_digital_hospital';

// Global variables for verification state
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
  console.log('🚀 Starting Layered Infrastructure and Integration Tests...');

  // Connect to database
  console.log('📡 Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;

  // Clear relevant collections to start fresh
  console.log('🧹 Clearing previous test data...');
  const collectionsToClear = ['patients', 'appointments', 'visits', 'consultations', 'prescriptions', 'laborders', 'billings', 'invoices', 'notifications', 'auditlogs', 'queues'];
  for (const name of collectionsToClear) {
    await db.collection(name).deleteMany({});
  }
  console.log('✅ Previous test data cleared.');

  // ==========================================
  // PHASE 1: INFRASTRUCTURE TESTING
  // ==========================================
  console.log('\n--- Phase 1: Infrastructure Testing ---');
  
  // Test Health
  console.log('Testing /api/health...');
  const healthRes = await fetch(`${BASE_URL}/health`);
  const healthData = await healthRes.json();
  if (healthRes.status === 200 && healthData.status === 'UP' && healthData.database === 'CONNECTED') {
    console.log('✅ Backend Health Check: PASS');
  } else {
    throw new Error(`FAIL: Health check failed: ${JSON.stringify(healthData)}`);
  }

  // Test Metrics
  console.log('Testing /api/metrics...');
  const metricsRes = await fetch(`${BASE_URL}/metrics`);
  const metricsData = await metricsRes.json();
  if (metricsRes.status === 200 && metricsData.dbStatus === 'connected') {
    console.log('✅ Backend Metrics Check: PASS');
  } else {
    throw new Error(`FAIL: Metrics check failed: ${JSON.stringify(metricsData)}`);
  }

  // Test Swagger Route
  console.log('Testing Swagger UI Route...');
  const swaggerRes = await fetch(`${BASE_URL_V1}/docs`);
  if (swaggerRes.status === 200) {
    console.log('✅ Swagger Documentation Route: PASS');
  } else {
    throw new Error(`FAIL: Swagger Route returned status ${swaggerRes.status}`);
  }

  // ==========================================
  // PHASE 2: AUTHENTICATION TESTING
  // ==========================================
  console.log('\n--- Phase 2: Authentication Testing ---');
  
  // 1. Admin Login
  console.log('Testing Admin Login (admin / admin123)...');
  const adminLoginRes = await fetch(`${BASE_URL_V1}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' })
  });
  const adminLoginData = await adminLoginRes.json();
  if (adminLoginRes.status === 200 && adminLoginData.token && adminLoginData.user.role === 'admin') {
    adminToken = adminLoginData.token;
    console.log('✅ Admin Login: PASS (Token generated)');
  } else {
    throw new Error(`FAIL: Admin Login failed: ${JSON.stringify(adminLoginData)}`);
  }

  // 2. Doctor Login
  console.log('Testing Doctor Login (doctor001 / doctor123)...');
  const doctorLoginRes = await fetch(`${BASE_URL_V1}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'doctor001', password: 'doctor123' })
  });
  const doctorLoginData = await doctorLoginRes.json();
  if (doctorLoginRes.status === 200 && doctorLoginData.token && doctorLoginData.user.role === 'doctor') {
    doctorToken = doctorLoginData.token;
    console.log('✅ Doctor Login: PASS (Token generated)');
  } else {
    throw new Error(`FAIL: Doctor Login failed: ${JSON.stringify(doctorLoginData)}`);
  }

  // 3. Receptionist Login
  console.log('Testing Receptionist Login (staff001 / staff123)...');
  const receptionistLoginRes = await fetch(`${BASE_URL_V1}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'staff001', password: 'staff123' })
  });
  const receptionistLoginData = await receptionistLoginRes.json();
  if (receptionistLoginRes.status === 200 && receptionistLoginData.token && receptionistLoginData.user.role === 'receptionist') {
    staffToken = receptionistLoginData.token;
    console.log('✅ Receptionist Login: PASS (Token generated)');
  } else {
    throw new Error(`FAIL: Receptionist Login failed: ${JSON.stringify(receptionistLoginData)}`);
  }

  // 4. Invalid Login
  console.log('Testing Invalid Login (abc / wrong)...');
  const invalidLoginRes = await fetch(`${BASE_URL_V1}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'abc', password: 'wrong' })
  });
  const invalidLoginData = await invalidLoginRes.json();
  if (invalidLoginRes.status !== 200) {
    console.log('✅ Invalid Login Handled: PASS (Returned non-200 status code)');
  } else {
    throw new Error(`FAIL: Invalid Login returned 200 instead of error: ${JSON.stringify(invalidLoginData)}`);
  }

  // ==========================================
  // PHASE 3: PATIENT WORKFLOW TESTING
  // ==========================================
  console.log('\n--- Phase 3: Patient Workflow Testing ---');
  
  // 1. Register Patient
  console.log('Registering Patient...');
  const patientBody = {
    name: 'Anuj Jaiswal',
    abha: '11112222333344',
    phone: '9999888877',
    dob: '2004-05-12',
    gender: 'male',
    password: 'password123'
  };
  const regRes = await fetch(`${BASE_URL_V1}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patientBody)
  });
  const regData = await regRes.json();
  if (regRes.status === 201 && regData.success) {
    testPatientId = regData.patient.id;
    testPatientObj = regData.patient;
    console.log(`✅ Register Patient: PASS (Patient registered with ID ${testPatientId})`);
    
    // Verify MongoDB Patients Collection
    const patientsCol = db.collection('patients');
    const patientDoc = await patientsCol.findOne({ id: testPatientId });
    if (patientDoc && patientDoc.name === 'Anuj Jaiswal') {
      console.log('✅ MongoDB Patient Record Verification: PASS');
    } else {
      throw new Error('FAIL: Patient record not found in patients collection.');
    }
  } else {
    throw new Error(`FAIL: Patient registration failed: ${JSON.stringify(regData)}`);
  }

  // 2. Book Appointment
  console.log('Booking Appointment...');
  const apptBody = {
    patientId: testPatientId,
    patientName: 'Anuj Jaiswal',
    department: 'cardiology',
    doctor: 'Dr. Rajesh Sharma',
    date: new Date().toISOString().split('T')[0],
    time: '10:00 AM',
    type: 'opd',
    reason: 'Frequent palpitation checkup'
  };
  const apptRes = await fetch(`${BASE_URL_V1}/appointments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${staffToken}`
    },
    body: JSON.stringify(apptBody)
  });
  const apptData = await apptRes.json();
  if (apptRes.status === 201 && apptData.id) {
    testApptId = apptData.id;
    console.log(`✅ Book Appointment: PASS (Appointment booked with ID ${testApptId})`);
    
    // Verify MongoDB Appointments Collection
    const apptsCol = db.collection('appointments');
    const apptDoc = await apptsCol.findOne({ id: testApptId });
    if (apptDoc && apptDoc.status === 'scheduled') {
      console.log('✅ MongoDB Appointment Status Verification: PASS (scheduled)');
    } else {
      throw new Error('FAIL: Appointment not found or status is not scheduled in MongoDB.');
    }
  } else {
    throw new Error(`FAIL: Appointment booking failed: ${JSON.stringify(apptData)}`);
  }

  // 3. Check-In (Create Visit & Queue entry)
  console.log('Checking In Patient (creating Visit & Queue Token)...');
  const checkInBody = {
    patientId: testPatientId,
    doctorName: 'Dr. Rajesh Sharma',
    department: 'cardiology',
    type: 'opd'
  };
  const checkInRes = await fetch(`${BASE_URL_V1}/visits/checkin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${staffToken}`
    },
    body: JSON.stringify(checkInBody)
  });
  const checkInData = await checkInRes.json();
  if (checkInRes.status === 201 && checkInData.success && checkInData.visit.token) {
    testVisitId = checkInData.visit.id;
    const token = checkInData.visit.token;
    console.log(`✅ Check-In Visit: PASS (Visit generated: ${testVisitId}, Token: ${token})`);

    // Verify MongoDB Visits Collection
    const visitsCol = db.collection('visits');
    const visitDoc = await visitsCol.findOne({ id: testVisitId });
    if (visitDoc && visitDoc.token === token) {
      console.log('✅ MongoDB Visit & Token Verification: PASS');
    } else {
      throw new Error('FAIL: Visit record or generated token not found in MongoDB.');
    }
  } else {
    throw new Error(`FAIL: Check-In failed: ${JSON.stringify(checkInData)}`);
  }

  // 4. Record Vitals
  console.log('Recording Vitals...');
  const vitalsBody = {
    temperature: '98.4',
    pulse: '72',
    bloodPressure: '120/80',
    notes: 'Stable'
  };
  const vitalsRes = await fetch(`${BASE_URL_V1}/visits/${testVisitId}/vitals`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${staffToken}`
    },
    body: JSON.stringify(vitalsBody)
  });
  const vitalsData = await vitalsRes.json();
  if (vitalsRes.status === 200 && vitalsData.success) {
    console.log('✅ Record Vitals: PASS');

    // Verify Patient.EMR.vitals
    const patientDoc = await db.collection('patients').findOne({ id: testPatientId });
    if (patientDoc && patientDoc.vitals && patientDoc.vitals.length > 0) {
      const vit = patientDoc.vitals[0];
      if (vit.bloodPressure === '120/80' && vit.temperature === '98.4') {
        console.log('✅ Patient.EMR.vitals update verified in MongoDB: PASS');
      } else {
        throw new Error(`FAIL: EMR vitals mismatch: ${JSON.stringify(vit)}`);
      }
    } else {
      throw new Error('FAIL: Patient vitals array not populated in MongoDB EMR.');
    }
  } else {
    throw new Error(`FAIL: Record vitals failed: ${JSON.stringify(vitalsData)}`);
  }

  // 5. Queue Status
  console.log('Verifying Queue Status change from WAITING to IN_PROGRESS...');
  const queueEntry = await db.collection('queues').findOne({ visitId: testVisitId });
  if (queueEntry && queueEntry.status === 'IN_PROGRESS' && queueEntry.currentStage === 'Consultation') {
    console.log('✅ Queue Status transitioned to IN_PROGRESS: PASS');
  } else {
    throw new Error(`FAIL: Queue status mismatch: ${JSON.stringify(queueEntry)}`);
  }

  // ==========================================
  // PHASE 4: CONSULTATION TESTING
  // ==========================================
  console.log('\n--- Phase 4: Consultation Testing ---');
  console.log('Creating Consultation as Doctor...');
  const consultBody = {
    complaint: 'Heart palpitations during mild workouts',
    examination: 'Normal S1 S2, no murmurs. Pulse regular.',
    diagnosis: 'Mild Sinus Palpitation',
    treatment: 'Reduce caffeine intake, stay hydrated'
  };
  const consultRes = await fetch(`${BASE_URL_V1}/visits/${testVisitId}/consultation`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${doctorToken}`
    },
    body: JSON.stringify(consultBody)
  });
  const consultData = await consultRes.json();
  if (consultRes.status === 200 && consultData.success) {
    console.log('✅ Create Consultation API: PASS');
    
    // Verify Visit contains Consultation
    const visitDoc = await db.collection('visits').findOne({ id: testVisitId });
    if (visitDoc && visitDoc.consultation && visitDoc.consultation.diagnosis === 'Mild Sinus Palpitation') {
      console.log('✅ MongoDB Visit Consultation verification: PASS');
    } else {
      throw new Error('FAIL: Consultation not found in visit record in MongoDB.');
    }
  } else {
    throw new Error(`FAIL: Consultation creation failed: ${JSON.stringify(consultData)}`);
  }

  // ==========================================
  // PHASE 5: PRESCRIPTION TESTING
  // ==========================================
  console.log('\n--- Phase 5: Prescription Testing ---');
  console.log('Creating Prescription...');
  const medsBody = {
    medications: [
      { name: 'Paracetamol', dosage: '500mg', frequency: '1-0-1', duration: 5 }
    ]
  };
  const presRes = await fetch(`${BASE_URL_V1}/visits/${testVisitId}/prescription`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${doctorToken}`
    },
    body: JSON.stringify(medsBody)
  });
  const presData = await presRes.json();
  if (presRes.status === 201 && presData.success && presData.prescription) {
    console.log('✅ Issue Prescription API: PASS');
    
    // Verify prescriptions collection contains record
    const presDoc = await db.collection('prescriptions').findOne({ visitId: testVisitId });
    if (presDoc && presDoc.medications.length > 0 && presDoc.medications[0].name === 'Paracetamol') {
      console.log('✅ MongoDB Prescriptions collection verification: PASS');
    } else {
      throw new Error('FAIL: Prescription not found in prescriptions collection in MongoDB.');
    }
  } else {
    throw new Error(`FAIL: Prescription issuance failed: ${JSON.stringify(presData)}`);
  }

  // ==========================================
  // PHASE 6: LAB WORKFLOW TESTING
  // ==========================================
  console.log('\n--- Phase 6: Lab Workflow Testing ---');
  console.log('Creating Lab Order...');
  const labBody = {
    visitId: testVisitId,
    patientId: testPatientId,
    doctorId: 'doctor001',
    tests: ['Complete Blood Count (CBC)'],
    instructions: 'Perform morning fasting'
  };
  const labRes = await fetch(`${BASE_URL_V1}/lab-orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${doctorToken}`
    },
    body: JSON.stringify(labBody)
  });
  const labData = await labRes.json();
  if (labRes.status === 201 && labData.success && labData.order.status === 'Ordered') {
    testLabOrderId = labData.order._id;
    console.log(`✅ Lab Order Creation: PASS (Status: Ordered, ID: ${testLabOrderId})`);

    // Verification 1: Sample Collected
    console.log('Transitioning Lab Order status to "Sample Collected"...');
    const patch1 = await fetch(`${BASE_URL_V1}/lab-orders/${testLabOrderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${staffToken}` },
      body: JSON.stringify({ status: 'Sample Collected' })
    });
    const patch1Data = await patch1.json();
    if (patch1.status === 200 && patch1Data.order.status === 'Sample Collected') {
      console.log('✅ Lab Order: Sample Collected: PASS');
    } else {
      throw new Error('FAIL: Lab status transition to Sample Collected failed.');
    }

    // Verification 2: Processing
    console.log('Transitioning Lab Order status to "Processing"...');
    const patch2 = await fetch(`${BASE_URL_V1}/lab-orders/${testLabOrderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${staffToken}` },
      body: JSON.stringify({ status: 'Processing' })
    });
    const patch2Data = await patch2.json();
    if (patch2.status === 200 && patch2Data.order.status === 'Processing') {
      console.log('✅ Lab Order: Processing: PASS');
    } else {
      throw new Error('FAIL: Lab status transition to Processing failed.');
    }

    // Verification 3: Completed
    console.log('Transitioning Lab Order status to "Completed"...');
    const patch3 = await fetch(`${BASE_URL_V1}/lab-orders/${testLabOrderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${staffToken}` },
      body: JSON.stringify({ status: 'Completed', reportUrl: 'http://localhost:5000/uploads/lab_cbc.pdf' })
    });
    const patch3Data = await patch3.json();
    if (patch3.status === 200 && patch3Data.order.status === 'Completed') {
      console.log('✅ Lab Order: Completed: PASS');
      
      // Verify Patient EMR updated
      const patientDoc = await db.collection('patients').findOne({ id: testPatientId });
      if (patientDoc && patientDoc.labReports && patientDoc.labReports.length > 0) {
        console.log('✅ Patient.EMR.labReports verified in MongoDB: PASS');
      } else {
        throw new Error('FAIL: Lab report not updated in patient locker in MongoDB.');
      }
    } else {
      throw new Error('FAIL: Lab status transition to Completed failed.');
    }
  } else {
    throw new Error(`FAIL: Lab order creation failed: ${JSON.stringify(labData)}`);
  }

  // ==========================================
  // PHASE 7: BILLING TESTING
  // ==========================================
  console.log('\n--- Phase 7: Billing Testing ---');
  console.log('Processing payment of ₹1300...');
  const billingBody = {
    visitId: testVisitId,
    paymentMethod: 'cash',
    totalAmount: 1300
  };
  const billRes = await fetch(`${BASE_URL_V1}/billing/pay`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${staffToken}`
    },
    body: JSON.stringify(billingBody)
  });
  const billData = await billRes.json();
  if (billRes.status === 200 && billData.success && billData.billing.totalAmount === 1300) {
    testBillId = billData.billing._id;
    console.log(`✅ Billing Processed: PASS (Total: ₹1300, ID: ${testBillId})`);
    
    // Verify MongoDB Billings Collection
    const billDoc = await db.collection('billings').findOne({ _id: new mongoose.Types.ObjectId(testBillId) });
    if (billDoc && billDoc.status === 'paid') {
      console.log('✅ MongoDB Billings verification: PASS');
    } else {
      throw new Error('FAIL: Billing record not found in MongoDB or unpaid.');
    }
  } else {
    throw new Error(`FAIL: Billing payment failed: ${JSON.stringify(billData)}`);
  }

  // ==========================================
  // PHASE 8: INVOICE TESTING
  // ==========================================
  console.log('\n--- Phase 8: Invoice Testing ---');
  console.log('Checking invoice generation...');
  const invDoc = await db.collection('invoices').findOne({ billingId: testBillId.toString() });
  if (invDoc && invDoc.invoiceNumber.startsWith('INV-')) {
    console.log(`✅ Invoice Generated: PASS (Invoice Number: ${invDoc.invoiceNumber}, GST: ₹${invDoc.gst})`);
  } else {
    throw new Error(`FAIL: Invoice not found or incorrect invoice format: ${JSON.stringify(invDoc)}`);
  }

  // ==========================================
  // PHASE 9: NOTIFICATION TESTING
  // ==========================================
  console.log('\n--- Phase 9: Notification Testing ---');
  console.log('Retrieving notifications...');
  const notiRes = await fetch(`${BASE_URL_V1}/notifications`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const notiData = await notiRes.json();
  if (notiRes.status === 200 && Array.isArray(notiData)) {
    console.log(`✅ Notifications Retrieved: PASS (Count: ${notiData.length})`);
    // Verify notifications exists in MongoDB
    const notiDoc = await db.collection('notifications').findOne({});
    if (notiDoc) {
      console.log('✅ MongoDB Notifications collection verified: PASS');
    } else {
      throw new Error('FAIL: Notifications collection is empty in MongoDB.');
    }
  } else {
    throw new Error(`FAIL: Notification fetch failed: ${JSON.stringify(notiData)}`);
  }

  // ==========================================
  // PHASE 10: AUDIT LOG TESTING
  // ==========================================
  console.log('\n--- Phase 10: Audit Log Testing ---');
  console.log('Checking audit log entries...');
  const logsCol = db.collection('auditlogs');
  const regLog = await logsCol.findOne({ action: 'Patient Registered' });
  const billLog = await logsCol.findOne({ action: 'Bill Generated' });
  if (regLog && billLog) {
    console.log('✅ Audit logs generated and verified: PASS');
  } else {
    throw new Error(`FAIL: Audit logs missing registration/billing events. RegLog: ${JSON.stringify(regLog)}, BillLog: ${JSON.stringify(billLog)}`);
  }

  // ==========================================
  // PHASE 11: API TESTING (Input Validation & Error Handling)
  // ==========================================
  console.log('\n--- Phase 11: API Testing (Error Handling) ---');
  console.log('Testing registration validator (invalid ABHA length & wrong phone number length)...');
  const invalidRegRes = await fetch(`${BASE_URL_V1}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Invalid Test',
      abha: '123',
      phone: '456',
      dob: 'wrong-date',
      gender: 'unknown',
      password: '123'
    })
  });
  const invalidRegData = await invalidRegRes.json();
  if (invalidRegRes.status === 400 && invalidRegData.errors && invalidRegData.errors.length > 0) {
    console.log('✅ API Validation Error Handling: PASS (Returned 400 Bad Request and validation errors array)');
  } else {
    throw new Error(`FAIL: Validation bypass or wrong status: ${invalidRegRes.status}, data: ${JSON.stringify(invalidRegData)}`);
  }

  // ==========================================
  // PHASE 12: STRESS TESTING
  // ==========================================
  console.log('\n--- Phase 12: Stress Testing ---');
  console.log('Generating batch stress load (50 Patients, 50 Appointments, 20 Visits, 10 Billings)...');
  
  const startTime = Date.now();
  
  const patientsBatch = [];
  const appointmentsBatch = [];
  const visitsBatch = [];
  const billingsBatch = [];
  
  for (let i = 1; i <= 50; i++) {
    const numStr = String(i).padStart(3, '0');
    patientsBatch.push({
      id: `PSTRESS${numStr}`,
      name: `Stress Patient ${numStr}`,
      abha: `99990000111${numStr}`,
      phone: `9000000${numStr}`,
      dob: '1995-10-10',
      gender: i % 2 === 0 ? 'male' : 'female',
      password: 'password123',
      status: 'Active',
      registrationDate: new Date()
    });
    
    appointmentsBatch.push({
      id: `ASTRESS${numStr}`,
      patientId: `PSTRESS${numStr}`,
      patientName: `Stress Patient ${numStr}`,
      department: 'cardiology',
      doctor: 'Dr. Rajesh Sharma',
      date: new Date().toISOString().split('T')[0],
      time: '11:00 AM',
      type: 'opd',
      status: 'scheduled',
      reason: 'Routine Stress Check'
    });
  }

  for (let i = 1; i <= 20; i++) {
    const numStr = String(i).padStart(4, '0');
    const token = 'TKNST' + String(i).padStart(3, '0');
    visitsBatch.push({
      id: `VSTRESS${numStr}`,
      patientId: `PSTRESS0${String(i).padStart(2, '0')}`,
      patientName: `Stress Patient 0${String(i).padStart(2, '0')}`,
      token,
      date: new Date().toISOString().split('T')[0],
      time: '02:00 PM',
      type: 'opd',
      department: 'cardiology',
      doctor: 'Dr. Rajesh Sharma',
      status: 'scheduled',
      currentStep: 'vitals'
    });
  }

  for (let i = 1; i <= 10; i++) {
    const numStr = String(i).padStart(3, '0');
    billingsBatch.push({
      visitId: `VSTRESS00${String(i).padStart(2, '0')}`,
      patientId: `PSTRESS0${String(i).padStart(2, '0')}`,
      patientName: `Stress Patient 0${String(i).padStart(2, '0')}`,
      totalAmount: 1300,
      paymentMethod: 'cash',
      paidAt: new Date(),
      status: 'paid'
    });
  }

  await db.collection('patients').insertMany(patientsBatch);
  await db.collection('appointments').insertMany(appointmentsBatch);
  await db.collection('visits').insertMany(visitsBatch);
  await db.collection('billings').insertMany(billingsBatch);
  
  const insertTime = Date.now() - startTime;
  console.log(`✅ Stress load records inserted in ${insertTime}ms.`);

  // Test dashboard loading speed with full database load
  console.log('Fetching dashboard statistics to measure response latency...');
  const dashStart = Date.now();
  const dashRes = await fetch(`${BASE_URL_V1}/dashboard/stats`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const dashData = await dashRes.json();
  const dashLatency = Date.now() - dashStart;
  
  if (dashRes.status === 200 && dashData.success && dashLatency < 1000) {
    console.log(`✅ Dashboard stats loaded successfully under stress. Latency: ${dashLatency}ms (Expected: <1000ms): PASS`);
  } else {
    throw new Error(`FAIL: Dashboard stats latency too high or failed: Status: ${dashRes.status}, Latency: ${dashLatency}ms`);
  }

  // ==========================================
  // FINAL ACCEPTANCE TEST
  // ==========================================
  console.log('\n--- Final Acceptance Test ---');
  console.log('Executing complete patient lifecycle (Register -> Book -> Checkin -> Vitals -> Consult -> Prescribe -> Lab -> Bill -> Discharge)...');
  
  const endPatientBody = {
    name: 'Final Acceptance Patient',
    abha: '88887777666655',
    phone: '9888877777',
    dob: '1988-08-08',
    gender: 'female',
    password: 'password123'
  };
  
  // 1. Registration
  const fReg = await fetch(`${BASE_URL_V1}/auth/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(endPatientBody)
  });
  const fRegData = await fReg.json();
  const patId = fRegData.patient.id;

  // 2. Appointment Booking
  const fBook = await fetch(`${BASE_URL_V1}/appointments`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${staffToken}` },
    body: JSON.stringify({
      patientId: patId, patientName: endPatientBody.name, department: 'pediatrics',
      doctor: 'Dr. Priya Mehta', date: new Date().toISOString().split('T')[0],
      time: '11:00 AM', type: 'opd', reason: 'Routine checks'
    })
  });
  const fBookData = await fBook.json();

  // 3. Check-In
  const fCheck = await fetch(`${BASE_URL_V1}/visits/checkin`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${staffToken}` },
    body: JSON.stringify({ patientId: patId, doctorName: 'Dr. Priya Mehta', department: 'pediatrics', type: 'opd' })
  });
  const fCheckData = await fCheck.json();
  const visId = fCheckData.visit.id;

  // 4. Vitals logging
  await fetch(`${BASE_URL_V1}/visits/${visId}/vitals`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${staffToken}` },
    body: JSON.stringify({ temperature: '98.6', pulse: '76', bloodPressure: '110/70', notes: 'Normal' })
  });

  // 5. Consultation
  await fetch(`${BASE_URL_V1}/visits/${visId}/consultation`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${doctorToken}` },
    body: JSON.stringify({ complaint: 'Cough', examination: 'Congested throat', diagnosis: 'Pharyngitis', treatment: 'Rest and meds' })
  });

  // 6. Prescription
  await fetch(`${BASE_URL_V1}/visits/${visId}/prescription`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${doctorToken}` },
    body: JSON.stringify({ medications: [{ name: 'Cough Syrup', dosage: '5ml', frequency: '0-0-1', duration: 3 }] })
  });

  // 7. Lab Order
  const fLab = await fetch(`${BASE_URL_V1}/lab-orders`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${doctorToken}` },
    body: JSON.stringify({ visitId: visId, patientId: patId, doctorId: 'doctor002', tests: ['Throat Swab Culture'] })
  });
  const fLabData = await fLab.json();
  
  // Transition Lab
  const labId = fLabData.order._id;
  await fetch(`${BASE_URL_V1}/lab-orders/${labId}`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${staffToken}` },
    body: JSON.stringify({ status: 'Completed', reportUrl: 'http://localhost:5000/uploads/swab.pdf' })
  });

  // 8. Billing & Invoice & Discharge
  const fBill = await fetch(`${BASE_URL_V1}/billing/pay`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${staffToken}` },
    body: JSON.stringify({ visitId: visId, paymentMethod: 'upi', totalAmount: 1300 })
  });
  const fBillData = await fBill.json();

  // Verify DB state for this visit is completed and paid
  const finalVisit = await db.collection('visits').findOne({ id: visId });
  const finalBill = await db.collection('billings').findOne({ visitId: visId });
  const finalInvoice = await db.collection('invoices').findOne({ billingId: fBillData.billing._id.toString() });

  if (finalVisit && finalVisit.status === 'completed' && finalBill && finalBill.status === 'paid' && finalInvoice) {
    console.log('✅ Final Acceptance Test Patient Lifecycle Verification: PASS');
  } else {
    throw new Error('FAIL: Final Acceptance lifecycle failed to complete visit and invoice records.');
  }

  console.log('\n🌟 ALL TEST PHASES PASSED SUCCESSFULY! Verification completed with 0 errors.');
  
  // Disconnect mongoose
  await mongoose.disconnect();
  process.exit(0);
}

runTests().catch(err => {
  console.error('\n❌ TEST RUN FAILED:', err.message);
  mongoose.disconnect();
  process.exit(1);
});
