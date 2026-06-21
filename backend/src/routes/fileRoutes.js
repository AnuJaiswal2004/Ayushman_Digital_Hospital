import express from 'express';
import fileController from '../controllers/fileController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/upload', protect, fileController.uploadMiddleware, fileController.upload);
router.get('/:id', protect, fileController.getById);
router.delete('/:id', protect, fileController.delete);

export default router;
