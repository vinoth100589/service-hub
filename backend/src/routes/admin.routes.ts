import { Router } from 'express';
import { AdminController } from '@controllers/adminController';
import { authMiddleware, adminOnlyMiddleware } from '@middleware/auth.middleware';

const router = Router();

router.use(authMiddleware, adminOnlyMiddleware);

router.get('/dashboard', AdminController.getDashboard);
router.get('/providers/pending', AdminController.listPendingProviders);
router.put('/providers/:provider_id/verify', AdminController.verifyProvider);
router.put('/providers/:provider_id/reject', AdminController.rejectProvider);
router.get('/disputes', AdminController.listDisputes);
router.put('/disputes/:dispute_id/resolve', AdminController.resolveDispute);
router.get('/analytics', AdminController.getAnalytics);

export default router;
