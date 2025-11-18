import { z } from 'zod';

export const updateRoleSchema = z.object({
  role: z.enum(['admin', 'instructor', 'apprentice'])
});

export const updateStatusSchema = z.object({
  isActive: z.boolean()
});

export const updateReportStatusSchema = z.object({
  status: z.enum(['pending', 'reviewed'])
});

const optionalUrl = z.string().url('Ingresa un enlace valido').max(255).optional().nullable();
const optionalEmail = z.string().email('Ingresa un correo valido').max(160).optional().nullable();

export const adminUpdateUserSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.enum(['admin', 'instructor', 'apprentice']).optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(6).optional(),
  headline: z.string().max(160).optional().nullable(),
  bio: z.string().max(500).optional().nullable(),
  avatarUrl: z.string().url('Ingresa un enlace valido').max(255).optional().nullable(),
  coverImageUrl: optionalUrl,
  instagramUrl: optionalUrl,
  githubUrl: optionalUrl,
  facebookUrl: optionalUrl,
  contactEmail: optionalEmail,
  xUrl: optionalUrl
});
