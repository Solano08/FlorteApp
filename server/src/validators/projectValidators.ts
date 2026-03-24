import { z } from 'zod';

export const createProjectSchema = z.object({
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres'),
  description: z.string().max(1000).optional(),
  repositoryUrl: z.string().url().optional(),
  status: z.enum(['draft', 'in_progress', 'completed']).optional()
});

export const updateProjectSchema = createProjectSchema.partial();

export const updateWorkspaceNotesSchema = z.object({
  notes: z.string().max(50_000).nullable()
});
