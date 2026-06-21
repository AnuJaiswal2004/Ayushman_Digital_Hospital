import express from 'express';
import labOrderController from '../controllers/labOrderController.js';
import { protect } from '../middleware/authMiddleware.js';
import { restrictTo } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.post('/', protect, restrictTo('doctor', 'superadmin'), labOrderController.create);
router.get('/', protect, labOrderController.getAll);
router.patch('/:id', protect, restrictTo('doctor', 'receptionist', 'admin', 'superadmin'), labOrderController.updateStatus);

export default router;
