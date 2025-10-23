import crypto from 'crypto';
import ms from 'ms';
import type { StringValue } from 'ms';
import { getPool } from '../config/database';
import { userRepository } from '../repositories/userRepository';
import { sessionRepository } from '../repositories/sessionRepository';
import { passwordResetRepository } from '../repositories/passwordResetRepository';
import { hashPassword, verifyPassword } from '../utils/password';
import { AppError } from '../utils/appError';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { env } from '../config/env';
import { AuthResult, AuthUser, TokenPayload } from '../types/auth';
import { logger } from '../utils/logger';
import { User } from '../types/user';

const JWT_PREFIX = 'JWT ';
const LEGACY_PREFIX = 'Bearer ';

const mapUserToAuth = (user: User): AuthUser => ({
  id: user.id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  avatarUrl: user.avatarUrl ?? null,
  headline: user.headline ?? null,
  bio: user.bio ?? null,
  role: user.role,
  isActive: user.isActive
});

const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

const addJwtPrefix = (token: string): string => `${JWT_PREFIX}${token}`;
const stripTokenPrefix = (token: string): string => {
  if (token.startsWith(JWT_PREFIX)) return token.slice(JWT_PREFIX.length);
  if (token.startsWith(LEGACY_PREFIX)) return token.slice(LEGACY_PREFIX.length);
  return token;
};

const getRefreshExpiry = (): Date => {
  const duration = ms(env.jwtRefreshExpiry as StringValue);
  if (typeof duration !== 'number') {
    throw new AppError('Configuracion de expiracion invalida', 500);
  }
  return new Date(Date.now() + duration);
};

const buildTokens = (payload: TokenPayload) => ({
  accessToken: generateAccessToken(payload),
  refreshToken: generateRefreshToken(payload)
});

const withJwtPrefix = (tokens: { accessToken: string; refreshToken: string }) => ({
  accessToken: addJwtPrefix(tokens.accessToken),
  refreshToken: addJwtPrefix(tokens.refreshToken)
});

const ensureUserIsActive = (user: User): void => {
  if (!user.isActive) {
    throw new AppError('Tu cuenta esta suspendida. Contacta a un administrador.', 403);
  }
};

export const authService = {
  async register(input: { firstName: string; lastName: string; email: string; password: string }): Promise<AuthResult> {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) {
      throw new AppError('El correo ya esta registrado', 409);
    }

    const passwordHash = await hashPassword(input.password);
    const user = await userRepository.createUser({
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      passwordHash,
      role: 'apprentice'
    });

    ensureUserIsActive(user);

    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    };

    const rawTokens = buildTokens(payload);
    const tokens = withJwtPrefix(rawTokens);

    await sessionRepository.createSession({
      userId: user.id,
      refreshTokenHash: hashToken(rawTokens.refreshToken),
      expiresAt: getRefreshExpiry()
    });

    return { user: mapUserToAuth(user), tokens };
  },

  async login(input: { email: string; password: string; device?: string; ipAddress?: string }): Promise<AuthResult> {
    const user = await userRepository.findByEmail(input.email);
    if (!user) {
      throw new AppError('Credenciales invalidas', 401);
    }

    const passwordOk = await verifyPassword(input.password, user.passwordHash);
    if (!passwordOk) {
      throw new AppError('Credenciales invalidas', 401);
    }

    ensureUserIsActive(user);

    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    };

    const rawTokens = buildTokens(payload);
    const tokens = withJwtPrefix(rawTokens);

    await sessionRepository.createSession({
      userId: user.id,
      refreshTokenHash: hashToken(rawTokens.refreshToken),
      expiresAt: getRefreshExpiry(),
      device: input.device,
      ipAddress: input.ipAddress
    });

    return { user: mapUserToAuth(user), tokens };
  },

  async refreshTokens(refreshToken: string): Promise<AuthResult> {
    try {
      const rawRefreshToken = stripTokenPrefix(refreshToken);
      const payload = verifyRefreshToken(rawRefreshToken);
      const tokenHash = hashToken(rawRefreshToken);
      const session = await sessionRepository.findByRefreshTokenHash(tokenHash);

      if (!session || session.expiresAt < new Date()) {
        throw new AppError('Sesion expirada', 401);
      }

      const user = await userRepository.findById(payload.userId);
      if (!user) {
        throw new AppError('Usuario no encontrado', 404);
      }

      ensureUserIsActive(user);

      const newPayload: TokenPayload = {
        userId: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      };

      const rawTokens = buildTokens(newPayload);
      const tokens = withJwtPrefix(rawTokens);

      await sessionRepository.createSession({
        userId: user.id,
        refreshTokenHash: hashToken(rawTokens.refreshToken),
        expiresAt: getRefreshExpiry()
      });

      await sessionRepository.deleteSession(session.id);

      return { user: mapUserToAuth(user), tokens };
    } catch (error) {
      throw new AppError('Token invalido o expirado', 401);
    }
  },

  async logout(refreshToken: string): Promise<void> {
    const tokenHash = hashToken(stripTokenPrefix(refreshToken));
    const session = await sessionRepository.findByRefreshTokenHash(tokenHash);
    if (session) {
      await sessionRepository.deleteSession(session.id);
    }
  },

  async requestPasswordReset(email: string): Promise<{ message: string; token?: string }> {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      return { message: 'Si el correo existe, recibiras instrucciones para recuperar la contrasena' };
    }

    await passwordResetRepository.deleteByUser(user.id);

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + ms('1h' as StringValue));

    await passwordResetRepository.create(user.id, tokenHash, expiresAt);
    logger.info('Password reset token generated', { userId: user.id });

    return {
      message: 'Revisa tu correo para completar el proceso de recuperacion',
      token: env.nodeEnv === 'development' ? token : undefined
    };
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const tokenHash = hashToken(token);
    const record = await passwordResetRepository.findByHash(tokenHash);
    if (!record || record.expiresAt < new Date()) {
      throw new AppError('El enlace de recuperacion no es valido o expiro', 400);
    }

    const user = await userRepository.findById(record.userId);
    if (!user) {
      throw new AppError('Usuario no encontrado', 404);
    }

    const passwordHash = await hashPassword(newPassword);
    await getPool().execute(
      'UPDATE users SET password_hash = :passwordHash WHERE id = :userId',
      { passwordHash, userId: user.id }
    );

    await sessionRepository.deleteSessionsByUser(user.id);
    await passwordResetRepository.delete(record.id);
  }
};
