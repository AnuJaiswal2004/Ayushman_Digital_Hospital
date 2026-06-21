import billingService from '../services/billingService.js';

class BillingController {
  async processPayment(req, res, next) {
    try {
      const actor = req.user ? req.user.username : 'receptionist';
      const role = req.user ? req.user.role : 'receptionist';
      const { visitId, paymentMethod, totalAmount } = req.body;
      const billing = await billingService.processPayment(visitId, paymentMethod, totalAmount, actor, role);
      res.status(200).json({ success: true, billing });
    } catch (error) {
      res.status(400);
      next(error);
    }
  }

  async getBilling(req, res, next) {
    try {
      const billing = await billingService.getBillingByVisit(req.params.visitId);
      res.status(200).json(billing);
    } catch (error) {
      next(error);
    }
  }
}

export default new BillingController();
