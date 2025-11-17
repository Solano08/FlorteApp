"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGroupSchema = void 0;
const zod_1 = require("zod");
exports.createGroupSchema = zod_1.z.object({
    name: zod_1.z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
    description: zod_1.z.string().max(500).optional(),
    coverImage: zod_1.z.string().url().optional()
});
