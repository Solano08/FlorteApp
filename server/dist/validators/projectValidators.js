"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProjectSchema = exports.createProjectSchema = void 0;
const zod_1 = require("zod");
exports.createProjectSchema = zod_1.z.object({
    title: zod_1.z.string().min(3, 'El título debe tener al menos 3 caracteres'),
    description: zod_1.z.string().max(1000).optional(),
    repositoryUrl: zod_1.z.string().url().optional(),
    status: zod_1.z.enum(['draft', 'in_progress', 'completed']).optional()
});
exports.updateProjectSchema = exports.createProjectSchema.partial();
