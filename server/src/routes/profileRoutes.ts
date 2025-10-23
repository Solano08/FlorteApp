import { Router } from 'express';
import { profileController } from '../controllers/profileController';
import { requireAuth } from '../middleware/authMiddleware';
import { avatarUpload } from '../config/storage';

const router = Router();

router.get('/me', requireAuth, profileController.me);
router.put('/me', requireAuth, profileController.updateProfile);
router.put('/me/avatar', requireAuth, avatarUpload.single('avatar'), profileController.updateAvatar);

export default router;
