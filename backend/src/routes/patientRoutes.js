import express from 'express';
import patientController from '../controllers/patientController.js';
import { validatePatientUpdate, validateEMRUpdate } from '../validators/patientValidator.js';
import { protect } from '../middleware/authMiddleware.js';
import { restrictTo } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.get('/', protect, patientController.getPatients);
router.get('/:id', protect, patientController.getPatientById);
router.put('/:id', protect, validatePatientUpdate, patientController.updatePatient);

// EMR Specific APIs (as requested by checklist)
router.get('/emr/:patientId', protect, patientController.getEMR);
router.put('/emr/:patientId', protect, validateEMRUpdate, patientController.updateEMR);

export default router;
