import doctorRepository from '../repositories/doctorRepository.js';
import auditLogService from './auditLogService.js';
import notificationService from './notificationService.js';
import Visit from '../models/Visit.js';

class DoctorService {
  async getAllDoctors() {
    return await doctorRepository.findAll();
  }

  async addDoctor(doctorData, requestedBy = 'admin', role = 'admin') {
    const doctors = await doctorRepository.findAll();
    const newId = 'D' + (doctors.length + 1).toString().padStart(3, '0');
    
    const doctor = await doctorRepository.create({
      ...doctorData,
      id: newId,
      status: 'Available'
    });

    // Write audit log
    await auditLogService.log(
      requestedBy,
      role,
      'Doctor Created',
      'Doctor',
      newId
    );

    return doctor;
  }

  async toggleDoctorAvailability(doctorId, requestedBy = 'admin', role = 'admin') {
    const doctor = await doctorRepository.findById(doctorId);
    if (!doctor) throw new Error('Doctor not found');

    const newStatus = doctor.status === 'Available' ? 'Unavailable' : 'Available';
    const updatedDoc = await doctorRepository.updateAvailability(doctorId, newStatus);

    // Write audit log
    await auditLogService.log(
      requestedBy,
      role,
      `Doctor Availability Changed to ${newStatus}`,
      'Doctor',
      doctorId
    );

    // Trigger Notification alerts (similar to apiService.toggleDoctorAvailability)
    if (newStatus === 'Unavailable') {
      const docName = doctor.name;
      const todayStr = new Date().toISOString().split('T')[0];

      // Find affected visits/appointments
      const affected = await Visit.find({
        doctor: docName,
        status: 'scheduled',
        date: { $gte: todayStr }
      });

      // System notification
      await notificationService.createNotification({
        title: '👨‍⚕️ Practitioner Unavailable',
        message: `${docName} is marked Unavailable. Affected scheduled visits: ${affected.length}.`,
        type: 'availability',
        targetRoles: ['admin', 'receptionist']
      });

      // Patient notifications
      for (const appt of affected) {
        await notificationService.createNotification({
          title: '⚠️ Doctor Unavailable',
          message: `${docName} is currently unavailable. Your scheduled appointment on ${appt.date} at ${appt.time} may be rescheduled.`,
          type: 'availability',
          targetUserId: appt.patientId,
          targetRoles: ['patient']
        });
      }
    } else {
      await notificationService.createNotification({
        title: '👨‍⚕️ Practitioner Available',
        message: `${doctor.name} is now back and Available.`,
        type: 'availability',
        targetRoles: ['admin', 'receptionist']
      });
    }

    return updatedDoc;
  }
}

export default new DoctorService();
