import { Router } from 'express';
import { body } from 'express-validator';
import { ServiceController } from '@controllers/serviceController';
import { authMiddleware, optionalAuthMiddleware, providerOnlyMiddleware } from '@middleware/auth.middleware';

const router = Router();

// Public routes
router.get('/categories', ServiceController.getCategories);
router.get('/featured', ServiceController.getFeaturedServices);
router.get('/nearby', ServiceController.nearbyServices);
router.get('/', ServiceController.listServices);
router.get('/:id', ServiceController.getServiceById);

// Provider routes (require authentication)
router.post(
  '/',
  authMiddleware,
  providerOnlyMiddleware,
  [
    body('name').trim().notEmpty().withMessage('Service name is required'),
    body('description').trim().notEmpty(),
    body('category').trim().notEmpty(),
    body('base_price').isFloat({ min: 0 }).withMessage('Price must be positive'),
    body('price_unit').isIn(['hourly', 'flat_rate', 'project']),
  ],
  ServiceController.createService
);

router.put(
  '/:id',
  authMiddleware,
  providerOnlyMiddleware,
  ServiceController.updateService
);

router.delete(
  '/:id',
  authMiddleware,
  providerOnlyMiddleware,
  ServiceController.deleteService
);

// Provider profile routes
router.get('/provider/:providerId/profile', ServiceController.getProviderProfile);
router.get('/provider/:providerId/services', ServiceController.getProviderServices);

export default router;
