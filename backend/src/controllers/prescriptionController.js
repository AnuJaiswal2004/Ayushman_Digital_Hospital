import appointmentService from '../services/appointmentService.js';

class PrescriptionController {
  async savePrescription(req, res, next) {
    try {
      const actor = req.user ? req.user.username : 'doctor';
      const role = req.user ? req.user.role : 'doctor';
      const { medications } = req.body;
      const prescription = await appointmentService.savePrescription(req.params.visitId, medications, actor, role);
      res.status(201).json({ success: true, prescription });
    } catch (error) {
      res.status(400);
      next(error);
    }
  }
}

export default new PrescriptionController();
