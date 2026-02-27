import { Request, Response } from 'express';
import { storyService } from '../services/storyService';
import { AppError } from '../utils/appError';

export const storyController = {
  async listStories(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) throw new AppError('Autenticacion requerida', 401);
    const stories = await storyService.listStoriesForViewer(userId);
    res.json({ success: true, stories });
  },

  async createStory(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) throw new AppError('Autenticacion requerida', 401);
    const { mediaUrl } = req.body;
    if (!mediaUrl || typeof mediaUrl !== 'string') {
      throw new AppError('mediaUrl es requerido', 400);
    }
    const story = await storyService.createStory(userId, mediaUrl);
    res.status(201).json({ success: true, story });
  },

  async deleteStory(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) throw new AppError('Autenticacion requerida', 401);
    const { storyId } = req.params;
    await storyService.deleteStory(storyId, userId);
    res.json({ success: true });
  },

  async recordView(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) throw new AppError('Autenticacion requerida', 401);
    const { storyId } = req.params;
    await storyService.recordView(storyId, userId);
    res.json({ success: true });
  },

  async getStoryViewers(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) throw new AppError('Autenticacion requerida', 401);
    const { storyId } = req.params;
    const viewers = await storyService.getStoryViewers(storyId, userId);
    res.json({ success: true, viewers });
  }
};
