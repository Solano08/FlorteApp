"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.profilePostsQuerySchema = exports.profileActivityQuerySchema = exports.updateProfileSchema = void 0;
const zod_1 = require("zod");
const optionalUrl = zod_1.z.string().url('Ingresa un enlace valido').max(255).optional().nullable();
const optionalEmail = zod_1.z.string().email('Ingresa un correo valido').max(160).optional().nullable();
exports.updateProfileSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(2).optional(),
    lastName: zod_1.z.string().min(2).optional(),
    headline: zod_1.z.string().max(160).optional().nullable(),
    bio: zod_1.z.string().max(500).optional().nullable(),
    instagramUrl: optionalUrl,
    githubUrl: optionalUrl,
    facebookUrl: optionalUrl,
    contactEmail: optionalEmail,
    xUrl: optionalUrl,
    coverImageUrl: optionalUrl
});
exports.profileActivityQuerySchema = zod_1.z.object({
    weeks: zod_1.z.coerce.number().int().min(1).max(12).optional()
});
exports.profilePostsQuerySchema = zod_1.z.object({
    limit: zod_1.z.coerce.number().int().positive().max(10).optional()
});
