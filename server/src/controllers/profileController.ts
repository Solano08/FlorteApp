import { Request, Response } from 'express';
import { profileService } from '../services/profileService';
import { updateProfileSchema, profileActivityQuerySchema, profilePostsQuerySchema } from '../validators/profileValidators';
import { AppError } from '../utils/appError';
import { activityService } from '../services/activityService';
import { feedService } from '../services/feedService';

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

  activityOverview: async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('Autenticacion requerida', 401);
    }
    const { weeks } = profileActivityQuerySchema.parse(req.query);
    const activity = await activityService.getProfileActivity(userId, weeks);
    res.json({ success: true, activity });
  },

  recentPosts: async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('Autenticacion requerida', 401);
    }
    const { limit } = profilePostsQuerySchema.parse(req.query);
    const posts = await feedService.listPosts({ viewerId: userId, limit, authorId: userId });
    res.json({ success: true, posts });
  }
};
