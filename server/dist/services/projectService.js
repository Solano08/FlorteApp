"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectService = void 0;
const projectRepository_1 = require("../repositories/projectRepository");
const appError_1 = require("../utils/appError");
const activityService_1 = require("./activityService");
exports.projectService = {
    async createProject(input) {
        if (!input.title.trim()) {
            throw new appError_1.AppError('El titulo del proyecto es obligatorio', 400);
        }
        const project = await projectRepository_1.projectRepository.createProject(input);
        await activityService_1.activityService
            .recordProjectContribution({
            userId: input.ownerId,
            projectId: project.id,
            contributionPoints: 3,
            description: 'Creacion del proyecto'
        })
            .catch(() => { });
        return project;
    },
    async listProjects() {
        return await projectRepository_1.projectRepository.listProjects();
    },
    async listByUser(userId) {
        return await projectRepository_1.projectRepository.listByMember(userId);
    },
    async updateProject(actorId, input) {
        const project = await projectRepository_1.projectRepository.findById(input.projectId);
        if (!project) {
            throw new appError_1.AppError('Proyecto no encontrado', 404);
        }
        if (project.ownerId !== actorId) {
            throw new appError_1.AppError('No tienes permisos para actualizar este proyecto', 403);
        }
        const updated = await projectRepository_1.projectRepository.updateProject(input);
        await activityService_1.activityService
            .recordProjectContribution({
            userId: actorId,
            projectId: updated.id,
            contributionPoints: 1,
            description: 'Actualizacion del proyecto'
        })
            .catch(() => { });
        return updated;
    }
};
