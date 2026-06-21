import doctorService from '../services/doctorService.js';

class DoctorController {
  async getDoctors(req, res, next) {
    try {
      const doctors = await doctorService.getAllDoctors();
      res.status(200).json(doctors);
    } catch (error) {
      next(error);
    }
  }

  async addDoctor(req, res, next) {
    try {
      const actor = req.user ? req.user.username : 'admin';
      const role = req.user ? req.user.role : 'admin';
      const doctor = await doctorService.addDoctor(req.body, actor, role);
      res.status(201).json(doctor);
    } catch (error) {
      res.status(400);
      next(error);
    }
  }

  async toggleDoctorAvailability(req, res, next) {
    try {
      const actor = req.user ? req.user.username : 'admin';
      const role = req.user ? req.user.role : 'admin';
      const doctor = await doctorService.toggleDoctorAvailability(req.params.id, actor, role);
      res.status(200).json(doctor);
    } catch (error) {
      res.status(400);
      next(error);
    }
  }
}

export default new DoctorController();
