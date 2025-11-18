import { Router } from 'express';
import { chatController } from '../controllers/chatController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

router.post('/', requireAuth, chatController.createChat);
router.get('/', requireAuth, chatController.listChats);
router.get('/:chatId/messages', requireAuth, chatController.getMessages);
router.post('/:chatId/messages', requireAuth, chatController.sendMessage);

export default router;
