import { Request, Response } from 'express';
import { feedService } from '../services/feedService';
import {
  createCommentSchema,
  createPostSchema,
  feedPaginationSchema,
  reportPostSchema,
  sharePostSchema,
  toggleReactionSchema,
  updateCommentSchema,
  updatePostSchema
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
    const content = data.content?.trim() && data.content.trim().length > 0 ? data.content.trim() : 'Adjunto multimedia';
    const post = await feedService.createPost(
      {
        authorId: userId,
        content,
        mediaUrl: data.mediaUrl ?? null,
        tags: data.tags ?? [],
        attachments: data.attachments ?? []
      },
      userId
    );
    res.status(201).json({ success: true, post });
  },

  async updatePost(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('Autenticacion requerida', 401);
    }
    const userRole = req.user?.role;
    if (!userRole) {
      throw new AppError('No se pudo verificar el rol del usuario', 403);
    }
    const { postId } = req.params;
    const payload = updatePostSchema.parse(req.body);
    const post = await feedService.updatePost(postId, payload, userId, userRole);
    res.json({ success: true, post });
  },

  async deletePost(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('Autenticacion requerida', 401);
    }
    const userRole = req.user?.role;
    if (!userRole) {
      throw new AppError('No se pudo verificar el rol del usuario', 403);
    }
    const { postId } = req.params;
    await feedService.deletePost(postId, userId, userRole);
    res.json({ success: true });
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
    const parsed = createCommentSchema.parse(req.body);
    const content = parsed.content?.trim() ?? '';
    const attachmentUrl = parsed.attachmentUrl ?? null;
    const safeContent = content.length > 0 ? content : 'Adjunto multimedia';
    const result = await feedService.addComment(
      { postId, userId, content: safeContent, attachmentUrl },
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

  async updateComment(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('Autenticacion requerida', 401);
    }
    const userRole = req.user?.role;
    if (!userRole) {
      throw new AppError('No se pudo verificar el rol del usuario', 403);
    }
    const { postId, commentId } = req.params;
    const { content } = updateCommentSchema.parse(req.body);
    const comment = await feedService.updateComment(postId, commentId, content, userId, userRole);
    res.json({ success: true, comment });
  },

  async deleteComment(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('Autenticacion requerida', 401);
    }
    const userRole = req.user?.role;
    if (!userRole) {
      throw new AppError('No se pudo verificar el rol del usuario', 403);
    }
    const { postId, commentId } = req.params;
    const metrics = await feedService.deleteComment(postId, commentId, userId, userRole);
    res.json({ success: true, metrics });
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
  },

  async getPost(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('Autenticacion requerida', 401);
    }
    const { postId } = req.params;
    const post = await feedService.getPost(postId, userId);
    if (!post) {
      throw new AppError('Publicacion no encontrada', 404);
    }
    res.json({ success: true, post });
  },

  async reportPost(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('Autenticacion requerida', 401);
    }
    const { postId } = req.params;
    const data = reportPostSchema.parse(req.body);
    const report = await feedService.reportPost({
      postId,
      reporterId: userId,
      reason: data.reason,
      details: data.details,
      commentId: data.commentId ?? null
    });
    res.status(201).json({ success: true, report });
  },

  async listSavedPosts(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('Autenticacion requerida', 401);
    }
    const { limit = 10 } = feedPaginationSchema.parse(req.query);
    const savedPosts = await feedService.listSavedPosts(userId, limit);
    res.json({ success: true, savedPosts });
  }
};
