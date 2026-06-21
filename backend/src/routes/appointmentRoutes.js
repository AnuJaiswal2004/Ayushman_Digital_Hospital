import express from 'express';
import appointmentController from '../controllers/appointmentController.js';
import prescriptionController from '../controllers/prescriptionController.js';
import { validateAppointmentBooking, validateCheckIn } from '../validators/appointmentValidator.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', appointmentController.getAppointments);
router.post('/', validateAppointmentBooking, appointmentController.bookAppointment);
router.put('/:id/status', appointmentController.updateAppointmentStatus);
router.put('/:id/reschedule', protect, appointmentController.rescheduleAppointment);

// Workflow check-in endpoints
router.post('/checkin', protect, validateCheckIn, appointmentController.checkIn);
router.put('/:id/vitals', protect, appointmentController.recordVitals);
router.put('/:id/consultation', protect, appointmentController.recordConsultation);

// Prescription integration nested inside visits routes
router.post('/:visitId/prescription', protect, prescriptionController.savePrescription);

export default router;
