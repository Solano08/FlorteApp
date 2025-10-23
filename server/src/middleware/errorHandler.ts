import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction): void => {
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: 'Datos inválidos',
      errors: err.flatten()
    });
    return;
  }

  const isOperational = err instanceof AppError ? err.isOperational : false;
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message = err.message ?? 'Internal server error';

  logger.error(`[${req.method} ${req.path}] ${message}`, {
    stack: err.stack,
    isOperational
  });

  if (res.headersSent) {
    next(err);
    return;
  }

  res.status(statusCode).json({
    success: false,
    message: isOperational ? message : 'Algo salió mal. Intenta nuevamente más tarde.'
  });
};
