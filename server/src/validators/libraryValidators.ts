import { z } from 'zod';

export const createResourceSchema = z.object({
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres'),
  description: z.string().max(1000).optional(),
  resourceType: z.enum(['document', 'video', 'link', 'course', 'other']),
  url: z.string().url().optional(),
  tags: z.array(z.string().min(1)).optional()
});
