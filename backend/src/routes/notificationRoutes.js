import express from 'express';
import notificationService from '../services/notificationService.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/notifications
router.get('/', protect, async (req, res, next) => {
  try {
    const list = await notificationService.getNotifications();
    res.status(200).json(list);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', protect, async (req, res, next) => {
  try {
    const userId = req.user ? req.user.username : 'system';
    const noti = await notificationService.markNotificationIdAsRead(req.params.id, userId);
    res.status(200).json({ success: true, noti });
  } catch (error) {
    next(error);
  }
});

export default router;
