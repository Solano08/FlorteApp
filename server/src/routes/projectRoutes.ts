import { Router } from 'express';
import { projectController } from '../controllers/projectController';
import { requireAuth } from '../middleware/authMiddleware';
import { projectCoverUpload, projectWorkspaceFileUpload } from '../config/storage';

const router = Router();

router.get('/', projectController.list);
router.post('/', requireAuth, projectController.create);
router.get('/me', requireAuth, projectController.listMine);
router.get('/:projectId/panel', requireAuth, projectController.getPanel);
router.put('/:projectId/workspace-notes', requireAuth, projectController.updateWorkspaceNotes);
router.post(
  '/:projectId/attachments',
  requireAuth,
  projectWorkspaceFileUpload.single('file'),
  projectController.uploadWorkspaceAttachment
);
router.delete('/:projectId/attachments/:attachmentId', requireAuth, projectController.deleteWorkspaceAttachment);
router.post(
  '/:projectId/cover',
  requireAuth,
  projectCoverUpload.single('cover'),
  projectController.uploadCover
);
router.put('/:projectId', requireAuth, projectController.update);
router.delete('/:projectId', requireAuth, projectController.delete);

export default router;
