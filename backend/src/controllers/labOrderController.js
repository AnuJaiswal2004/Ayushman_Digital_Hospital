import labOrderService from '../services/labOrderService.js';

class LabOrderController {
  async create(req, res, next) {
    try {
      const actor = req.user ? req.user.username : 'doctor';
      const role = req.user ? req.user.role : 'doctor';
      const order = await labOrderService.createLabOrder(req.body, actor, role);
      res.status(201).json({ success: true, order });
    } catch (error) {
      res.status(400);
      next(error);
    }
  }

  async getAll(req, res, next) {
    try {
      const orders = await labOrderService.getAllLabOrders();
      res.status(200).json({ success: true, orders });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const actor = req.user ? req.user.username : 'staff';
      const role = req.user ? req.user.role : 'receptionist';
      const { status, reportUrl } = req.body;
      const order = await labOrderService.updateOrderStatus(req.params.id, status, reportUrl, actor, role);
      res.status(200).json({ success: true, order });
    } catch (error) {
      res.status(400);
      next(error);
    }
  }
}

export default new LabOrderController();
