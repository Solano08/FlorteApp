import { z } from 'zod';

const roles = ['admin', 'instructor', 'apprentice'] as const;

export const userIdParamSchema = z.object({
  userId: z.string().uuid()
});

export const createUserSchema = z.object({
  firstName: z.string().min(1, 'El nombre es requerido'),
  lastName: z.string().min(1, 'El apellido es requerido'),
  email: z.string().email('Correo electronico invalido'),
  password: z.string().min(6, 'La contrasena debe tener al menos 6 caracteres'),
  role: z.enum(roles).optional(),
  isActive: z.boolean().optional()
});

export const updateUserSchema = z
  .object({
    firstName: z.string().min(1, 'El nombre es requerido').optional(),
    lastName: z.string().min(1, 'El apellido es requerido').optional(),
    email: z.string().email('Correo electronico invalido').optional(),
    password: z.string().min(6, 'La contrasena debe tener al menos 6 caracteres').optional(),
    role: z.enum(roles).optional(),
    isActive: z.boolean().optional()
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Debes proporcionar al menos un campo para actualizar'
  });
