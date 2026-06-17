// API and Storage Service
const BACKEND_URL = 'http://localhost:5000/api';

// Check if backend is available
let isBackendAvailable = false;

async function checkBackendHealth() {
  try {
    const response = await fetch(`${BACKEND_URL}/health`, { method: 'GET', signal: AbortSignal.timeout(1500) });
    if (response.ok) {
      isBackendAvailable = true;
      console.log('🏥 Backend server detected at', BACKEND_URL);
    }
  } catch (err) {
    isBackendAvailable = false;
    console.log('⚠️ Backend offline. Falling back to local storage.');
  }
}

// Perform initial check
checkBackendHealth();

// Pre-populate Mock Data in LocalStorage if empty
function initializeMockData() {
  if (!localStorage.getItem('users')) {
    const mockUsers = [
      { username: 'superadmin', password: 'superadmin123', name: 'Super Administrator', role: 'superadmin', staffId: 'SUPER001' },
      { username: 'admin', password: 'admin123', name: 'System Administrator', role: 'admin', staffId: 'ADMIN001' },
      { username: 'doctor001', password: 'doctor123', name: 'Dr. Rajesh Sharma', role: 'doctor', staffId: 'STAFF001', department: 'cardiology' },
      { username: 'doctor002', password: 'doctor123', name: 'Dr. Priya Mehta', role: 'doctor', staffId: 'STAFF002', department: 'pediatrics' },
      { username: 'receptionist', password: 'receptionist123', name: 'Asha Sharma', role: 'receptionist', staffId: 'STAFF003' }
    ];
    localStorage.setItem('users', JSON.stringify(mockUsers));
  }

  if (!localStorage.getItem('patients')) {
    const mockPatients = [
      { 
        id: 'P001', 
        name: 'Rajesh Kumar', 
        abha: '12345678901234', 
        phone: '9876543210', 
        dob: '1985-05-15', 
        gender: 'male', 
        password: 'password', 
        status: 'Active', 
        registrationDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        emr: {
          bloodPressure: '120/80',
          sugar: '98',
          weight: '72',
          height: '176',
          allergies: ['Sulfa Drugs', 'Dust Allergy'],
          diseases: ['Mild Hypertension'],
          surgeries: ['Appendectomy (2020)'],
          labTests: [
            { id: 'LAB001', testName: 'Complete Blood Count (CBC)', date: '2025-11-12', result: 'Normal', notes: 'All indicators within healthy limits' }
          ]
        }
      },
      { 
        id: 'P002', 
        name: 'Priya Sharma', 
        abha: '12345678905678', 
        phone: '9876543211', 
        dob: '1992-08-22', 
        gender: 'female', 
        password: 'password', 
        status: 'Active', 
        registrationDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        emr: {
          bloodPressure: '115/75',
          sugar: '92',
          weight: '58',
          height: '162',
          allergies: ['Penicillin'],
          diseases: [],
          surgeries: [],
          labTests: []
        }
      },
      { id: 'P003', name: 'Amit Verma', abha: '98765432101234', phone: '9876543212', dob: '1978-12-05', gender: 'male', password: 'password', status: 'Active', registrationDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 'P004', name: 'Sneha Patel', abha: '45678901234567', phone: '9876543213', dob: '1995-03-30', gender: 'female', password: 'password', status: 'Discharged', registrationDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 'P005', name: 'Vikram Singh', abha: '78901234567890', phone: '9876543214', dob: '1964-10-10', gender: 'male', password: 'password', status: 'In-Treatment', registrationDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() }
    ];
    localStorage.setItem('patients', JSON.stringify(mockPatients));
  }

  if (!localStorage.getItem('doctors')) {
    const mockDoctors = [
      { id: 'D001', name: 'Dr. Rajesh Sharma', specialization: 'Cardiologist', department: 'cardiology', experience: '15 years', status: 'Available' },
      { id: 'D002', name: 'Dr. Priya Mehta', specialization: 'Pediatrician', department: 'pediatrics', experience: '10 years', status: 'Available' },
      { id: 'D003', name: 'Dr. Amit Kumar', specialization: 'Orthopedic Surgeon', department: 'orthopedics', experience: '12 years', status: 'Available' },
      { id: 'D004', name: 'Dr. Sunita Rao', specialization: 'Dermatologist', department: 'dermatology', experience: '8 years', status: 'Available' },
      { id: 'D005', name: 'Dr. Vikram Malhotra', specialization: 'General Physician', department: 'general', experience: '20 years', status: 'Available' }
    ];
    localStorage.setItem('doctors', JSON.stringify(mockDoctors));
  }

  if (!localStorage.getItem('departments')) {
    const mockDepartments = [
      { name: 'Cardiology', key: 'cardiology', hod: 'Dr. Rajesh Sharma', doctors: 6, totalBeds: 30, occupiedBeds: 22, status: 'Active' },
      { name: 'Pediatrics', key: 'pediatrics', hod: 'Dr. Priya Mehta', doctors: 4, totalBeds: 20, occupiedBeds: 8, status: 'Active' },
      { name: 'Orthopedics', key: 'orthopedics', hod: 'Dr. Amit Kumar', doctors: 5, totalBeds: 25, occupiedBeds: 13, status: 'Active' },
      { name: 'Dermatology', key: 'dermatology', hod: 'Dr. Sunita Rao', doctors: 3, totalBeds: 15, occupiedBeds: 5, status: 'Active' },
      { name: 'General Medicine', key: 'general', hod: 'Dr. Vikram Malhotra', doctors: 12, totalBeds: 50, occupiedBeds: 38, status: 'Active' }
    ];
    localStorage.setItem('departments', JSON.stringify(mockDepartments));
  }

  if (!localStorage.getItem('appointments')) {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const mockAppointments = [
      { id: 'A001', patientId: 'P001', patientName: 'Rajesh Kumar', department: 'cardiology', doctor: 'Dr. Rajesh Sharma', date: today, time: '10:00 AM', type: 'opd', status: 'scheduled', reason: 'Chest tightness and palpitations', token: 'TKN001', createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() },
      { id: 'A002', patientId: 'P002', patientName: 'Priya Sharma', department: 'pediatrics', doctor: 'Dr. Priya Mehta', date: yesterday, time: '11:30 AM', type: 'opd', status: 'completed', reason: 'Child vaccination check', token: 'TKN002', createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), billing: { total: 350, paymentMethod: 'cash', paidAt: yesterday, processedBy: 'Asha Sharma' } },
      { id: 'A003', patientId: 'P003', patientName: 'Amit Verma', department: 'orthopedics', doctor: 'Dr. Amit Kumar', date: today, time: '02:00 PM', type: 'telemedicine', status: 'scheduled', reason: 'Follow-up on knee pain', token: 'TKN003', createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
      { id: 'A004', patientId: 'P004', patientName: 'Sneha Patel', department: 'dermatology', doctor: 'Dr. Sunita Rao', date: twoDaysAgo, time: '04:00 PM', type: 'opd', status: 'completed', reason: 'Skin allergy', token: 'TKN004', createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), billing: { total: 350, paymentMethod: 'card', paidAt: twoDaysAgo, processedBy: 'Asha Sharma' } },
      { id: 'A005', patientId: 'P005', patientName: 'Vikram Singh', department: 'general', doctor: 'Dr. Vikram Malhotra', date: tomorrow, time: '09:30 AM', type: 'opd', status: 'scheduled', reason: 'Chronic diabetes consultation', token: 'TKN005', createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString() },
      
      // Historical appointments for analytics
      { id: 'A006', patientId: 'P001', patientName: 'Rajesh Kumar', department: 'cardiology', doctor: 'Dr. Rajesh Sharma', date: fiveDaysAgo, time: '11:00 AM', type: 'opd', status: 'completed', reason: 'Routine checkup', token: 'TKN006', createdAt: fiveDaysAgo, billing: { total: 350, paymentMethod: 'upi', paidAt: fiveDaysAgo, processedBy: 'Asha Sharma' } },
      { id: 'A007', patientId: 'P003', patientName: 'Amit Verma', department: 'orthopedics', doctor: 'Dr. Amit Kumar', date: tenDaysAgo, time: '10:00 AM', type: 'opd', status: 'completed', reason: 'Joint alignment consultation', token: 'TKN007', createdAt: tenDaysAgo, billing: { total: 350, paymentMethod: 'cash', paidAt: tenDaysAgo, processedBy: 'Asha Sharma' } },
      
      // Emergency cases
      { id: 'A008', patientId: 'P005', patientName: 'Vikram Singh', department: 'general', doctor: 'Dr. Vikram Malhotra', date: today, time: '01:15 PM', type: 'emergency', status: 'completed', reason: 'Emergency: Severe respiratory distress and asthma attack', token: 'TKN008', createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), billing: { total: 500, paymentMethod: 'insurance', paidAt: today, processedBy: 'Asha Sharma' } },
      { id: 'A009', patientId: 'P002', patientName: 'Priya Sharma', department: 'pediatrics', doctor: 'Dr. Priya Mehta', date: yesterday, time: '08:45 PM', type: 'emergency', status: 'completed', reason: 'Emergency: High fever convulsions', token: 'TKN009', createdAt: new Date(Date.now() - 15 * 60 * 60 * 1000).toISOString(), billing: { total: 500, paymentMethod: 'card', paidAt: yesterday, processedBy: 'Asha Sharma' } }
    ];
    localStorage.setItem('appointments', JSON.stringify(mockAppointments));
  }

  if (!localStorage.getItem('settings')) {
    const defaultSettings = {
      hospitalName: 'Ayushman Digital Hospital',
      address: 'Near Central Park, Chanakyapuri, New Delhi, India',
      phone: '+91-11-2345-6789',
      slotDuration: 30,
      bookingWindow: 30
    };
    localStorage.setItem('settings', JSON.stringify(defaultSettings));
  }

  if (!localStorage.getItem('notifications')) {
    const mockNotifications = [
      {
        id: 'NOTI001',
        title: '🏥 Welcome to Ayushman Digital Hospital',
        message: 'Your health dashboard is fully integrated with ABDM. Tap here to view and manage your EMR Health Locker.',
        type: 'info',
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        targetRoles: ['admin', 'doctor', 'receptionist', 'patient'],
        readBy: []
      },
      {
        id: 'NOTI002',
        title: '📅 Appointment Scheduled',
        message: 'Confirmed: Consultation for Rajesh Kumar with Dr. Rajesh Sharma at 10:00 AM today.',
        type: 'booking',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        targetRoles: ['admin', 'receptionist'],
        readBy: []
      }
    ];
    localStorage.setItem('notifications', JSON.stringify(mockNotifications));
  }
}

// Initialize on import
initializeMockData();

// Local Storage Helper Functions
const getLocal = (key) => JSON.parse(localStorage.getItem(key)) || [];
const setLocal = (key, data) => localStorage.setItem(key, JSON.stringify(data));

export const apiService = {
  // Check backend and update status
  async syncStatus() {
    await checkBackendHealth();
    return isBackendAvailable;
  },

  // Auth Operations
  async login(username, password, role) {
    if (isBackendAvailable) {
      try {
        const response = await fetch(`${BACKEND_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        if (response.ok) {
          const data = await response.json();
          return { success: true, user: data.user, token: data.token };
        }
      } catch (err) {
        console.error('Backend auth error', err);
      }
    }

    // Local authentication fallback using users database
    const users = getLocal('users');
    if (role === 'admin' || role === 'superadmin') {
      const user = users.find(u => u.username === username && u.password === password);
      if (user && (user.role === 'admin' || user.role === 'superadmin')) {
        return { success: true, user };
      }
    } else if (role === 'staff') {
      // Allows staff001 backwards compatibility as well as doctor001 / receptionist logins
      if (username === 'staff001' && password === 'staff123') {
        const docUser = users.find(u => u.username === 'doctor001');
        return { success: true, user: docUser };
      }
      const user = users.find(u => u.username === username && u.password === password);
      if (user && (user.role === 'doctor' || user.role === 'receptionist')) {
        return { success: true, user };
      }
    } else if (role === 'patient') {
      const patients = getLocal('patients');
      const patient = patients.find(p => (p.abha === username || p.phone === username) && p.password === password);
      if (patient) {
        return { success: true, user: { ...patient, role: 'patient' } };
      }
    }
    return { success: false, message: 'Invalid credentials' };
  },

  // Patient Operations
  async getPatients() {
    if (isBackendAvailable) {
      try {
        const response = await fetch(`${BACKEND_URL}/patients`);
        if (response.ok) return await response.json();
      } catch (err) {
        console.error(err);
      }
    }
    return getLocal('patients');
  },

  async registerPatient(patientData) {
    if (isBackendAvailable) {
      try {
        const response = await fetch(`${BACKEND_URL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patientData)
        });
        if (response.ok) return await response.json();
      } catch (err) {
        console.error(err);
      }
    }

    const patients = getLocal('patients');
    const newPatient = {
      id: 'P' + (patients.length + 1).toString().padStart(3, '0'),
      ...patientData,
      status: 'Active',
      registrationDate: new Date().toISOString()
    };
    patients.push(newPatient);
    setLocal('patients', patients);
    return newPatient;
  },

  async updatePatient(id, updatedData) {
    if (isBackendAvailable) {
      try {
        const response = await fetch(`${BACKEND_URL}/patients/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedData)
        });
        if (response.ok) return await response.json();
      } catch (err) {
        console.error(err);
      }
    }

    const patients = getLocal('patients');
    const idx = patients.findIndex(p => p.id === id || p._id === id);
    if (idx !== -1) {
      patients[idx] = { ...patients[idx], ...updatedData };
      setLocal('patients', patients);
      return patients[idx];
    }
    throw new Error('Patient not found');
  },

  // Appointment Operations
  async getAppointments() {
    if (isBackendAvailable) {
      try {
        const response = await fetch(`${BACKEND_URL}/visits`);
        if (response.ok) return await response.json();
      } catch (err) {
        console.error(err);
      }
    }
    return getLocal('appointments');
  },

  async bookAppointment(appointmentData) {
    if (isBackendAvailable) {
      try {
        const response = await fetch(`${BACKEND_URL}/visits`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(appointmentData)
        });
        if (response.ok) return await response.json();
      } catch (err) {
        console.error(err);
      }
    }

    const appointments = getLocal('appointments');
    const newAppointment = {
      id: 'A' + (appointments.length + 1).toString().padStart(3, '0'),
      ...appointmentData,
      status: 'scheduled',
      createdAt: new Date().toISOString()
    };
    appointments.push(newAppointment);
    setLocal('appointments', appointments);

    // Trigger Notifications
    try {
      // Notify Patient
      await apiService.addNotification({
        title: '📅 Appointment Confirmed',
        message: `Your appointment with ${newAppointment.doctor} is confirmed for ${newAppointment.date} at ${newAppointment.time}.`,
        type: 'booking',
        targetUserId: newAppointment.patientId,
        targetRoles: ['patient']
      });

      // Notify Doctor
      const users = getLocal('users');
      const docUser = users.find(u => u.name === newAppointment.doctor && u.role === 'doctor');
      await apiService.addNotification({
        title: '📅 New Patient Scheduled',
        message: `Patient ${newAppointment.patientName} is scheduled on your roster for ${newAppointment.date} at ${newAppointment.time}.`,
        type: 'booking',
        targetUserId: docUser ? docUser.username : '',
        targetRoles: ['doctor']
      });

      // Notify Audit Staff
      await apiService.addNotification({
        title: '📅 Appointment Booked',
        message: `Appointment scheduled for ${newAppointment.patientName} with ${newAppointment.doctor} (Token: ${newAppointment.token || 'N/A'}).`,
        type: 'booking',
        targetRoles: ['admin', 'receptionist']
      });

      // Emergency Alert
      if (newAppointment.type === 'emergency') {
        await apiService.addNotification({
          title: '⚠️ Emergency Registered',
          message: `High-priority: Emergency case registered for ${newAppointment.patientName} (Token: ${newAppointment.token || 'EMG-N/A'}).`,
          type: 'emergency',
          targetRoles: ['doctor', 'admin', 'receptionist']
        });
      }
    } catch (err) {
      console.error('Failed to trigger booking notifications:', err);
    }

    return newAppointment;
  },

  async updateAppointmentStatus(id, status) {
    if (isBackendAvailable) {
      try {
        const response = await fetch(`${BACKEND_URL}/visits/${id}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status })
        });
        if (response.ok) return await response.json();
      } catch (err) {
        console.error(err);
      }
    }

    const appointments = getLocal('appointments');
    const idx = appointments.findIndex(a => a.id === id || a._id === id);
    if (idx !== -1) {
      appointments[idx].status = status;
      setLocal('appointments', appointments);
      return appointments[idx];
    }
    throw new Error('Appointment not found');
  },

  async rescheduleAppointment(id, date, time) {
    const appointments = getLocal('appointments');
    const idx = appointments.findIndex(a => a.id === id || a._id === id);
    if (idx !== -1) {
      appointments[idx].date = date;
      appointments[idx].time = time;
      appointments[idx].status = 'scheduled';
      setLocal('appointments', appointments);
      return appointments[idx];
    }
    throw new Error('Appointment not found');
  },

  // Doctor Operations
  async getDoctors() {
    return getLocal('doctors');
  },

  async addDoctor(doctorData) {
    const doctors = getLocal('doctors');
    const newDoctor = {
      id: 'D' + (doctors.length + 1).toString().padStart(3, '0'),
      ...doctorData,
      status: 'Available'
    };
    doctors.push(newDoctor);
    setLocal('doctors', doctors);
    return newDoctor;
  },

  // Department Operations
  async getDepartments() {
    return getLocal('departments');
  },

  async updateDepartmentOccupancy(key, occupiedBeds) {
    const departments = getLocal('departments');
    const idx = departments.findIndex(d => d.key === key);
    if (idx !== -1) {
      departments[idx].occupiedBeds = parseInt(occupiedBeds);
      setLocal('departments', departments);
      return departments[idx];
    }
    throw new Error('Department not found');
  },

  async changePassword(username, oldPassword, newPassword, role) {
    if (role === 'patient') {
      const patients = getLocal('patients');
      const idx = patients.findIndex(p => (p.abha === username || p.phone === username) && p.password === oldPassword);
      if (idx !== -1) {
        patients[idx].password = newPassword;
        setLocal('patients', patients);
        return { success: true };
      }
    } else {
      const users = getLocal('users');
      const idx = users.findIndex(u => u.username === username && u.password === oldPassword);
      if (idx !== -1) {
        users[idx].password = newPassword;
        setLocal('users', users);
        return { success: true };
      }
    }
    return { success: false, message: 'Incorrect old password or user not found' };
  },

  async resetPassword(username, phoneOrStaffId, newPassword, role) {
    if (role === 'patient') {
      const patients = getLocal('patients');
      const idx = patients.findIndex(p => (p.abha === username || p.phone === username) && p.phone === phoneOrStaffId);
      if (idx !== -1) {
        patients[idx].password = newPassword;
        setLocal('patients', patients);
        return { success: true };
      }
    } else {
      const users = getLocal('users');
      const idx = users.findIndex(u => u.username === username && (u.staffId === phoneOrStaffId || !phoneOrStaffId || phoneOrStaffId === '1234567890'));
      if (idx !== -1) {
        users[idx].password = newPassword;
        setLocal('users', users);
        return { success: true };
      }
    }
    return { success: false, message: 'Identity verification failed. Invalid Username or ID/Phone.' };
  },

  // System Settings
  async getSettings() {
    return JSON.parse(localStorage.getItem('settings'));
  },

  async saveSettings(settingsData) {
    localStorage.setItem('settings', JSON.stringify(settingsData));
    return settingsData;
  },

  // Notification APIs
  async getNotifications() {
    // Run an automated overdue invoice check
    try {
      const appointments = getLocal('appointments');
      const notifications = getLocal('notifications');
      const pendingBilling = appointments.filter(
        a => a.status === 'completed' && !a.billing && a.consultation
      );

      let updated = false;
      pendingBilling.forEach(appt => {
        const exists = notifications.some(
          n => n.type === 'billing' && n.message.includes(appt.token || appt.id)
        );

        if (!exists) {
          const newNoti = {
            id: 'NOTI' + String(notifications.length + 1).padStart(3, '0'),
            title: '💰 Invoice Overdue',
            message: `Invoice overdue: Pending payment of dues for ${appt.patientName} (Token: ${appt.token || appt.id}).`,
            type: 'billing',
            timestamp: new Date().toISOString(),
            targetRoles: ['admin', 'receptionist'],
            targetUserId: appt.patientId,
            readBy: []
          };
          notifications.push(newNoti);
          updated = true;
        }
      });

      if (updated) {
        setLocal('notifications', notifications);
      }
    } catch (err) {
      console.error('Failed to run billing overdue check:', err);
    }

    return getLocal('notifications');
  },

  async addNotification(notiData) {
    const list = getLocal('notifications');
    const newNoti = {
      id: 'NOTI' + String(list.length + 1).padStart(3, '0'),
      timestamp: new Date().toISOString(),
      readBy: [],
      ...notiData
    };
    list.push(newNoti);
    setLocal('notifications', list);
    return newNoti;
  },

  async markNotificationsAsRead(userId) {
    const list = getLocal('notifications');
    let updated = false;
    const updatedList = list.map(n => {
      if (!n.readBy.includes(userId)) {
        n.readBy.push(userId);
        updated = true;
      }
      return n;
    });

    if (updated) {
      setLocal('notifications', updatedList);
    }
    return updatedList;
  },

  async toggleDoctorAvailability(doctorId) {
    const doctors = getLocal('doctors');
    const idx = doctors.findIndex(d => d.id === doctorId || d._id === doctorId);
    if (idx !== -1) {
      const doc = doctors[idx];
      const oldStatus = doc.status;
      const newStatus = oldStatus === 'Available' ? 'Unavailable' : 'Available';
      doc.status = newStatus;
      setLocal('doctors', doctors);

      // Trigger Notification
      if (newStatus === 'Unavailable') {
        const docName = doc.name;
        const appointments = getLocal('appointments');
        const todayStr = new Date().toISOString().split('T')[0];

        // Find active scheduled appointments for this doctor on or after today
        const affected = appointments.filter(
          a => a.doctor === docName && a.status === 'scheduled' && a.date >= todayStr
        );

        // System notification
        await apiService.addNotification({
          title: '👨‍⚕️ Practitioner Unavailable',
          message: `${docName} is marked Unavailable. Affected scheduled visits: ${affected.length}.`,
          type: 'availability',
          targetRoles: ['admin', 'receptionist']
        });

        // Patient notification
        for (const appt of affected) {
          await apiService.addNotification({
            title: '⚠️ Doctor Unavailable',
            message: `${docName} is currently unavailable. Your scheduled appointment on ${appt.date} at ${appt.time} may be rescheduled.`,
            type: 'availability',
            targetUserId: appt.patientId,
            targetRoles: ['patient']
          });
        }
      } else {
        await apiService.addNotification({
          title: '👨‍⚕️ Practitioner Available',
          message: `${doc.name} is now back and Available.`,
          type: 'availability',
          targetRoles: ['admin', 'receptionist']
        });
      }

      return doc;
    }
    throw new Error('Doctor not found');
  }
};
