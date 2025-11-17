import { projectRepository } from '../repositories/projectRepository';
import { AppError } from '../utils/appError';
import { CreateProjectInput, Project, UpdateProjectInput } from '../types/project';
import { activityService } from './activityService';

export const projectService = {
  async createProject(input: CreateProjectInput): Promise<Project> {
    if (!input.title.trim()) {
      throw new AppError('El titulo del proyecto es obligatorio', 400);
    }
    const project = await projectRepository.createProject(input);
    await activityService
      .recordProjectContribution({
        userId: input.ownerId,
        projectId: project.id,
        contributionPoints: 3,
        description: 'Creacion del proyecto'
      })
      .catch(() => {});
    return project;
  },

  async listProjects(): Promise<Project[]> {
    return await projectRepository.listProjects();
  },

  async listByUser(userId: string): Promise<Project[]> {
    return await projectRepository.listByMember(userId);
  },

  async updateProject(actorId: string, input: UpdateProjectInput): Promise<Project> {
    const project = await projectRepository.findById(input.projectId);
    if (!project) {
      throw new AppError('Proyecto no encontrado', 404);
    }
    if (project.ownerId !== actorId) {
      throw new AppError('No tienes permisos para actualizar este proyecto', 403);
    }

    const updated = await projectRepository.updateProject(input);
    await activityService
      .recordProjectContribution({
        userId: actorId,
        projectId: updated.id,
        contributionPoints: 1,
        description: 'Actualizacion del proyecto'
      })
      .catch(() => {});
    return updated;
  }
};
