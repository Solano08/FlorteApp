import { Request, Response } from 'express';
import { adminService } from '../services/adminService';
import { AppError } from '../utils/appError';
import { updateRoleSchema, updateStatusSchema } from '../validators/adminValidators';

export const adminController = {
  listUsers: async (_req: Request, res: Response) => {
    const users = await adminService.listUsers();
    res.json({ success: true, users });
  },

  updateRole: async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { role } = updateRoleSchema.parse(req.body);
    const actorId = req.user?.userId;
    if (!actorId) throw new AppError('Autenticación requerida', 401);
    const user = await adminService.updateUserRole(actorId, { userId, role });
    res.json({ success: true, user });
  },

  updateStatus: async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { isActive } = updateStatusSchema.parse(req.body);
    const actorId = req.user?.userId;
    if (!actorId) throw new AppError('Autenticación requerida', 401);
    const user = await adminService.updateUserStatus(actorId, { userId, isActive });
    res.json({ success: true, user });
  }
};
