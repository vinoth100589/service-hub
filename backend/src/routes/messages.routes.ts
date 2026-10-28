import { Router } from 'express';
import { body } from 'express-validator';
import { MessageController } from '@controllers/messageController';
import { authMiddleware } from '@middleware/auth.middleware';

const router = Router();

router.post('/', authMiddleware, [
  body('booking_id').notEmpty(),
  body('receiver_id').notEmpty(),
  body('content').trim().notEmpty(),
], MessageController.sendMessage);

router.get('/conversations', authMiddleware, MessageController.getConversations);
router.get('/:booking_id', authMiddleware, MessageController.getBookingMessages);
router.put('/:id/read', authMiddleware, MessageController.markAsRead);
router.delete('/:id', authMiddleware, MessageController.deleteMessage);

export default router;
