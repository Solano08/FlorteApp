import { Request, Response } from 'express';
import { friendService } from '../services/friendService';
import { AppError } from '../utils/appError';

export const friendController = {
  sendRequest: async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw new AppError('Autenticación requerida', 401);

    const { receiverId } = req.body as { receiverId?: string };
    if (!receiverId) {
      throw new AppError('receiverId es requerido', 400);
    }

    const request = await friendService.sendRequest(userId, receiverId);
    res.status(201).json({ success: true, request });
  },

  listRequests: async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw new AppError('Autenticación requerida', 401);

    const requests = await friendService.listRequests(userId);
    res.json({ success: true, requests });
  },

  cancelRequest: async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw new AppError('Autenticación requerida', 401);

    const { requestId } = req.params;
    await friendService.cancelRequest(requestId, userId);
    res.json({ success: true });
  },

  acceptRequest: async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw new AppError('Autenticación requerida', 401);

    const { requestId } = req.params;
    await friendService.updateRequestStatus(requestId, userId, 'accepted');
    res.json({ success: true });
  },

  rejectRequest: async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw new AppError('Autenticación requerida', 401);

    const { requestId } = req.params;
    await friendService.updateRequestStatus(requestId, userId, 'rejected');
    res.json({ success: true });
  },

  listFriends: async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw new AppError('Autenticación requerida', 401);

    const friendIds = await friendService.listFriends(userId);
    res.json({ success: true, friends: friendIds });
  }
};



