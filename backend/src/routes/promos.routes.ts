import { Router } from 'express';
import { body } from 'express-validator';
import { PromoController } from '@controllers/promoController';
import { authMiddleware, adminOnlyMiddleware } from '@middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.post(
  '/validate',
  [body('code').trim().notEmpty(), body('booking_amount').isFloat({ min: 0 })],
  PromoController.validatePromo
);

router.get('/', adminOnlyMiddleware, PromoController.listPromos);
router.post(
  '/',
  adminOnlyMiddleware,
  [
    body('code').trim().notEmpty(),
    body('discount_type').isIn(['percent', 'fixed']),
    body('discount_value').isFloat({ min: 0 }),
  ],
  PromoController.createPromo
);

export default router;
