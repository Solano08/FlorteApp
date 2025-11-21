import { Router } from 'express';
import { userController } from '../controllers/userController';
import { requireAuth, requireRole } from '../middleware/authMiddleware';

const router = Router();

router.use(requireAuth, requireRole('admin'));

router.get('/', userController.list);
router.get('/:userId', userController.getById);
router.post('/', userController.create);
router.put('/:userId', userController.update);
router.delete('/:userId', userController.remove);
router.post('/:userId/restore', userController.restore);

export default router;
