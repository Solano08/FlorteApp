import { Request, Response } from 'express';
import { activityService } from '../services/activityService';
import { feedService } from '../services/feedService';
import { profileService } from '../services/profileService';
import { AppError } from '../utils/appError';
import { profileFeedSchema } from '../validators/feedValidators';
import { updateProfileSchema } from '../validators/profileValidators';

export const profileController = {
  me: async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('Autenticacion requerida', 401);
    }
    const profile = await profileService.getProfile(userId);
    res.json({ success: true, profile });
  },

  updateProfile: async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('Autenticacion requerida', 401);
    }
    const data = updateProfileSchema.parse(req.body);
    const profile = await profileService.updateProfile({ userId, ...data });
    res.json({ success: true, profile });
  },

  updateAvatar: async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('Autenticacion requerida', 401);
    }

    const file = req.file;
    const avatarUrl = file ? `/uploads/avatars/${file.filename}` : null;
    const profile = await profileService.updateAvatar(userId, avatarUrl);
    res.json({ success: true, profile });
  },

  updateCover: async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('Autenticacion requerida', 401);
    }

    const file = req.file;
    const coverUrl = file ? `/uploads/covers/${file.filename}` : null;
    const profile = await profileService.updateCover(userId, coverUrl);
    res.json({ success: true, profile });
  },

  activity: async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('Autenticacion requerida', 401);
    }
    const activity = await activityService.getProfileActivity(userId);
    res.json({ success: true, activity });
  },

  recentPosts: async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('Autenticacion requerida', 401);
    }
    const { limit = 6 } = profileFeedSchema.parse(req.query);
    const posts = await feedService.listProfilePosts(userId, userId, limit);
    res.json({ success: true, posts });
  },

  publicProfile: async (req: Request, res: Response) => {
    const requesterId = req.user?.userId;
    if (!requesterId) {
      throw new AppError('Autenticacion requerida', 401);
    }
    const { userId } = req.params;
    if (!userId) {
      throw new AppError('Usuario no valido', 400);
    }
    const profile = await profileService.getProfile(userId);
    res.json({ success: true, profile });
  }
};
