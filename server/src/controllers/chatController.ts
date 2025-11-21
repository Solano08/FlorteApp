import { Request, Response } from 'express';
import { chatService } from '../services/chatService';
import { createChatSchema, sendMessageSchema } from '../validators/chatValidators';
import { AppError } from '../utils/appError';

export const chatController = {
  createChat: async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw new AppError('Autenticación requerida', 401);
    const data = createChatSchema.parse(req.body);
    const chat = await chatService.createChat({
      ...data,
      createdBy: userId
    });
    res.status(201).json({ success: true, chat });
  },

  listChats: async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw new AppError('Autenticación requerida', 401);
    const chats = await chatService.listUserChats(userId);
    res.json({ success: true, chats });
  },

  getMessages: async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw new AppError('Autenticación requerida', 401);
    const { chatId } = req.params;
    const messages = await chatService.getMessages(chatId, userId);
    res.json({ success: true, messages });
  },

  sendMessage: async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw new AppError('Autenticación requerida', 401);
    const { chatId } = req.params;
    const data = sendMessageSchema.parse(req.body);
    const message = await chatService.sendMessage({
      chatId,
      senderId: userId,
      content: data.content ?? '',
      attachmentUrl: data.attachmentUrl
    });
    res.status(201).json({ success: true, message });
  }
};
