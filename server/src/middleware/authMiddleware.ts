import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { AppError } from '../utils/appError';
import { UserRole } from '../types/user';

const TOKEN_PREFIXES = ['JWT ', 'Bearer '];

const extractToken = (header: string | undefined): string | null => {
  if (!header) return null;
  for (const prefix of TOKEN_PREFIXES) {
    if (header.startsWith(prefix)) {
      return header.slice(prefix.length);
    }
  }
  return null;
};

export const requireAuth = (req: Request, _res: Response, next: NextFunction): void => {
  const token = extractToken(req.headers.authorization);
  if (!token) {
    throw new AppError('Autenticacion requerida', 401);
  }

  try {
    req.user = verifyAccessToken(token);
    next();
  } catch (error) {
    throw new AppError('Token invalido o expirado', 401);
  }
};

export const attachUserIfPresent = (req: Request, _res: Response, next: NextFunction): void => {
  const token = extractToken(req.headers.authorization);
  if (!token) {
    next();
    return;
  }

  try {
    req.user = verifyAccessToken(token);
  } catch (error) {
    // token invalido, se ignora
  }
  next();
};

export const requireRole = (...roles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError('Autenticacion requerida', 401);
    }

    if (!roles.includes(req.user.role)) {
      throw new AppError('No tienes permisos para realizar esta accion', 403);
    }

    next();
  };
};
