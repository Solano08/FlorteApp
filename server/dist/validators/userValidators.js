"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserSchema = exports.createUserSchema = exports.userIdParamSchema = void 0;
const zod_1 = require("zod");
const roles = ['admin', 'instructor', 'apprentice'];
exports.userIdParamSchema = zod_1.z.object({
    userId: zod_1.z.string().uuid()
});
exports.createUserSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1, 'El nombre es requerido'),
    lastName: zod_1.z.string().min(1, 'El apellido es requerido'),
    email: zod_1.z.string().email('Correo electronico invalido'),
    password: zod_1.z.string().min(6, 'La contrasena debe tener al menos 6 caracteres'),
    role: zod_1.z.enum(roles).optional(),
    isActive: zod_1.z.boolean().optional()
});
exports.updateUserSchema = zod_1.z
    .object({
    firstName: zod_1.z.string().min(1, 'El nombre es requerido').optional(),
    lastName: zod_1.z.string().min(1, 'El apellido es requerido').optional(),
    email: zod_1.z.string().email('Correo electronico invalido').optional(),
    password: zod_1.z.string().min(6, 'La contrasena debe tener al menos 6 caracteres').optional(),
    role: zod_1.z.enum(roles).optional(),
    isActive: zod_1.z.boolean().optional()
})
    .refine((data) => Object.keys(data).length > 0, {
    message: 'Debes proporcionar al menos un campo para actualizar'
});
