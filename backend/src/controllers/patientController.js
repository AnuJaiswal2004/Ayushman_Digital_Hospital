import patientService from '../services/patientService.js';

class PatientController {
  async getPatients(req, res, next) {
    try {
      const patients = await patientService.getAllPatients();
      res.status(200).json(patients);
    } catch (error) {
      next(error);
    }
  }

  async getPatientById(req, res, next) {
    try {
      const patient = await patientService.getPatientById(req.params.id);
      res.status(200).json(patient);
    } catch (error) {
      res.status(404);
      next(error);
    }
  }

  async updatePatient(req, res, next) {
    try {
      const actor = req.user ? req.user.username : 'admin';
      const role = req.user ? req.user.role : 'admin';
      const patient = await patientService.updatePatient(req.params.id, req.body, actor, role);
      res.status(200).json(patient);
    } catch (error) {
      res.status(400);
      next(error);
    }
  }

  async getEMR(req, res, next) {
    try {
      const emr = await patientService.getEMR(req.params.patientId);
      res.status(200).json({ success: true, emr });
    } catch (error) {
      res.status(404);
      next(error);
    }
  }

  async updateEMR(req, res, next) {
    try {
      const actor = req.user ? req.user.username : 'doctor';
      const role = req.user ? req.user.role : 'doctor';
      const patient = await patientService.updateEMR(req.params.patientId, req.body, actor, role);
      res.status(200).json({ success: true, patient });
    } catch (error) {
      res.status(400);
      next(error);
    }
  }
}

export default new PatientController();
