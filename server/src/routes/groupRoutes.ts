import { Router } from 'express';
import { groupController } from '../controllers/groupController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

router.get('/', groupController.list);
router.post('/', requireAuth, groupController.create);
router.get('/me', requireAuth, groupController.listMine);

export default router;
