import appointmentRepository from '../repositories/appointmentRepository.js';
import patientRepository from '../repositories/patientRepository.js';
import Prescription from '../models/Prescription.js';
import Billing from '../models/Billing.js';
import auditLogService from './auditLogService.js';
import notificationService from './notificationService.js';
import queueService from './queueService.js';
import queueRepository from '../repositories/queueRepository.js';

class AppointmentService {
  async getCombinedAppointmentsAndVisits() {
    return await appointmentRepository.findAllCombined();
  }

  async getVisits() {
    return await appointmentRepository.findAllVisits();
  }

  async bookAppointment(appointmentData, requestedBy = 'patient', role = 'patient') {
    const appointments = await appointmentRepository.findAllAppointments();
    const newId = 'A' + (appointments.length + 1).toString().padStart(3, '0');

    const appointment = await appointmentRepository.createAppointment({
      ...appointmentData,
      id: newId,
      status: 'scheduled'
    });

    // Notifications
    await notificationService.createNotification({
      title: '📅 Appointment Confirmed',
      message: `Your appointment with ${appointment.doctor} is confirmed for ${appointment.date} at ${appointment.time}.`,
      type: 'booking',
      targetUserId: appointment.patientId,
      targetRoles: ['patient']
    });

    await notificationService.createNotification({
      title: '📅 Appointment Booked',
      message: `Appointment scheduled for ${appointment.patientName} with ${appointment.doctor}.`,
      type: 'booking',
      targetRoles: ['admin', 'receptionist']
    });

    // Emergency Alert if applicable
    if (appointment.type === 'emergency') {
      await notificationService.createNotification({
        title: '⚠️ Emergency Registered',
        message: `High-priority: Emergency case registered for ${appointment.patientName}.`,
        type: 'emergency',
        targetRoles: ['doctor', 'admin', 'receptionist']
      });
    }

    return appointment;
  }

  async updateAppointmentStatus(id, status, requestedBy = 'System', role = 'system') {
    const updated = await appointmentRepository.updateAppointmentStatus(id, status);
    if (!updated) throw new Error('Appointment/Visit not found');

    if (status === 'cancelled') {
      await auditLogService.log(
        requestedBy,
        role,
        'Appointment Cancelled',
        updated.id.startsWith('A') ? 'Appointment' : 'Visit',
        id
      );
    }

    return updated;
  }

  async rescheduleAppointment(id, date, time) {
    const apt = await appointmentRepository.findAppointmentById(id);
    if (!apt) throw new Error('Appointment not found');

    apt.date = date;
    apt.time = time;
    apt.status = 'scheduled';
    return await apt.save();
  }

  async checkInPatient(patientId, doctorName, department, type, requestedBy = 'staff001', role = 'receptionist') {
    const patient = await patientRepository.findById(patientId);
    if (!patient) throw new Error('Patient not found');

    const visits = await appointmentRepository.findAllVisits();
    const count = visits.length;
    const nextId = 'V' + (count + 1).toString().padStart(4, '0');
    const token = 'TKN' + (count + 1).toString().padStart(3, '0');

    const visit = await appointmentRepository.createVisit({
      id: nextId,
      patientId,
      patientName: patient.name,
      token,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      type,
      department,
      doctor: doctorName,
      status: 'scheduled',
      currentStep: 'vitals'
    });

    // Add to active clinic queue
    await queueService.addToQueue(visit.id, patientId, department, token);

    return visit;
  }

  async recordVitals(tokenOrId, vitalsData, requestedBy = 'receptionist', role = 'receptionist') {
    const visit = await appointmentRepository.findVisitById(tokenOrId);
    if (!visit) throw new Error('Visit not found');

    const vitalsRecord = {
      ...vitalsData,
      recordedBy: requestedBy,
      recordedAt: new Date()
    };

    visit.vitals = vitalsRecord;
    visit.currentStep = 'consultation';
    await visit.save();

    // Push to patient EMR
    await patientRepository.addVital(visit.patientId, {
      temperature: vitalsData.temperature,
      pulse: vitalsData.pulse,
      bloodPressure: vitalsData.bloodPressure,
      notes: vitalsData.notes,
      recordedBy: requestedBy,
      recordedAt: new Date()
    });

    // Advance queue status for this visit to Consultation stage
    await queueRepository.updateStage(visit.id, 'Consultation');

    return visit;
  }

  async recordConsultation(tokenOrId, consultationData, requestedBy = 'doctor', role = 'doctor') {
    const visit = await appointmentRepository.findVisitById(tokenOrId);
    if (!visit) throw new Error('Visit not found');

    const consultationRecord = {
      ...consultationData,
      consultedBy: requestedBy,
      consultedAt: new Date()
    };

    visit.consultation = consultationRecord;
    visit.currentStep = 'billing';
    await visit.save();

    // Push to patient EMR
    await patientRepository.addDiagnosis(visit.patientId, {
      disease: consultationData.diagnosis,
      diagnosedBy: requestedBy,
      diagnosedAt: new Date()
    });

    return visit;
  }

  async savePrescription(tokenOrId, medications, requestedBy = 'doctor', role = 'doctor') {
    const visit = await appointmentRepository.findVisitById(tokenOrId);
    if (!visit) throw new Error('Visit not found');

    const prescription = await Prescription.create({
      visitId: visit.id,
      patientId: visit.patientId,
      patientName: visit.patientName,
      doctorName: visit.doctor,
      medications,
      prescribedAt: new Date()
    });

    visit.prescription = {
      medications,
      prescribedBy: requestedBy,
      prescribedAt: new Date()
    };
    await visit.save();

    return prescription;
  }
}

export default new AppointmentService();
