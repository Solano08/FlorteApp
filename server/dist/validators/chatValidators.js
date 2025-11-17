"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMessageSchema = exports.createChatSchema = void 0;
const zod_1 = require("zod");
exports.createChatSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(120).optional(),
    memberIds: zod_1.z.array(zod_1.z.string().uuid()).min(1),
    isGroup: zod_1.z.boolean().default(false)
});
exports.sendMessageSchema = zod_1.z.object({
    content: zod_1.z.string().max(2000).optional(),
    attachmentUrl: zod_1.z.string().url().optional()
});
