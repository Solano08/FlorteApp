"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createResourceSchema = void 0;
const zod_1 = require("zod");
exports.createResourceSchema = zod_1.z.object({
    title: zod_1.z.string().min(3, 'El título debe tener al menos 3 caracteres'),
    description: zod_1.z.string().max(1000).optional(),
    resourceType: zod_1.z.enum(['document', 'video', 'link', 'course', 'other']),
    url: zod_1.z.string().url().optional(),
    tags: zod_1.z.array(zod_1.z.string().min(1)).optional()
});
