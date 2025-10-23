import { Request, Response } from 'express';
import { profileService } from '../services/profileService';
import { updateProfileSchema } from '../validators/profileValidators';
import { AppError } from '../utils/appError';

export const profileController = {
  me: async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('Autenticación requerida', 401);
    }
    const profile = await profileService.getProfile(userId);
    res.json({ success: true, profile });
  },

  updateProfile: async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('Autenticación requerida', 401);
    }
    const data = updateProfileSchema.parse(req.body);
    const profile = await profileService.updateProfile({ userId, ...data });
    res.json({ success: true, profile });
  },

  updateAvatar: async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('Autenticación requerida', 401);
    }

    const file = req.file;
    const avatarUrl = file ? `/uploads/avatars/${file.filename}` : null;
    const profile = await profileService.updateAvatar(userId, avatarUrl);
    res.json({ success: true, profile });
  }
};
