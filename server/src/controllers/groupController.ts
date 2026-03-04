import { Request, Response } from 'express';
import { uploadBuffer } from '../services/cloudinaryService';
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
  },

  get: async (req: Request, res: Response) => {
    const { id } = req.params;
    const group = await groupService.getGroup(id);
    if (!group) {
      throw new AppError('Comunidad no encontrada', 404);
    }
    res.json({ success: true, group });
  },

  join: async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw new AppError('Autenticación requerida', 401);
    const { id } = req.params;
    await groupService.addMember(id, userId);
    res.json({ success: true });
  },

  leave: async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw new AppError('Autenticación requerida', 401);
    const { id } = req.params;
    await groupService.leaveGroup(id, userId);
    res.json({ success: true });
  },

  delete: async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw new AppError('Autenticación requerida', 401);
    const { id } = req.params;
    const { password } = req.body as { password?: string };

    if (!password) {
      throw new AppError('La contraseña es obligatoria para eliminar la comunidad', 400);
    }

    await groupService.deleteGroup(id, userId, password);
    res.json({ success: true });
  },

  uploadIcon: async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw new AppError('Autenticación requerida', 401);
    const { id } = req.params;

    const file = req.file;
    if (!file?.buffer) {
      throw new AppError('No se proporcionó ningún archivo', 400);
    }

    const iconUrl = await uploadBuffer(file.buffer, 'communities', {
      mimetype: file.mimetype,
      filename: file.originalname
    });
    const group = await groupService.updateIcon(id, iconUrl);
    res.json({ success: true, group });
  },

  uploadCover: async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw new AppError('Autenticación requerida', 401);
    const { id } = req.params;

    const file = req.file;
    if (!file?.buffer) {
      throw new AppError('No se proporcionó ningún archivo', 400);
    }

    const coverUrl = await uploadBuffer(file.buffer, 'communities', {
      mimetype: file.mimetype,
      filename: file.originalname
    });
    const group = await groupService.updateCover(id, coverUrl);
    res.json({ success: true, group });
  }
};
