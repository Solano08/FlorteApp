"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const ms_1 = __importDefault(require("ms"));
const database_1 = require("../config/database");
const userRepository_1 = require("../repositories/userRepository");
const sessionRepository_1 = require("../repositories/sessionRepository");
const passwordResetRepository_1 = require("../repositories/passwordResetRepository");
const password_1 = require("../utils/password");
const appError_1 = require("../utils/appError");
const jwt_1 = require("../utils/jwt");
const env_1 = require("../config/env");
const logger_1 = require("../utils/logger");
const activityService_1 = require("./activityService");
const JWT_PREFIX = 'JWT ';
const LEGACY_PREFIX = 'Bearer ';
const mapUserToAuth = (user) => ({
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    avatarUrl: user.avatarUrl ?? null,
    coverImageUrl: user.coverImageUrl ?? null,
    headline: user.headline ?? null,
    bio: user.bio ?? null,
    instagramUrl: user.instagramUrl ?? null,
    githubUrl: user.githubUrl ?? null,
    facebookUrl: user.facebookUrl ?? null,
    contactEmail: user.contactEmail ?? null,
    xUrl: user.xUrl ?? null,
    role: user.role,
    isActive: user.isActive
});
const hashToken = (token) => {
    return crypto_1.default.createHash('sha256').update(token).digest('hex');
};
const addJwtPrefix = (token) => `${JWT_PREFIX}${token}`;
const stripTokenPrefix = (token) => {
    if (token.startsWith(JWT_PREFIX))
        return token.slice(JWT_PREFIX.length);
    if (token.startsWith(LEGACY_PREFIX))
        return token.slice(LEGACY_PREFIX.length);
    return token;
};
const getRefreshExpiry = () => {
    const duration = (0, ms_1.default)(env_1.env.jwtRefreshExpiry);
    if (typeof duration !== 'number') {
        throw new appError_1.AppError('Configuracion de expiracion invalida', 500);
    }
    return new Date(Date.now() + duration);
};
const buildTokens = (payload) => ({
    accessToken: (0, jwt_1.generateAccessToken)(payload),
    refreshToken: (0, jwt_1.generateRefreshToken)(payload)
});
const withJwtPrefix = (tokens) => ({
    accessToken: addJwtPrefix(tokens.accessToken),
    refreshToken: addJwtPrefix(tokens.refreshToken)
});
const ensureUserIsActive = (user) => {
    if (!user.isActive) {
        throw new appError_1.AppError('Tu cuenta esta suspendida. Contacta a un administrador.', 403);
    }
};
exports.authService = {
    async register(input) {
        const existing = await userRepository_1.userRepository.findByEmail(input.email);
        if (existing) {
            throw new appError_1.AppError('El correo ya esta registrado', 409);
        }
        const passwordHash = await (0, password_1.hashPassword)(input.password);
        const user = await userRepository_1.userRepository.createUser({
            firstName: input.firstName,
            lastName: input.lastName,
            email: input.email,
            passwordHash,
            role: 'apprentice'
        });
        ensureUserIsActive(user);
        const payload = {
            userId: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role
        };
        const rawTokens = buildTokens(payload);
        const tokens = withJwtPrefix(rawTokens);
        await sessionRepository_1.sessionRepository.createSession({
            userId: user.id,
            refreshTokenHash: hashToken(rawTokens.refreshToken),
            expiresAt: getRefreshExpiry()
        });
        return { user: mapUserToAuth(user), tokens };
    },
    async login(input) {
        const user = await userRepository_1.userRepository.findByEmail(input.email);
        if (!user) {
            throw new appError_1.AppError('Credenciales invalidas', 401);
        }
        const passwordOk = await (0, password_1.verifyPassword)(input.password, user.passwordHash);
        if (!passwordOk) {
            throw new appError_1.AppError('Credenciales invalidas', 401);
        }
        ensureUserIsActive(user);
        const payload = {
            userId: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role
        };
        const rawTokens = buildTokens(payload);
        const tokens = withJwtPrefix(rawTokens);
        await sessionRepository_1.sessionRepository.createSession({
            userId: user.id,
            refreshTokenHash: hashToken(rawTokens.refreshToken),
            expiresAt: getRefreshExpiry(),
            device: input.device,
            ipAddress: input.ipAddress
        });
        await activityService_1.activityService.recordLogin(user.id).catch(() => { });
        return { user: mapUserToAuth(user), tokens };
    },
    async refreshTokens(refreshToken) {
        try {
            const rawRefreshToken = stripTokenPrefix(refreshToken);
            const payload = (0, jwt_1.verifyRefreshToken)(rawRefreshToken);
            const tokenHash = hashToken(rawRefreshToken);
            const session = await sessionRepository_1.sessionRepository.findByRefreshTokenHash(tokenHash);
            if (!session || session.expiresAt < new Date()) {
                throw new appError_1.AppError('Sesion expirada', 401);
            }
            const user = await userRepository_1.userRepository.findById(payload.userId);
            if (!user) {
                throw new appError_1.AppError('Usuario no encontrado', 404);
            }
            ensureUserIsActive(user);
            const newPayload = {
                userId: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role
            };
            const rawTokens = buildTokens(newPayload);
            const tokens = withJwtPrefix(rawTokens);
            await sessionRepository_1.sessionRepository.createSession({
                userId: user.id,
                refreshTokenHash: hashToken(rawTokens.refreshToken),
                expiresAt: getRefreshExpiry()
            });
            await sessionRepository_1.sessionRepository.deleteSession(session.id);
            return { user: mapUserToAuth(user), tokens };
        }
        catch (error) {
            throw new appError_1.AppError('Token invalido o expirado', 401);
        }
    },
    async logout(refreshToken) {
        const tokenHash = hashToken(stripTokenPrefix(refreshToken));
        const session = await sessionRepository_1.sessionRepository.findByRefreshTokenHash(tokenHash);
        if (session) {
            await sessionRepository_1.sessionRepository.deleteSession(session.id);
        }
    },
    async requestPasswordReset(email) {
        const user = await userRepository_1.userRepository.findByEmail(email);
        if (!user) {
            return { message: 'Si el correo existe, recibiras instrucciones para recuperar la contrasena' };
        }
        await passwordResetRepository_1.passwordResetRepository.deleteByUser(user.id);
        const token = crypto_1.default.randomBytes(32).toString('hex');
        const tokenHash = hashToken(token);
        const expiresAt = new Date(Date.now() + (0, ms_1.default)('1h'));
        await passwordResetRepository_1.passwordResetRepository.create(user.id, tokenHash, expiresAt);
        logger_1.logger.info('Password reset token generated', { userId: user.id });
        return {
            message: 'Revisa tu correo para completar el proceso de recuperacion',
            token: env_1.env.nodeEnv === 'development' ? token : undefined
        };
    },
    async resetPassword(token, newPassword) {
        const tokenHash = hashToken(token);
        const record = await passwordResetRepository_1.passwordResetRepository.findByHash(tokenHash);
        if (!record || record.expiresAt < new Date()) {
            throw new appError_1.AppError('El enlace de recuperacion no es valido o expiro', 400);
        }
        const user = await userRepository_1.userRepository.findById(record.userId);
        if (!user) {
            throw new appError_1.AppError('Usuario no encontrado', 404);
        }
        const passwordHash = await (0, password_1.hashPassword)(newPassword);
        await (0, database_1.getPool)().execute('UPDATE users SET password_hash = :passwordHash WHERE id = :userId', { passwordHash, userId: user.id });
        await sessionRepository_1.sessionRepository.deleteSessionsByUser(user.id);
        await passwordResetRepository_1.passwordResetRepository.delete(record.id);
    }
};
