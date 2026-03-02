import { Router } from 'express';
import { userController } from '../controllers/userController';
import { requireAuth, requireRole } from '../middleware/authMiddleware';

const router = Router();

// Rutas públicas de bloqueo (solo requieren autenticación)
router.post('/:userId/block', requireAuth, userController.block);
router.delete('/:userId/block', requireAuth, userController.unblock);

// Rutas de administración (requieren rol admin)
router.use(requireAuth, requireRole('admin'));

router.get('/', userController.list);
router.get('/:userId', userController.getById);
router.post('/', userController.create);
router.put('/:userId', userController.update);
router.delete('/:userId', userController.remove);
router.post('/:userId/restore', userController.restore);

export default router;
