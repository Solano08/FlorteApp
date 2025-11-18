import { z } from 'zod';

export const createChatSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  memberIds: z.array(z.string().uuid()).min(1),
  isGroup: z.boolean().default(false)
});

export const sendMessageSchema = z.object({
  content: z.string().max(2000).optional(),
  attachmentUrl: z.string().url().optional()
});
