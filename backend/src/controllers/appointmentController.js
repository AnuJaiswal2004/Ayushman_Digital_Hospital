import appointmentService from '../services/appointmentService.js';

class AppointmentController {
  async getAppointments(req, res, next) {
    try {
      const records = await appointmentService.getCombinedAppointmentsAndVisits();
      res.status(200).json(records);
    } catch (error) {
      next(error);
    }
  }

  async bookAppointment(req, res, next) {
    try {
      const actor = req.user ? req.user.username : 'patient';
      const role = req.user ? req.user.role : 'patient';
      const record = await appointmentService.bookAppointment(req.body, actor, role);
      res.status(201).json(record);
    } catch (error) {
      res.status(400);
      next(error);
    }
  }

  async updateAppointmentStatus(req, res, next) {
    try {
      const actor = req.user ? req.user.username : 'staff';
      const role = req.user ? req.user.role : 'receptionist';
      const updated = await appointmentService.updateAppointmentStatus(req.params.id, req.body.status, actor, role);
      res.status(200).json(updated);
    } catch (error) {
      res.status(400);
      next(error);
    }
  }

  async rescheduleAppointment(req, res, next) {
    try {
      const { date, time } = req.body;
      const updated = await appointmentService.rescheduleAppointment(req.params.id, date, time);
      res.status(200).json(updated);
    } catch (error) {
      res.status(400);
      next(error);
    }
  }

  async checkIn(req, res, next) {
    try {
      const actor = req.user ? req.user.username : 'staff';
      const role = req.user ? req.user.role : 'receptionist';
      const { patientId, doctorName, department, type } = req.body;
      const visit = await appointmentService.checkInPatient(patientId, doctorName, department, type, actor, role);
      res.status(201).json({ success: true, visit });
    } catch (error) {
      res.status(400);
      next(error);
    }
  }

  async recordVitals(req, res, next) {
    try {
      const actor = req.user ? req.user.username : 'staff';
      const role = req.user ? req.user.role : 'receptionist';
      const visit = await appointmentService.recordVitals(req.params.id, req.body, actor, role);
      res.status(200).json({ success: true, visit });
    } catch (error) {
      res.status(400);
      next(error);
    }
  }

  async recordConsultation(req, res, next) {
    try {
      const actor = req.user ? req.user.username : 'doctor';
      const role = req.user ? req.user.role : 'doctor';
      const visit = await appointmentService.recordConsultation(req.params.id, req.body, actor, role);
      res.status(200).json({ success: true, visit });
    } catch (error) {
      res.status(400);
      next(error);
    }
  }
}

export default new AppointmentController();
