import queueService from '../services/queueService.js';

class QueueController {
  async getQueue(req, res, next) {
    try {
      const activeQueue = await queueService.getActiveQueue();
      res.status(200).json({ success: true, queue: activeQueue });
    } catch (error) {
      next(error);
    }
  }

  async advanceQueue(req, res, next) {
    try {
      const actor = req.user ? req.user.username : 'staff';
      const role = req.user ? req.user.role : 'receptionist';
      const updated = await queueService.advanceQueue(req.params.visitId, actor, role);
      res.status(200).json({ success: true, visit: updated });
    } catch (error) {
      res.status(400);
      next(error);
    }
  }
}

export default new QueueController();
