import { z } from 'zod';

const dataUrlSchema = z
  .string()
  .trim()
  .regex(/^data:(.*);base64,/i, 'Adjunto invalido')
  .max(10_000_000); // 10MB máximo

const remoteOrDataUrlSchema = z.union([
  z.string().trim().url(),
  dataUrlSchema
]);

export const createChatSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  memberIds: z.array(z.string().uuid()).min(1),
  isGroup: z.boolean().default(false)
});

export const sendMessageSchema = z.object({
  content: z.string().max(2000).optional(),
  attachmentUrl: remoteOrDataUrlSchema.optional().nullable(),
  sharedPostId: z.string().uuid().optional().nullable()
}).refine(
  (value) => Boolean(value.content?.trim()) || Boolean(value.attachmentUrl) || Boolean(value.sharedPostId),
  { message: 'El mensaje debe tener contenido, un archivo adjunto o una publicación compartida' }
);
