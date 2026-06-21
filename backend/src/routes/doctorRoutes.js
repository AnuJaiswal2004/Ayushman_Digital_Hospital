import express from 'express';
import doctorController from '../controllers/doctorController.js';
import { protect } from '../middleware/authMiddleware.js';
import { restrictTo } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.get('/', doctorController.getDoctors);
router.post('/', protect, restrictTo('admin', 'superadmin'), doctorController.addDoctor);
router.put('/:id/availability', protect, restrictTo('admin', 'superadmin', 'receptionist', 'doctor'), doctorController.toggleDoctorAvailability);

export default router;
