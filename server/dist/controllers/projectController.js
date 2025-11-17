"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectController = void 0;
const projectService_1 = require("../services/projectService");
const projectValidators_1 = require("../validators/projectValidators");
const appError_1 = require("../utils/appError");
exports.projectController = {
    create: async (req, res) => {
        const userId = req.user?.userId;
        if (!userId)
            throw new appError_1.AppError('Autenticación requerida', 401);
        const data = projectValidators_1.createProjectSchema.parse(req.body);
        const project = await projectService_1.projectService.createProject({ ...data, ownerId: userId });
        res.status(201).json({ success: true, project });
    },
    list: async (_req, res) => {
        const projects = await projectService_1.projectService.listProjects();
        res.json({ success: true, projects });
    },
    listMine: async (req, res) => {
        const userId = req.user?.userId;
        if (!userId)
            throw new appError_1.AppError('Autenticación requerida', 401);
        const projects = await projectService_1.projectService.listByUser(userId);
        res.json({ success: true, projects });
    },
    update: async (req, res) => {
        const userId = req.user?.userId;
        if (!userId)
            throw new appError_1.AppError('Autenticación requerida', 401);
        const { projectId } = req.params;
        const data = projectValidators_1.updateProjectSchema.parse(req.body);
        const project = await projectService_1.projectService.updateProject(userId, { projectId, ...data });
        res.json({ success: true, project });
    }
};
