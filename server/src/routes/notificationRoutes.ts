import { Router } from 'express';
import { notificationController } from '../controllers/notificationController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

router.get('/', requireAuth, notificationController.listMine);
router.post('/:id/read', requireAuth, notificationController.markAsRead);
router.post('/read-all', requireAuth, notificationController.markAllAsRead);

export default router;









