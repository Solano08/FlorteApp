import { Router } from 'express';
import { libraryController } from '../controllers/libraryController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

router.get('/', libraryController.list);
router.get('/search', libraryController.search);
router.get('/me', requireAuth, libraryController.listMine);
router.post('/', requireAuth, libraryController.create);

export default router;
