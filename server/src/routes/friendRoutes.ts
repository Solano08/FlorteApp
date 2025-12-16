import { Router } from 'express';
import { friendController } from '../controllers/friendController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

router.post('/requests', requireAuth, friendController.sendRequest);
router.get('/requests', requireAuth, friendController.listRequests);
router.post('/requests/:requestId/accept', requireAuth, friendController.acceptRequest);
router.post('/requests/:requestId/reject', requireAuth, friendController.rejectRequest);
router.post('/requests/:requestId/cancel', requireAuth, friendController.cancelRequest);
router.get('/', requireAuth, friendController.listFriends);

export default router;



