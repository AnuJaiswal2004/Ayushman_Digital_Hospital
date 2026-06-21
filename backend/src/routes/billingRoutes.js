import express from 'express';
import billingController from '../controllers/billingController.js';
import { validateBillingPayment } from '../validators/billingValidator.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/pay', protect, validateBillingPayment, billingController.processPayment);
router.get('/:visitId', protect, billingController.getBilling);

export default router;
