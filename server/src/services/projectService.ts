import { projectRepository } from '../repositories/projectRepository';
import { AppError } from '../utils/appError';
import { CreateProjectInput, Project, UpdateProjectInput } from '../types/project';

export const projectService = {
  async createProject(input: CreateProjectInput): Promise<Project> {
    if (!input.title.trim()) {
      throw new AppError('El título del proyecto es obligatorio', 400);
    }
    return await projectRepository.createProject(input);
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
    return await projectRepository.updateProject(input);
  }
};
