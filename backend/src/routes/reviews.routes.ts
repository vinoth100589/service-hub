import { Router } from 'express';
import { body } from 'express-validator';
import { ReviewController } from '@controllers/reviewController';
import { authMiddleware } from '@middleware/auth.middleware';

const router = Router();

router.post('/', authMiddleware, [
  body('booking_id').notEmpty(),
  body('rating').isInt({ min: 1, max: 5 }),
], ReviewController.submitReview);

router.get('/:id', ReviewController.getReview);
router.post('/:id/helpful', authMiddleware, ReviewController.toggleHelpful);
router.put('/:id', authMiddleware, ReviewController.updateReview);
router.delete('/:id', authMiddleware, ReviewController.deleteReview);
router.get('/provider/:providerId', ReviewController.listProviderReviews);

export default router;
