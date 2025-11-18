import { Router } from 'express';
import { profileController } from '../controllers/profileController';
import { requireAuth } from '../middleware/authMiddleware';
import { avatarUpload, coverUpload } from '../config/storage';

const router = Router();

router.get('/me', requireAuth, profileController.me);
router.get('/me/activity', requireAuth, profileController.activity);
router.get('/me/posts', requireAuth, profileController.recentPosts);
router.put('/me', requireAuth, profileController.updateProfile);
router.put('/me/avatar', requireAuth, avatarUpload.single('avatar'), profileController.updateAvatar);
router.put('/me/cover', requireAuth, coverUpload.single('cover'), profileController.updateCover);

export default router;
