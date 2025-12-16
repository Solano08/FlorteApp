import { Router } from 'express';
import { groupController } from '../controllers/groupController';
import { channelController } from '../controllers/channelController';
import { requireAuth } from '../middleware/authMiddleware';
import { communityIconUpload, communityCoverUpload } from '../config/storage';

const router = Router();

// Community routes
router.get('/', groupController.list);
router.post('/', requireAuth, groupController.create);
router.get('/me', requireAuth, groupController.listMine);
router.get('/:id', groupController.get);
router.post('/:id/leave', requireAuth, groupController.leave);
router.delete('/:id', requireAuth, groupController.delete);

// Channel routes
router.get('/:communityId/channels', channelController.list);
router.post('/:communityId/channels', requireAuth, channelController.create);
router.get('/channels/:id', channelController.get);
router.delete('/channels/:id', requireAuth, channelController.delete);

// Channel messages routes
router.get('/channels/:channelId/messages', channelController.listMessages);
router.post('/channels/:channelId/messages', requireAuth, channelController.createMessage);
router.delete('/channels/messages/:id', requireAuth, channelController.deleteMessage);

// Join community
router.post('/:id/join', requireAuth, groupController.join);

// Upload images
router.post('/:id/icon', requireAuth, communityIconUpload.single('icon'), groupController.uploadIcon);
router.post('/:id/cover', requireAuth, communityCoverUpload.single('cover'), groupController.uploadCover);

export default router;
