import { z } from 'zod';

const attachmentSchema = z.object({
  url: z.string().trim().min(1, 'Adjunto invalido').max(2000),
  mimeType: z.string().trim().max(100).optional().nullable()
});

export const createPostSchema = z.object({
  content: z.string().trim().min(1, 'La publicacion no puede estar vacia').max(2000),
  mediaUrl: z.string().url().optional().nullable(),
  tags: z.array(z.string().trim().min(1)).max(10).optional(),
  attachments: z.array(attachmentSchema).max(6).optional()
});

export const toggleReactionSchema = z.object({
  reactionType: z.enum(['like', 'celebrate', 'love', 'insightful', 'support'])
});

export const createCommentSchema = z.object({
  content: z.string().trim().min(1, 'El comentario no puede estar vacio').max(800),
  attachmentUrl: z.string().url().max(2000).optional().nullable()
});

export const sharePostSchema = z.object({
  message: z.string().trim().max(500).optional()
});

export const feedPaginationSchema = z.object({
  limit: z.coerce.number().int().positive().max(50).optional(),
  offset: z.coerce.number().int().nonnegative().optional()
});

export const reportPostSchema = z.object({
  reason: z.string().trim().min(3).max(255),
  details: z.string().trim().max(1000).optional(),
  commentId: z.string().uuid().optional()
});

export const updatePostSchema = z
  .object({
    content: z.string().trim().min(1, 'La publicacion no puede estar vacia').max(2000).optional(),
    mediaUrl: z.string().url().optional().nullable(),
    tags: z.array(z.string().trim().min(1)).max(10).optional()
  })
  .refine((value) => value.content !== undefined || value.mediaUrl !== undefined || value.tags !== undefined, {
    message: 'Debes enviar al menos un campo para actualizar.'
  });

export const updateCommentSchema = z.object({
  content: z.string().trim().min(1, 'El comentario no puede estar vacio').max(800)
});

export const profileFeedSchema = z.object({
  limit: z.coerce.number().int().positive().max(50).optional()
});
