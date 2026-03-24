import { Router } from 'express';
import { projectController } from '../controllers/projectController';
import { requireAuth } from '../middleware/authMiddleware';
import { projectCoverUpload } from '../config/storage';

const router = Router();

router.get('/', projectController.list);
router.post('/', requireAuth, projectController.create);
router.get('/me', requireAuth, projectController.listMine);
router.post(
  '/:projectId/cover',
  requireAuth,
  projectCoverUpload.single('cover'),
  projectController.uploadCover
);
router.put('/:projectId', requireAuth, projectController.update);
router.delete('/:projectId', requireAuth, projectController.delete);

export default router;
