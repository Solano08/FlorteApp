import { Router } from 'express';
import { projectController } from '../controllers/projectController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

router.get('/', projectController.list);
router.post('/', requireAuth, projectController.create);
router.get('/me', requireAuth, projectController.listMine);
router.put('/:projectId', requireAuth, projectController.update);
router.delete('/:projectId', requireAuth, projectController.delete);

export default router;
