import consultationService from '../services/consultationService.js';

class ConsultationController {
  async create(req, res, next) {
    try {
      const actor = req.user ? req.user.username : 'doctor';
      const role = req.user ? req.user.role : 'doctor';
      const consultation = await consultationService.createConsultation(req.body, actor, role);
      res.status(201).json({ success: true, consultation });
    } catch (error) {
      res.status(400);
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const consultation = await consultationService.getConsultationById(req.params.id);
      res.status(200).json({ success: true, consultation });
    } catch (error) {
      res.status(404);
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const actor = req.user ? req.user.username : 'doctor';
      const role = req.user ? req.user.role : 'doctor';
      const consultation = await consultationService.updateConsultation(req.params.id, req.body, actor, role);
      res.status(200).json({ success: true, consultation });
    } catch (error) {
      res.status(400);
      next(error);
    }
  }
}

export default new ConsultationController();
