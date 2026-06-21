import express from 'express';
import dashboardController from '../controllers/dashboardController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Dashboard APIs
router.get('/dashboard/stats', protect, dashboardController.getStats);
router.get('/dashboard/analytics', protect, dashboardController.getAnalytics);

// Queue APIs (as requested by checklist)
router.get('/queue', protect, dashboardController.getQueue);
router.patch('/queue/:visitId', protect, dashboardController.advanceQueue);

export default router;
