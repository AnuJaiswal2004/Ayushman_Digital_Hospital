import express from 'express';
import authController from '../controllers/authController.js';
import { validateLogin, validateRegister } from '../validators/authValidator.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', validateLogin, authController.login);
router.post('/register', validateRegister, authController.register);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.logout);

router.put('/change-password', protect, authController.changePassword);
router.post('/reset-password', authController.resetPassword);

export default router;
