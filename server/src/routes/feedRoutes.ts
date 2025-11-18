import { Router } from 'express';
import { feedController } from '../controllers/feedController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

router.get('/', requireAuth, feedController.listFeed.bind(feedController));
router.post('/', requireAuth, feedController.createPost.bind(feedController));
router.post('/:postId/reactions', requireAuth, feedController.reactToPost.bind(feedController));
router.post('/:postId/comments', requireAuth, feedController.commentOnPost.bind(feedController));
router.get('/:postId/comments', requireAuth, feedController.listComments.bind(feedController));
router.post('/:postId/save', requireAuth, feedController.toggleSave.bind(feedController));
router.post('/:postId/share', requireAuth, feedController.sharePost.bind(feedController));

export default router;
