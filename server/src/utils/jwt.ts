import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { TokenPayload } from '../types/auth';

export const generateAccessToken = (payload: TokenPayload): string => {
  const expiresIn = env.jwtAccessExpiry as SignOptions['expiresIn'];
  return jwt.sign(payload, env.jwtAccessSecret, { expiresIn });
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  const expiresIn = env.jwtRefreshExpiry as SignOptions['expiresIn'];
  return jwt.sign(payload, env.jwtRefreshSecret, { expiresIn });
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.jwtAccessSecret) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.jwtRefreshSecret) as TokenPayload;
};
