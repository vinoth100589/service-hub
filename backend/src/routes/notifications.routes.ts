import { Router } from 'express';
import { NotificationController } from '@controllers/notificationController';
import { authMiddleware } from '@middleware/auth.middleware';

const router = Router();

router.get('/', authMiddleware, NotificationController.listNotifications);
router.put('/read-all', authMiddleware, NotificationController.markAllAsRead);
router.put('/:id/read', authMiddleware, NotificationController.markAsRead);

export default router;
