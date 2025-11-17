import { Router } from 'express';
import { feedController } from '../controllers/feedController';
import { requireAuth } from '../middleware/authMiddleware';
import { feedFileUpload, feedMediaUpload } from '../config/storage';

const router = Router();

router.post(
  '/uploads/media',
  requireAuth,
  feedMediaUpload.single('file'),
  feedController.uploadMedia.bind(feedController)
);
router.post(
  '/uploads/attachments',
  requireAuth,
  feedFileUpload.single('file'),
  feedController.uploadAttachment.bind(feedController)
);

router.get('/saved', requireAuth, feedController.listSavedPosts.bind(feedController));
router.get('/', requireAuth, feedController.listFeed.bind(feedController));
router.post('/', requireAuth, feedController.createPost.bind(feedController));
router.post('/:postId/reactions', requireAuth, feedController.reactToPost.bind(feedController));
router.post('/:postId/comments', requireAuth, feedController.commentOnPost.bind(feedController));
router.get('/:postId/comments', requireAuth, feedController.listComments.bind(feedController));
router.post('/:postId/save', requireAuth, feedController.toggleSave.bind(feedController));
router.post('/:postId/share', requireAuth, feedController.sharePost.bind(feedController));
router.post('/:postId/report', requireAuth, feedController.reportPost.bind(feedController));
router.delete('/:postId', requireAuth, feedController.deletePost.bind(feedController));

export default router;
