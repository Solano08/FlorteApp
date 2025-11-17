"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportPostSchema = exports.feedPaginationSchema = exports.sharePostSchema = exports.createCommentSchema = exports.toggleReactionSchema = exports.createPostSchema = void 0;
const zod_1 = require("zod");
exports.createPostSchema = zod_1.z.object({
    content: zod_1.z.string().trim().min(1, 'La publicacion no puede estar vacia').max(2000),
    mediaUrl: zod_1.z.string().url().optional().nullable(),
    tags: zod_1.z.array(zod_1.z.string().trim().min(1)).max(10).optional(),
    attachments: zod_1.z
        .array(zod_1.z.object({
        url: zod_1.z.string().url(),
        fileName: zod_1.z.string().trim().max(255).optional().nullable(),
        fileType: zod_1.z.string().trim().max(100).optional().nullable()
    }))
        .max(5)
        .optional()
});
exports.toggleReactionSchema = zod_1.z.object({
    reactionType: zod_1.z.enum(['like', 'love', 'wow'])
});
exports.createCommentSchema = zod_1.z.object({
    content: zod_1.z.string().trim().min(1, 'El comentario no puede estar vacio').max(800)
});
exports.sharePostSchema = zod_1.z.object({
    message: zod_1.z.string().trim().max(500).optional()
});
exports.feedPaginationSchema = zod_1.z.object({
    limit: zod_1.z.coerce.number().int().positive().max(50).optional(),
    offset: zod_1.z.coerce.number().int().nonnegative().optional(),
    authorId: zod_1.z.string().uuid().optional()
});
exports.reportPostSchema = zod_1.z.object({
    reason: zod_1.z
        .union([zod_1.z.string().trim().max(500), zod_1.z.literal('')])
        .optional()
        .nullable()
});
