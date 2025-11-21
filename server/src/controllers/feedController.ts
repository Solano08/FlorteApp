import { Request, Response } from 'express';
import { feedService } from '../services/feedService';
import {
  createCommentSchema,
  createPostSchema,
  feedPaginationSchema,
  sharePostSchema,
  toggleReactionSchema
} from '../validators/feedValidators';
import { AppError } from '../utils/appError';

export const feedController = {
  async listFeed(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('Autenticacion requerida', 401);
    }

    const { limit = 15, offset = 0 } = feedPaginationSchema.parse(req.query);
    const posts = await feedService.listPosts(userId, limit, offset);
    res.json({ success: true, posts });
  },

  async createPost(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('Autenticacion requerida', 401);
    }
    const data = createPostSchema.parse(req.body);
    const post = await feedService.createPost(
      {
        authorId: userId,
        content: data.content,
        mediaUrl: data.mediaUrl ?? null,
        tags: data.tags ?? []
      },
      userId
    );
    res.status(201).json({ success: true, post });
  },

  async reactToPost(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('Autenticacion requerida', 401);
    }
    const { postId } = req.params;
    const { reactionType } = toggleReactionSchema.parse(req.body);
    const metrics = await feedService.toggleReaction(postId, userId, reactionType);
    res.json({ success: true, metrics });
  },

  async commentOnPost(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('Autenticacion requerida', 401);
    }
    const { postId } = req.params;
    const { content } = createCommentSchema.parse(req.body);
    const result = await feedService.addComment(
      { postId, userId, content },
      userId
    );
    res.status(201).json({ success: true, ...result });
  },

  async listComments(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('Autenticacion requerida', 401);
    }
    const { postId } = req.params;
    const comments = await feedService.listComments(postId);
    res.json({ success: true, comments });
  },

  async toggleSave(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('Autenticacion requerida', 401);
    }
    const { postId } = req.params;
    const metrics = await feedService.toggleSave(postId, userId);
    res.json({ success: true, metrics });
  },

  async sharePost(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('Autenticacion requerida', 401);
    }
    const { postId } = req.params;
    const { message } = sharePostSchema.parse(req.body);
    const result = await feedService.sharePost({ postId, userId, message });
    res.status(201).json({ success: true, ...result });
  }
};
