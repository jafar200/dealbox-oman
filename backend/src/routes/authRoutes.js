import express from 'express';
import { register, login, googleSignIn, getMe, updateProfile, forgotPassword, resetPassword } from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';
import {
  authLimiter, loginLimiter, registerLimiter, googleAuthLimiter,
  forgotPasswordLimiter, resetPasswordLimiter,
} from '../middlewares/rateLimitMiddleware.js';

const router = express.Router();

// Broad ceiling for every authentication endpoint.
router.use(authLimiter);

router.post('/register', registerLimiter, register);
router.post('/login', loginLimiter, login);
router.post('/google', googleAuthLimiter, googleSignIn);
router.post('/forgot-password', forgotPasswordLimiter, forgotPassword);
router.post('/reset-password', resetPasswordLimiter, resetPassword);
router.get('/me', protect, getMe);
router.patch('/profile', protect, updateProfile);

export default router;