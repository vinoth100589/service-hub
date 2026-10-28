import { Router } from 'express';
import { body } from 'express-validator';
import { PaymentController } from '@controllers/paymentController';
import { authMiddleware } from '@middleware/auth.middleware';

const router = Router();

router.post('/intent', authMiddleware, [
  body('booking_id').notEmpty(),
  body('amount').isFloat({ min: 0 }),
], PaymentController.createPaymentIntent);

router.post('/confirm', authMiddleware, [
  body('payment_id').notEmpty(),
  body('stripe_charge_id').notEmpty(),
], PaymentController.confirmPayment);

router.get('/:id', authMiddleware, PaymentController.getPayment);
router.get('/', authMiddleware, PaymentController.listUserPayments);
router.post('/:id/refund', authMiddleware, PaymentController.requestRefund);
router.get('/provider/payouts', authMiddleware, PaymentController.getPayouts);

export default router;
