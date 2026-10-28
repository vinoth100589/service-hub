import { Router } from 'express';
import { body } from 'express-validator';
import { AuthController } from '@controllers/authController';
import { authMiddleware } from '@middleware/auth.middleware';

const router = Router();

router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('first_name').trim().notEmpty(),
    body('last_name').trim().notEmpty(),
  ],
  AuthController.register
);

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  AuthController.login
);

router.post('/refresh-token', AuthController.refreshToken);

router.post('/logout', AuthController.logout);

router.get('/me', authMiddleware, AuthController.getCurrentUser);
router.put('/me', authMiddleware, AuthController.updateProfile);

router.post('/forgot-password', [body('email').isEmail().normalizeEmail()], AuthController.forgotPassword);
router.post('/reset-password', [body('token').notEmpty(), body('password').isLength({ min: 8 })], AuthController.resetPassword);

router.post('/verify-email', [body('token').notEmpty()], AuthController.verifyEmail);
router.post('/resend-verification', [body('email').isEmail().normalizeEmail()], AuthController.resendVerification);
router.put('/push-token', authMiddleware, [body('push_token').notEmpty()], AuthController.savePushToken);

export default router;
