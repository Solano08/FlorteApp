import { z } from 'zod';

export const createPostSchema = z.object({
  content: z.string().trim().min(1, 'La publicacion no puede estar vacia').max(2000),
  mediaUrl: z.string().url().optional().nullable(),
  tags: z.array(z.string().trim().min(1)).max(10).optional()
});

export const toggleReactionSchema = z.object({
  reactionType: z.enum(['like', 'celebrate', 'love', 'insightful', 'support'])
});

export const createCommentSchema = z.object({
  content: z.string().trim().min(1, 'El comentario no puede estar vacio').max(800)
});

export const sharePostSchema = z.object({
  message: z.string().trim().max(500).optional()
});

export const feedPaginationSchema = z.object({
  limit: z.coerce.number().int().positive().max(50).optional(),
  offset: z.coerce.number().int().nonnegative().optional()
});
