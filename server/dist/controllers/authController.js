"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = void 0;
const authService_1 = require("../services/authService");
const authValidators_1 = require("../validators/authValidators");
exports.authController = {
    register: async (req, res) => {
        const data = authValidators_1.registerSchema.parse(req.body);
        const result = await authService_1.authService.register(data);
        res.status(201).json({ success: true, ...result });
    },
    login: async (req, res) => {
        const data = authValidators_1.loginSchema.parse(req.body);
        const result = await authService_1.authService.login({
            ...data,
            device: req.headers['user-agent'] ?? undefined,
            ipAddress: req.ip
        });
        res.json({ success: true, ...result });
    },
    refresh: async (req, res) => {
        const { refreshToken } = authValidators_1.refreshSchema.parse(req.body);
        const result = await authService_1.authService.refreshTokens(refreshToken);
        res.json({ success: true, ...result });
    },
    logout: async (req, res) => {
        const { refreshToken } = authValidators_1.refreshSchema.parse(req.body);
        await authService_1.authService.logout(refreshToken);
        res.json({ success: true });
    },
    forgotPassword: async (req, res) => {
        const { email } = authValidators_1.forgotPasswordSchema.parse(req.body);
        const result = await authService_1.authService.requestPasswordReset(email);
        res.json({ success: true, ...result });
    },
    resetPassword: async (req, res) => {
        const { token, password } = authValidators_1.resetPasswordSchema.parse(req.body);
        await authService_1.authService.resetPassword(token, password);
        res.json({ success: true, message: 'Contraseña actualizada correctamente' });
    }
};
