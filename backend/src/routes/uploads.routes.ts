import { Router } from 'express';
import { UploadController } from '@controllers/uploadController';
import { authMiddleware } from '@middleware/auth.middleware';
import { upload } from '@config/upload';

const router = Router();

router.use(authMiddleware);

router.post('/avatar', upload.single('image'), UploadController.uploadAvatar);
router.post('/services/:serviceId', upload.array('images', 6), UploadController.uploadServiceImages);

export default router;
