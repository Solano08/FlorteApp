import { Request, Response } from 'express';
import { groupService } from '../services/groupService';
import { createGroupSchema } from '../validators/groupValidators';
import { AppError } from '../utils/appError';

export const groupController = {
  create: async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw new AppError('Autenticación requerida', 401);
    const data = createGroupSchema.parse(req.body);
    const group = await groupService.createGroup({ ...data, createdBy: userId });
    res.status(201).json({ success: true, group });
  },

  list: async (_req: Request, res: Response) => {
    const groups = await groupService.listGroups();
    res.json({ success: true, groups });
  },

  listMine: async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw new AppError('Autenticación requerida', 401);
    const groups = await groupService.listUserGroups(userId);
    res.json({ success: true, groups });
  }
};
