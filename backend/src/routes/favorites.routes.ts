import { Router } from 'express';
import { body } from 'express-validator';
import { FavoriteController } from '@controllers/favoriteController';
import { authMiddleware } from '@middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', FavoriteController.listFavorites);
router.post('/', [body('provider_id').notEmpty()], FavoriteController.addFavorite);
router.delete('/:providerId', FavoriteController.removeFavorite);

export default router;
