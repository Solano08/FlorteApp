import { z } from 'zod';

export const updateProfileSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  headline: z.string().max(160).optional().nullable(),
  bio: z.string().max(500).optional().nullable()
});
