import { Router } from 'express';
import { body } from 'express-validator';
import { BookingController } from '@controllers/bookingController';
import { authMiddleware } from '@middleware/auth.middleware';

const router = Router();

router.post('/', authMiddleware, [
  body('service_id').notEmpty(),
  body('scheduled_date').isISO8601(),
  body('service_address').trim().notEmpty(),
], BookingController.createBooking);

router.get('/:id', authMiddleware, BookingController.getBooking);
router.get('/', authMiddleware, BookingController.listUserBookings);
router.put('/:id/accept', authMiddleware, BookingController.acceptBooking);
router.put('/:id/reject', authMiddleware, BookingController.rejectBooking);
router.put('/:id/complete', authMiddleware, BookingController.completeBooking);
router.put('/:id/cancel', authMiddleware, BookingController.cancelBooking);

export default router;
