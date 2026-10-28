import { Router } from 'express';
import { body } from 'express-validator';
import { ProviderController } from '@controllers/providerController';
import { authMiddleware, providerOnlyMiddleware } from '@middleware/auth.middleware';

const router = Router();

router.post('/apply', authMiddleware, [
  body('business_name').trim().notEmpty(),
], ProviderController.applyAsProvider);

router.get('/profile', authMiddleware, providerOnlyMiddleware, ProviderController.getProviderProfile);
router.put('/settings', authMiddleware, providerOnlyMiddleware, ProviderController.updateProviderSettings);
router.put('/availability', authMiddleware, providerOnlyMiddleware, ProviderController.updateAvailability);

export default router;
