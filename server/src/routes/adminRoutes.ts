import { Router } from 'express';
import { adminController } from '../controllers/adminController';
import { requireAuth, requireRole } from '../middleware/authMiddleware';

const router = Router();

router.use(requireAuth, requireRole('admin'));

router.get('/users', adminController.listUsers);
router.patch('/users/:userId/role', adminController.updateRole);
router.patch('/users/:userId/status', adminController.updateStatus);

export default router;
