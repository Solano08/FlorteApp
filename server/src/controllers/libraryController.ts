import { Request, Response } from 'express';
import { libraryService } from '../services/libraryService';
import { createResourceSchema } from '../validators/libraryValidators';
import { AppError } from '../utils/appError';

export const libraryController = {
  create: async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw new AppError('Autenticación requerida', 401);
    const data = createResourceSchema.parse(req.body);
    const resource = await libraryService.createResource({ ...data, uploadedBy: userId });
    res.status(201).json({ success: true, resource });
  },

  list: async (_req: Request, res: Response) => {
    const resources = await libraryService.listResources();
    res.json({ success: true, resources });
  },

  search: async (req: Request, res: Response) => {
    const term = (req.query.q as string) ?? '';
    const resources = await libraryService.searchResources(term);
    res.json({ success: true, resources });
  },

  listMine: async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw new AppError('Autenticación requerida', 401);
    const resources = await libraryService.listByUser(userId);
    res.json({ success: true, resources });
  }
};
