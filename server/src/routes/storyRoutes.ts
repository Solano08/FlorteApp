import { Router } from 'express';
import { storyController } from '../controllers/storyController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

router.get('/', requireAuth, storyController.listStories.bind(storyController));
router.post('/', requireAuth, storyController.createStory.bind(storyController));
router.delete('/:storyId', requireAuth, storyController.deleteStory.bind(storyController));
router.post('/:storyId/view', requireAuth, storyController.recordView.bind(storyController));
router.get('/:storyId/viewers', requireAuth, storyController.getStoryViewers.bind(storyController));

export default router;
