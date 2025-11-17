"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPasswordSchema = exports.forgotPasswordSchema = exports.refreshSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    lastName: zod_1.z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
    email: zod_1.z.string().email('Correo inválido'),
    password: zod_1.z.string().min(8, 'La contraseña debe tener al menos 8 caracteres')
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Correo inválido'),
    password: zod_1.z.string().min(1, 'Contraseña requerida')
});
exports.refreshSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(10)
});
exports.forgotPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email('Correo inválido')
});
exports.resetPasswordSchema = zod_1.z.object({
    token: zod_1.z.string().min(10),
    password: zod_1.z.string().min(8, 'La contraseña debe tener al menos 8 caracteres')
});
