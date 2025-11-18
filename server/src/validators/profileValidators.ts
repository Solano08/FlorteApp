import { z } from 'zod';

const optionalUrl = z.string().url('Ingresa un enlace valido').max(255).optional().nullable();
const optionalEmail = z.string().email('Ingresa un correo valido').max(160).optional().nullable();

export const updateProfileSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  headline: z.string().max(160).optional().nullable(),
  bio: z.string().max(500).optional().nullable(),
  instagramUrl: optionalUrl,
  githubUrl: optionalUrl,
  facebookUrl: optionalUrl,
  contactEmail: optionalEmail,
  xUrl: optionalUrl,
  coverImageUrl: optionalUrl
});
