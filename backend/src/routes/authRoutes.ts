import { Router } from 'express';
import { body } from 'express-validator';
import { AuthController } from '../controllers/authController';
import { asyncHandler } from '../middleware/asyncHandler';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';

export function createAuthRouter(controller: AuthController): Router {
  const router = Router();

  router.post(
    '/register',
    body('email').isEmail().withMessage('A valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('fullName').trim().notEmpty().withMessage('Full name is required'),
    body('role').optional().isIn(['customer', 'provider', 'admin']),
    validate,
    asyncHandler(controller.register),
  );

  router.post(
    '/login',
    body('email').isEmail().withMessage('A valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
    validate,
    asyncHandler(controller.login),
  );

  router.post('/logout', asyncHandler(controller.logout));

  router.post(
    '/refresh-token',
    body('refreshToken').notEmpty().withMessage('Refresh token is required'),
    validate,
    asyncHandler(controller.refresh),
  );

  router.get('/me', requireAuth, asyncHandler(controller.me));

  return router;
}
