import { Router } from 'express';
import { feedController } from '../controllers/feedController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

router.get('/', requireAuth, feedController.listFeed);
router.post('/', requireAuth, feedController.createPost);
router.post('/:postId/reactions', requireAuth, feedController.reactToPost);
router.post('/:postId/comments', requireAuth, feedController.commentOnPost);
router.get('/:postId/comments', requireAuth, feedController.listComments);
router.post('/:postId/save', requireAuth, feedController.toggleSave);
router.post('/:postId/share', requireAuth, feedController.sharePost);

export default router;
