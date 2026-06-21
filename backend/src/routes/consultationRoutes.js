import express from 'express';
import consultationController from '../controllers/consultationController.js';
import { protect } from '../middleware/authMiddleware.js';
import { restrictTo } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.post('/', protect, restrictTo('doctor', 'superadmin'), consultationController.create);
router.get('/:id', protect, consultationController.getById);
router.put('/:id', protect, restrictTo('doctor', 'superadmin'), consultationController.update);

export default router;
