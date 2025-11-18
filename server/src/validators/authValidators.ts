import { z } from 'zod';

export const registerSchema = z.object({
  firstName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  lastName: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  email: z.string().email('Correo inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres')
});

export const loginSchema = z.object({
  email: z.string().email('Correo inválido'),
  password: z.string().min(1, 'Contraseña requerida')
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(10)
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Correo inválido')
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres')
});
