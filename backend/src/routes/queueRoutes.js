import express from 'express';
import queueController from '../controllers/queueController.js';
import { protect } from '../middleware/authMiddleware.js';
import { restrictTo } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.get('/', protect, queueController.getQueue);
router.patch('/:visitId', protect, restrictTo('doctor', 'receptionist', 'admin', 'superadmin'), queueController.advanceQueue);

export default router;
