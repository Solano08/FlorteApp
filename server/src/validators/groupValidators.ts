import { z } from 'zod';

export const createGroupSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  description: z.string().max(500).optional(),
  coverImage: z.string().url().optional()
});
