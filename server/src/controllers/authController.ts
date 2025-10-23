import { Request, Response } from 'express';
import { authService } from '../services/authService';
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} from '../validators/authValidators';

export const authController = {
  register: async (req: Request, res: Response) => {
    const data = registerSchema.parse(req.body);
    const result = await authService.register(data);
    res.status(201).json({ success: true, ...result });
  },

  login: async (req: Request, res: Response) => {
    const data = loginSchema.parse(req.body);
    const result = await authService.login({
      ...data,
      device: req.headers['user-agent'] ?? undefined,
      ipAddress: req.ip
    });
    res.json({ success: true, ...result });
  },

  refresh: async (req: Request, res: Response) => {
    const { refreshToken } = refreshSchema.parse(req.body);
    const result = await authService.refreshTokens(refreshToken);
    res.json({ success: true, ...result });
  },

  logout: async (req: Request, res: Response) => {
    const { refreshToken } = refreshSchema.parse(req.body);
    await authService.logout(refreshToken);
    res.json({ success: true });
  },

  forgotPassword: async (req: Request, res: Response) => {
    const { email } = forgotPasswordSchema.parse(req.body);
    const result = await authService.requestPasswordReset(email);
    res.json({ success: true, ...result });
  },

  resetPassword: async (req: Request, res: Response) => {
    const { token, password } = resetPasswordSchema.parse(req.body);
    await authService.resetPassword(token, password);
    res.json({ success: true, message: 'Contraseña actualizada correctamente' });
  }
};
