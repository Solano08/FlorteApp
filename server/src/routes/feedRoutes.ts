import { Router } from 'express';
import { feedController } from '../controllers/feedController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

router.get('/', requireAuth, feedController.listFeed.bind(feedController));
router.post('/', requireAuth, feedController.createPost.bind(feedController));
router.get('/saved', requireAuth, feedController.listSavedPosts.bind(feedController));
router.post('/:postId/reactions', requireAuth, feedController.reactToPost.bind(feedController));
router.post('/:postId/comments', requireAuth, feedController.commentOnPost.bind(feedController));
router.get('/:postId/comments', requireAuth, feedController.listComments.bind(feedController));
router.patch(
  '/:postId/comments/:commentId',
  requireAuth,
  feedController.updateComment.bind(feedController)
);
router.delete(
  '/:postId/comments/:commentId',
  requireAuth,
  feedController.deleteComment.bind(feedController)
);
router.post('/:postId/save', requireAuth, feedController.toggleSave.bind(feedController));
router.post('/:postId/share', requireAuth, feedController.sharePost.bind(feedController));
router.post('/:postId/report', requireAuth, feedController.reportPost.bind(feedController));
router.get('/:postId', requireAuth, feedController.getPost.bind(feedController));
router.patch('/:postId', requireAuth, feedController.updatePost.bind(feedController));
router.delete('/:postId', requireAuth, feedController.deletePost.bind(feedController));

export default router;
