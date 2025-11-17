"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.attachUserIfPresent = exports.requireAuth = void 0;
const jwt_1 = require("../utils/jwt");
const appError_1 = require("../utils/appError");
const TOKEN_PREFIXES = ['JWT ', 'Bearer '];
const extractToken = (header) => {
    if (!header)
        return null;
    for (const prefix of TOKEN_PREFIXES) {
        if (header.startsWith(prefix)) {
            return header.slice(prefix.length);
        }
    }
    return null;
};
const requireAuth = (req, _res, next) => {
    const token = extractToken(req.headers.authorization);
    if (!token) {
        throw new appError_1.AppError('Autenticacion requerida', 401);
    }
    try {
        req.user = (0, jwt_1.verifyAccessToken)(token);
        next();
    }
    catch (error) {
        throw new appError_1.AppError('Token invalido o expirado', 401);
    }
};
exports.requireAuth = requireAuth;
const attachUserIfPresent = (req, _res, next) => {
    const token = extractToken(req.headers.authorization);
    if (!token) {
        next();
        return;
    }
    try {
        req.user = (0, jwt_1.verifyAccessToken)(token);
    }
    catch (error) {
        // token invalido, se ignora
    }
    next();
};
exports.attachUserIfPresent = attachUserIfPresent;
const requireRole = (...roles) => {
    return (req, _res, next) => {
        if (!req.user) {
            throw new appError_1.AppError('Autenticacion requerida', 401);
        }
        if (!roles.includes(req.user.role)) {
            throw new appError_1.AppError('No tienes permisos para realizar esta accion', 403);
        }
        next();
    };
};
exports.requireRole = requireRole;
