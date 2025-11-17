import { Request, Response } from 'express';
import { adminService } from '../services/adminService';
import { feedService } from '../services/feedService';
import { AppError } from '../utils/appError';
import {
  adminUpdateUserSchema,
  updateReportStatusSchema,
  updateRoleSchema,
  updateStatusSchema
} from '../validators/adminValidators';

export const adminController = {
  listUsers: async (_req: Request, res: Response) => {
    const users = await adminService.listUsers();
    res.json({ success: true, users });
  },

  updateRole: async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { role } = updateRoleSchema.parse(req.body);
    const actorId = req.user?.userId;
    if (!actorId) throw new AppError('Autenticacion requerida', 401);
    const user = await adminService.updateUserRole(actorId, { userId, role });
    res.json({ success: true, user });
  },

  updateStatus: async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { isActive } = updateStatusSchema.parse(req.body);
    const actorId = req.user?.userId;
    if (!actorId) throw new AppError('Autenticacion requerida', 401);
    const user = await adminService.updateUserStatus(actorId, { userId, isActive });
    res.json({ success: true, user });
  },

  updateUser: async (req: Request, res: Response) => {
    const { userId } = req.params;
    const actorId = req.user?.userId;
    if (!actorId) throw new AppError('Autenticacion requerida', 401);
    const data = adminUpdateUserSchema.parse(req.body);
    const user = await adminService.updateUser(actorId, { userId, ...data });
    res.json({ success: true, user });
  },

  listReports: async (_req: Request, res: Response) => {
    const reports = await feedService.listReports();
    res.json({ success: true, reports });
  },

  updateReportStatus: async (req: Request, res: Response) => {
    const { reportId } = req.params;
    const { status } = updateReportStatusSchema.parse(req.body);
    const report = await feedService.updateReportStatus(reportId, status);
    res.json({ success: true, report });
  }
};
