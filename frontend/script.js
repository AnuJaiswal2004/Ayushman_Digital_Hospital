// Data Storage
let currentUser = null;
let patients = JSON.parse(localStorage.getItem('patients')) || [];
let appointments = JSON.parse(localStorage.getItem('appointments')) || [];

// Page Navigation
function showPage(pageId) {
    document.querySelectorAll('.landing, .auth-container, .dashboard').forEach(el => {
        el.classList.add('hidden');
    });
    document.getElementById(pageId).classList.remove('hidden');
}

// Patient Registration
function registerPatient() {
    const name = document.getElementById('regName').value;
    const abha = document.getElementById('regAbha').value;
    const phone = document.getElementById('regPhone').value;
    const dob = document.getElementById('regDob').value;
    const gender = document.getElementById('regGender').value;
    const password = document.getElementById('regPassword').value;

    if (!name || !abha || !phone || !dob || !gender || !password) {
        alert('Please fill all fields');
        return;
    }

    // Validate ABHA ID (14 digits)
    if (abha.length !== 14 || isNaN(abha)) {
        alert('ABHA ID must be 14 digits');
        return;
    }

    // Validate phone number (10 digits)
    if (phone.length !== 10 || isNaN(phone)) {
        alert('Phone number must be 10 digits');
        return;
    }

    // Check if ABHA ID or phone already exists
    const existingPatient = patients.find(p => p.abha === abha || p.phone === phone);
    if (existingPatient) {
        alert('Patient with this ABHA ID or phone number already exists');
        return;
    }

    const patient = {
        id: 'P' + (patients.length + 1).toString().padStart(3, '0'),
        name,
        abha,
        phone,
        dob,
        gender,
        password,
        registrationDate: new Date().toISOString()
    };

    patients.push(patient);
    localStorage.setItem('patients', JSON.stringify(patients));

    alert('Registration successful! Please login.');
    
    // Clear form
    document.getElementById('regName').value = '';
    document.getElementById('regAbha').value = '';
    document.getElementById('regPhone').value = '';
    document.getElementById('regDob').value = '';
    document.getElementById('regGender').value = '';
    document.getElementById('regPassword').value = '';
    
    showPage('patientAuth');
}

// Patient Login
function patientLogin() {
    const username = document.getElementById('patientUsername').value;
    const password = document.getElementById('patientPassword').value;

    if (!username || !password) {
        alert('Please enter both username and password');
        return;
    }

    const patient = patients.find(p => 
        (p.abha === username || p.phone === username) && p.password === password
    );

    if (patient) {
        currentUser = patient;
        loadPatientDashboard();
        showPage('patientDashboard');
    } else {
        alert('Invalid credentials. Please try again or register.');
    }
}

// Admin Login
function adminLogin() {
    const username = document.getElementById('adminUsername').value;
    const password = document.getElementById('adminPassword').value;

    if (username === 'admin' && password === 'admin123') {
        currentUser = { role: 'admin', name: 'Administrator' };
        loadAdminDashboard();
        showPage('adminDashboard');
    } else {
        alert('Invalid admin credentials');
    }
}

// Staff Login
function staffLogin() {
    const username = document.getElementById('staffUsername').value;
    const password = document.getElementById('staffPassword').value;

    if (username === 'staff001' && password === 'staff123') {
        currentUser = { 
            role: 'staff', 
            name: 'Dr. Rajesh Sharma',
            staffId: 'STAFF001',
            department: 'Cardiology'
        };
        loadStaffDashboard();
        showPage('staffDashboard');
    } else {
        alert('Invalid staff credentials');
    }
}

// Load Patient Dashboard
function loadPatientDashboard() {
    document.getElementById('patientName').textContent = `Welcome, ${currentUser.name}`;
    
    // Load profile data
    document.getElementById('profileName').value = currentUser.name;
    document.getElementById('profileAbha').value = currentUser.abha;
    document.getElementById('profilePhone').value = currentUser.phone;
    document.getElementById('profileDob').value = currentUser.dob;
    document.getElementById('profileGender').value = currentUser.gender;

    // Update stats
    const userAppointments = appointments.filter(a => a.patientId === currentUser.id);
    const upcomingAppts = userAppointments.filter(a => a.status === 'scheduled');
    const completedAppts = userAppointments.filter(a => a.status === 'completed');
    
    document.getElementById('upcomingCount').textContent = upcomingAppts.length;
    document.getElementById('completedCount').textContent = completedAppts.length;
    document.getElementById('prescriptionCount').textContent = '0';
    document.getElementById('labReportCount').textContent = '0';

    loadPatientAppointments();
}

// Load Patient Appointments
function loadPatientAppointments() {
    const userAppointments = appointments.filter(a => a.patientId === currentUser.id);
    const container = document.getElementById('appointmentsList');

    if (userAppointments.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--gray); padding: 2rem;">No appointments found. Book your first appointment!</p>';
        return;
    }

    container.innerHTML = userAppointments.map(apt => `
        <div class="appointment-card">
            <div class="appointment-header">
                <h4>${apt.department.charAt(0).toUpperCase() + apt.department.slice(1)}</h4>
                <span class="badge badge-${apt.status === 'scheduled' ? 'warning' : 'success'}">${apt.status.toUpperCase()}</span>
            </div>
            <div class="appointment-details">
                <div class="detail-item">
                    <span class="detail-label">Doctor</span>
                    <span class="detail-value">${apt.doctor}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Date</span>
                    <span class="detail-value">${new Date(apt.date).toLocaleDateString()}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Time</span>
                    <span class="detail-value">${apt.time}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Type</span>
                    <span class="detail-value">${apt.type === 'opd' ? 'OPD (In-Person)' : 'Telemedicine (Online)'}</span>
                </div>
            </div>
            ${apt.reason ? `<p style="margin-top: 1rem; color: var(--gray);"><strong>Reason:</strong> ${apt.reason}</p>` : ''}
        </div>
    `).join('');
}

// Confirm Appointment
function confirmAppointment() {
    const department = document.getElementById('bookDepartment').value;
    const doctor = document.getElementById('bookDoctor').value;
    const date = document.getElementById('bookDate').value;
    const time = document.getElementById('bookTime').value;
    const type = document.getElementById('bookType').value;
    const reason = document.getElementById('bookReason').value;

    if (!department || !doctor || !date || !time) {
        alert('Please fill all required fields');
        return;
    }

    // Validate date is not in the past
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
        alert('Cannot book appointments in the past');
        return;
    }

    const appointment = {
        id: 'A' + (appointments.length + 1).toString().padStart(3, '0'),
        patientId: currentUser.id,
        patientName: currentUser.name,
        department,
        doctor: document.getElementById('bookDoctor').options[document.getElementById('bookDoctor').selectedIndex].text,
        date,
        time,
        type,
        reason,
        status: 'scheduled',
        createdAt: new Date().toISOString()
    };

    appointments.push(appointment);
    localStorage.setItem('appointments', JSON.stringify(appointments));

    alert('Appointment booked successfully!');
    
    // Reset form
    document.getElementById('bookDepartment').value = '';
    document.getElementById('bookDoctor').value = '';
    document.getElementById('bookDate').value = '';
    document.getElementById('bookTime').value = '';
    document.getElementById('bookReason').value = '';

    // Reload dashboard
    loadPatientDashboard();
    showPatientSection('appointments');
}

// Load Admin Dashboard
function loadAdminDashboard() {
    // Update stats
    document.getElementById('totalPatientsCount').textContent = patients.length;
    
    // Count today's appointments
    const today = new Date().toISOString().split('T')[0];
    const todayAppts = appointments.filter(a => a.date === today);
    document.getElementById('todayAppointmentsCount').textContent = todayAppts.length;

    // Load recent patients
    const tbody = document.getElementById('recentPatients');
    const recentPatients = patients.slice(-5).reverse();
    
    if (recentPatients.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem;">No patients registered yet.</td></tr>';
    } else {
        tbody.innerHTML = recentPatients.map(p => {
            const regDate = new Date(p.registrationDate);
            const daysAgo = Math.floor((new Date() - regDate) / (1000 * 60 * 60 * 24));
            let dateStr = daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo} days ago`;
            
            return `
                <tr>
                    <td>${p.name}</td>
                    <td>${p.abha}</td>
                    <td>${p.phone}</td>
                    <td>${dateStr}</td>
                    <td><span class="badge badge-success">Active</span></td>
                </tr>
            `;
        }).join('');
    }

    // Load all patients
    const allPatientsTbody = document.getElementById('allPatientsList');
    if (allPatientsTbody) {
        if (patients.length === 0) {
            allPatientsTbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem;">No patients found.</td></tr>';
        } else {
            allPatientsTbody.innerHTML = patients.map((p, i) => {
                const regDate = new Date(p.registrationDate);
                const daysAgo = Math.floor((new Date() - regDate) / (1000 * 60 * 60 * 24));
                let dateStr = daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo} days ago`;
                
                return `
                    <tr>
                        <td>${p.id}</td>
                        <td>${p.name}</td>
                        <td>${p.abha}</td>
                        <td>${p.phone}</td>
                        <td>${dateStr}</td>
                        <td><span class="badge badge-success">Active</span></td>
                        <td class="action-btns">
                            <button class="btn-sm view" onclick="viewPatient('${p.id}')">View</button>
                            <button class="btn-sm edit">Edit</button>
                        </td>
                    </tr>
                `;
            }).join('');
        }
    }
}

// View Patient Details
function viewPatient(patientId) {
    const patient = patients.find(p => p.id === patientId);
    if (patient) {
        const patientAppts = appointments.filter(a => a.patientId === patientId);
        alert(`Patient Details:
Name: ${patient.name}
ABHA ID: ${patient.abha}
Phone: ${patient.phone}
Date of Birth: ${patient.dob}
Gender: ${patient.gender}
Total Appointments: ${patientAppts.length}
Registered: ${new Date(patient.registrationDate).toLocaleDateString()}`);
    }
}

// Patient Section Navigation
function showPatientSection(section) {
    // Update menu
    document.querySelectorAll('#patientDashboard .sidebar-menu li').forEach(li => {
        li.classList.remove('active');
    });
    event.target.classList.add('active');

    // Hide all sections
    document.querySelectorAll('#patientDashboard .section-content').forEach(sec => {
        sec.classList.add('hidden');
    });

    // Show selected section
    const sectionMap = {
        'overview': 'patientOverview',
        'appointments': 'patientAppointments',
        'bookAppointment': 'patientBookAppointment',
        'prescriptions': 'patientPrescriptions',
        'labReports': 'patientLabReports',
        'healthRecords': 'patientHealthRecords',
        'profile': 'patientProfile'
    };

    const titleMap = {
        'overview': 'Dashboard',
        'appointments': 'My Appointments',
        'bookAppointment': 'Book Appointment',
        'prescriptions': 'My Prescriptions',
        'labReports': 'Lab Reports',
        'healthRecords': 'Health Records',
        'profile': 'My Profile'
    };

    document.getElementById(sectionMap[section]).classList.remove('hidden');
    document.getElementById('patientSectionTitle').textContent = titleMap[section];
}

// Admin Section Navigation
function showAdminSection(section) {
    // Update menu
    document.querySelectorAll('#adminDashboard .sidebar-menu li').forEach(li => {
        li.classList.remove('active');
    });
    event.target.classList.add('active');

    // Hide all sections
    document.querySelectorAll('#adminDashboard .section-content').forEach(sec => {
        sec.classList.add('hidden');
    });

    // Show selected section
    const sectionMap = {
        'overview': 'adminOverview',
        'patients': 'adminPatients',
        'appointments': 'adminAppointments',
        'doctors': 'adminDoctors',
        'departments': 'adminDepartments',
        'analytics': 'adminAnalytics',
        'settings': 'adminSettings'
    };

    const titleMap = {
        'overview': 'Admin Dashboard',
        'patients': 'Patient Management',
        'appointments': 'Appointment Management',
        'doctors': 'Doctor Management',
        'departments': 'Department Management',
        'analytics': 'Analytics & Reports',
        'settings': 'System Settings'
    };

    document.getElementById(sectionMap[section]).classList.remove('hidden');
    document.getElementById('adminSectionTitle').textContent = titleMap[section];
}

// Logout
function logout() {
    currentUser = null;
    
    // Clear login forms
    document.getElementById('patientUsername').value = '';
    document.getElementById('patientPassword').value = '';
    document.getElementById('adminUsername').value = 'admin';
    document.getElementById('adminPassword').value = 'admin123';
    
    showPage('landingPage');
}

// Initialize on page load
window.onload = function() {
    // Set minimum date for appointments to today
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('bookDate');
    if (dateInput) {
        dateInput.setAttribute('min', today);
    }
};

// ===== STAFF PORTAL FUNCTIONS =====

// Load Staff Dashboard
function loadStaffDashboard() {
    document.getElementById('staffName').textContent = currentUser.name;
    // Load today's queue and stats
    updateStaffStats();
}

// Update Staff Statistics
function updateStaffStats() {
    const todayVisits = appointments.filter(a => a.date === new Date().toISOString().split('T')[0]);
    document.getElementById('todayPatientsCount').textContent = todayVisits.length;
    document.getElementById('waitingPatientsCount').textContent = todayVisits.filter(a => a.status === 'scheduled').length;
    document.getElementById('completedTodayCount').textContent = todayVisits.filter(a => a.status === 'completed').length;
}

// Search Patient
function searchPatient() {
    const searchTerm = document.getElementById('searchPatient').value.trim();
    
    if (!searchTerm) {
        alert('Please enter ABHA ID, phone, or token number');
        return;
    }

    const patient = patients.find(p => 
        p.abha === searchTerm || 
        p.phone === searchTerm || 
        (appointments.find(a => a.token === searchTerm && a.patientId === p.id))
    );

    if (patient) {
        document.getElementById('patientSearchResult').style.display = 'block';
        document.getElementById('foundPatientName').textContent = patient.name;
        document.getElementById('foundPatientAbha').textContent = patient.abha;
        document.getElementById('foundPatientPhone').textContent = patient.phone;
        
        // Store found patient for visit creation
        window.foundPatient = patient;
    } else {
        alert('Patient not found. Please register the patient first.');
        document.getElementById('patientSearchResult').style.display = 'none';
    }
}

// Create Visit for Patient
function createVisit() {
    if (!window.foundPatient) {
        alert('Please search for a patient first');
        return;
    }

    const visit = {
        id: 'V' + (appointments.length + 1).toString().padStart(4, '0'),
        patientId: window.foundPatient.id,
        patientName: window.foundPatient.name,
        token: 'TKN' + String(appointments.length + 1).padStart(3, '0'),
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        type: 'opd',
        department: currentUser.department || 'General',
        doctor: currentUser.name,
        status: 'scheduled',
        currentStep: 'vitals',
        createdAt: new Date().toISOString()
    };

    appointments.push(visit);
    localStorage.setItem('appointments', JSON.stringify(appointments));

    alert(`Visit created successfully! Token: ${visit.token}`);
    
    // Reset search
    document.getElementById('searchPatient').value = '';
    document.getElementById('patientSearchResult').style.display = 'none';
    window.foundPatient = null;
    
    // Refresh stats
    updateStaffStats();
}

// Save Vitals
function saveVitals() {
    const token = document.getElementById('vitalPatientToken').value;
    const temp = document.getElementById('vitalTemp').value;
    const pulse = document.getElementById('vitalPulse').value;
    const bpSys = document.getElementById('vitalBpSys').value;
    const bpDia = document.getElementById('vitalBpDia').value;
    const notes = document.getElementById('vitalNotes').value;

    if (!token) {
        alert('Please select a patient');
        return;
    }

    if (!temp || !pulse || !bpSys || !bpDia) {
        alert('Please fill all vital signs');
        return;
    }

    const appointment = appointments.find(a => a.token === token);
    if (appointment) {
        appointment.vitals = {
            temperature: temp,
            pulse: pulse,
            bloodPressure: `${bpSys}/${bpDia}`,
            notes: notes,
            recordedBy: currentUser.name,
            recordedAt: new Date().toISOString()
        };
        appointment.currentStep = 'consultation';
        
        localStorage.setItem('appointments', JSON.stringify(appointments));
        
        alert('Vitals recorded successfully! Patient sent to consultation.');
        
        // Clear form
        document.getElementById('vitalTemp').value = '';
        document.getElementById('vitalPulse').value = '';
        document.getElementById('vitalBpSys').value = '';
        document.getElementById('vitalBpDia').value = '';
        document.getElementById('vitalNotes').value = '';
        document.getElementById('vitalPatientToken').value = '';
    }
}

// Show Prescription Form
function showPrescriptionForm() {
    showStaffSection('prescriptions');
    const token = document.getElementById('consultPatientToken').value;
    document.getElementById('prescPatientToken').value = token;
}

// Show Lab Order Form
function showLabOrderForm() {
    showStaffSection('labOrders');
    const token = document.getElementById('consultPatientToken').value;
    document.getElementById('labPatientToken').value = token;
}

// Save Consultation
function saveConsultation() {
    const token = document.getElementById('consultPatientToken').value;
    const complaint = document.getElementById('consultComplaint').value;
    const examination = document.getElementById('consultExamination').value;
    const diagnosis = document.getElementById('consultDiagnosis').value;
    const treatment = document.getElementById('consultTreatment').value;

    if (!token || !complaint || !diagnosis) {
        alert('Please fill required fields (complaint and diagnosis)');
        return;
    }

    const appointment = appointments.find(a => a.token === token);
    if (appointment) {
        appointment.consultation = {
            complaint,
            examination,
            diagnosis,
            treatment,
            consultedBy: currentUser.name,
            consultedAt: new Date().toISOString()
        };
        appointment.currentStep = 'billing';
        appointment.status = 'completed';
        
        localStorage.setItem('appointments', JSON.stringify(appointments));
        
        alert('Consultation completed successfully!');
        
        // Clear form
        document.getElementById('consultComplaint').value = '';
        document.getElementById('consultExamination').value = '';
        document.getElementById('consultDiagnosis').value = '';
        document.getElementById('consultTreatment').value = '';
        document.getElementById('consultPatientToken').value = '';
        document.getElementById('consultationForm').style.display = 'none';
    }
}

// Add Medication Row
function addMedicationRow() {
    const container = document.getElementById('medicationList');
    const newEntry = document.createElement('div');
    newEntry.className = 'medication-entry';
    newEntry.innerHTML = `
        <div class="form-row">
            <div class="form-group">
                <label>Medicine Name</label>
                <input type="text" class="medName" placeholder="e.g., Paracetamol">
            </div>
            <div class="form-group">
                <label>Dosage</label>
                <input type="text" class="medDosage" placeholder="e.g., 500mg">
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Frequency</label>
                <input type="text" class="medFrequency" placeholder="e.g., 3 times daily">
            </div>
            <div class="form-group">
                <label>Duration (days)</label>
                <input type="number" class="medDuration" placeholder="7">
            </div>
        </div>
    `;
    container.appendChild(newEntry);
}

// Save Prescription
function savePrescription() {
    const token = document.getElementById('prescPatientToken').value;
    
    if (!token) {
        alert('No patient selected');
        return;
    }

    const medications = [];
    const medEntries = document.querySelectorAll('.medication-entry');
    
    medEntries.forEach(entry => {
        const name = entry.querySelector('.medName').value;
        const dosage = entry.querySelector('.medDosage').value;
        const frequency = entry.querySelector('.medFrequency').value;
        const duration = entry.querySelector('.medDuration').value;
        
        if (name && dosage) {
            medications.push({ name, dosage, frequency, duration });
        }
    });

    if (medications.length === 0) {
        alert('Please add at least one medication');
        return;
    }

    const appointment = appointments.find(a => a.token === token);
    if (appointment) {
        appointment.prescription = {
            medications,
            prescribedBy: currentUser.name,
            prescribedAt: new Date().toISOString()
        };
        
        localStorage.setItem('appointments', JSON.stringify(appointments));
        
        alert('Prescription saved successfully!');
        
        // Clear form
        document.querySelectorAll('.medName, .medDosage, .medFrequency, .medDuration').forEach(input => {
            input.value = '';
        });
    }
}

// Submit Lab Order
function submitLabOrder() {
    const token = document.getElementById('labPatientToken').value;
    const instructions = document.getElementById('labInstructions').value;
    
    if (!token) {
        alert('No patient selected');
        return;
    }

    const selectedTests = [];
    document.querySelectorAll('.checkbox-group input[type="checkbox"]:checked').forEach(cb => {
        selectedTests.push(cb.value);
    });

    if (selectedTests.length === 0) {
        alert('Please select at least one test');
        return;
    }

    const appointment = appointments.find(a => a.token === token);
    if (appointment) {
        appointment.labOrders = {
            tests: selectedTests,
            instructions,
            orderedBy: currentUser.name,
            orderedAt: new Date().toISOString(),
            status: 'pending'
        };
        
        localStorage.setItem('appointments', JSON.stringify(appointments));
        
        alert('Lab order submitted successfully!');
        
        // Clear form
        document.querySelectorAll('.checkbox-group input[type="checkbox"]').forEach(cb => {
            cb.checked = false;
        });
        document.getElementById('labInstructions').value = '';
    }
}

// Process Payment
function processPayment() {
    const token = document.getElementById('billPatientToken').value;
    const method = document.getElementById('paymentMethod').value;
    
    if (!token) {
        alert('No patient selected');
        return;
    }

    const appointment = appointments.find(a => a.token === token);
    if (appointment) {
        appointment.billing = {
            totalAmount: 350,
            paymentMethod: method,
            paidAt: new Date().toISOString(),
            processedBy: currentUser.name,
            status: 'paid'
        };
        appointment.status = 'completed';
        appointment.currentStep = 'completed';
        
        localStorage.setItem('appointments', JSON.stringify(appointments));
        
        alert('Payment processed successfully! Bill generated.');
        
        document.getElementById('billPatientToken').value = '';
        document.getElementById('billingDetails').style.display = 'none';
    }
}

// Staff Section Navigation
function showStaffSection(section) {
    // Update menu
    document.querySelectorAll('#staffDashboard .sidebar-menu li').forEach(li => {
        li.classList.remove('active');
    });
    event.target.classList.add('active');

    // Hide all sections
    document.querySelectorAll('#staffDashboard .section-content').forEach(sec => {
        sec.classList.add('hidden');
    });

    // Show selected section
    const sectionMap = {
        'overview': 'staffOverview',
        'checkin': 'staffCheckin',
        'vitals': 'staffVitals',
        'consultation': 'staffConsultation',
        'prescriptions': 'staffPrescriptions',
        'labOrders': 'staffLabOrders',
        'billing': 'staffBilling',
        'queue': 'staffQueue'
    };

    const titleMap = {
        'overview': 'Provider Dashboard',
        'checkin': 'Patient Check-in',
        'vitals': 'Record Vitals',
        'consultation': 'Consultation',
        'prescriptions': 'Create Prescription',
        'labOrders': 'Lab Orders',
        'billing': 'Billing',
        'queue': 'Queue Status'
    };

    document.getElementById(sectionMap[section]).classList.remove('hidden');
    document.getElementById('staffSectionTitle').textContent = titleMap[section];
    
    // Load patient tokens for dropdowns
    if (section === 'vitals' || section === 'consultation' || section === 'billing') {
        loadPatientTokens();
    }
}

// Load Patient Tokens
function loadPatientTokens() {
    const todayVisits = appointments.filter(a => a.date === new Date().toISOString().split('T')[0]);
    
    const vitalSelect = document.getElementById('vitalPatientToken');
    const consultSelect = document.getElementById('consultPatientToken');
    const billSelect = document.getElementById('billPatientToken');
    
    if (vitalSelect) {
        vitalSelect.innerHTML = '<option value="">Select patient from queue</option>';
        todayVisits.forEach(v => {
            vitalSelect.innerHTML += `<option value="${v.token}">${v.token} - ${v.patientName}</option>`;
        });
    }
    
    if (consultSelect) {
        consultSelect.innerHTML = '<option value="">Select patient</option>';
        todayVisits.filter(v => v.vitals).forEach(v => {
            consultSelect.innerHTML += `<option value="${v.token}">${v.token} - ${v.patientName}</option>`;
        });
        
        consultSelect.addEventListener('change', function() {
            if (this.value) {
                const apt = appointments.find(a => a.token === this.value);
                if (apt && apt.vitals) {
                    document.getElementById('consultationForm').style.display = 'block';
                    document.getElementById('displayVitals').innerHTML = `
                        <p><strong>Temperature:</strong> ${apt.vitals.temperature}°F</p>
                        <p><strong>Pulse:</strong> ${apt.vitals.pulse} bpm</p>
                        <p><strong>Blood Pressure:</strong> ${apt.vitals.bloodPressure}</p>
                        ${apt.vitals.notes ? `<p><strong>Notes:</strong> ${apt.vitals.notes}</p>` : ''}
                    `;
                }
            } else {
                document.getElementById('consultationForm').style.display = 'none';
            }
        });
    }
    
    if (billSelect) {
        billSelect.innerHTML = '<option value="">Select patient</option>';
        todayVisits.filter(v => v.consultation).forEach(v => {
            billSelect.innerHTML += `<option value="${v.token}">${v.token} - ${v.patientName}</option>`;
        });
        
        billSelect.addEventListener('change', function() {
            if (this.value) {
                document.getElementById('billingDetails').style.display = 'block';
            } else {
                document.getElementById('billingDetails').style.display = 'none';
            }
        });
    }
}
