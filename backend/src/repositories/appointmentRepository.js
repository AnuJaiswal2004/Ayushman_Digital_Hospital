import Appointment from '../models/Appointment.js';
import Visit from '../models/Visit.js';

class AppointmentRepository {
  async findAllAppointments() {
    return await Appointment.find({});
  }

  async findAllVisits() {
    return await Visit.find({});
  }

  // Returns combined appointments and visits to mimic the single list in frontend
  async findAllCombined() {
    const appointments = await Appointment.find({});
    const visits = await Visit.find({});
    return [...appointments, ...visits];
  }

  async findAppointmentById(id) {
    return await Appointment.findOne({ id });
  }

  async findVisitById(id) {
    return await Visit.findOne({
      $or: [{ id }, { token: id }]
    });
  }

  async createAppointment(appointmentData) {
    const appointment = new Appointment(appointmentData);
    return await appointment.save();
  }

  async createVisit(visitData) {
    const visit = new Visit(visitData);
    return await visit.save();
  }

  async updateAppointment(id, updatedData) {
    return await Appointment.findOneAndUpdate(
      { id },
      { $set: updatedData },
      { new: true }
    );
  }

  async updateVisit(id, updatedData) {
    return await Visit.findOneAndUpdate(
      { $or: [{ id }, { token: id }] },
      { $set: updatedData },
      { new: true }
    );
  }

  async updateAppointmentStatus(id, status) {
    // Try to update both (since id could be visit or appointment)
    const apt = await Appointment.findOneAndUpdate({ id }, { $set: { status } }, { new: true });
    const visit = await Visit.findOneAndUpdate({ id }, { $set: { status } }, { new: true });
    return apt || visit;
  }
}

export default new AppointmentRepository();
