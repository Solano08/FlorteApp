import { z } from 'zod';

export const updateRoleSchema = z.object({
  role: z.enum(['admin', 'instructor', 'apprentice'])
});

export const updateStatusSchema = z.object({
  isActive: z.boolean()
});
