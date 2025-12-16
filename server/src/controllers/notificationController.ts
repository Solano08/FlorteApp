import { Request, Response } from 'express';
import { notificationService } from '../services/notificationService';
import { AppError } from '../utils/appError';

export const notificationController = {
  listMine: async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw new AppError('Autenticación requerida', 401);

    const notifications = await notificationService.listUserNotifications(userId, 50);
    res.json({ success: true, notifications });
  },

  markAsRead: async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw new AppError('Autenticación requerida', 401);
    const { id } = req.params;

    await notificationService.markAsRead(userId, id);
    res.json({ success: true });
  },

  markAllAsRead: async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw new AppError('Autenticación requerida', 401);

    await notificationService.markAllAsRead(userId);
    res.json({ success: true });
  }
};



