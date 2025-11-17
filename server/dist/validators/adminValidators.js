"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateReportStatusSchema = exports.adminUpdateUserSchema = exports.updateStatusSchema = exports.updateRoleSchema = void 0;
const zod_1 = require("zod");
exports.updateRoleSchema = zod_1.z.object({
    role: zod_1.z.enum(['admin', 'instructor', 'apprentice'])
});
exports.updateStatusSchema = zod_1.z.object({
    isActive: zod_1.z.boolean()
});
const optionalUrl = zod_1.z.string().url('Ingresa un enlace valido').max(255).optional().nullable();
const optionalEmail = zod_1.z.string().email('Ingresa un correo valido').max(160).optional().nullable();
exports.adminUpdateUserSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(2).optional(),
    lastName: zod_1.z.string().min(2).optional(),
    email: zod_1.z.string().email().optional(),
    role: zod_1.z.enum(['admin', 'instructor', 'apprentice']).optional(),
    isActive: zod_1.z.boolean().optional(),
    password: zod_1.z.string().min(6).optional(),
    headline: zod_1.z.string().max(160).optional().nullable(),
    bio: zod_1.z.string().max(500).optional().nullable(),
    avatarUrl: zod_1.z.string().url('Ingresa un enlace valido').max(255).optional().nullable(),
    coverImageUrl: optionalUrl,
    instagramUrl: optionalUrl,
    githubUrl: optionalUrl,
    facebookUrl: optionalUrl,
    contactEmail: optionalEmail,
    xUrl: optionalUrl
});
exports.updateReportStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(['pending', 'reviewed'])
});
