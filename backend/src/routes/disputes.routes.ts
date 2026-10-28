import { Router } from 'express';
import { body } from 'express-validator';
import { DisputeController } from '@controllers/disputeController';
import { authMiddleware } from '@middleware/auth.middleware';

const router = Router();

router.post('/', authMiddleware, [
  body('booking_id').notEmpty(),
  body('title').trim().notEmpty(),
  body('description').trim().notEmpty(),
], DisputeController.createDispute);

router.get('/', authMiddleware, DisputeController.listMyDisputes);
router.get('/:id', authMiddleware, DisputeController.getDispute);

export default router;
