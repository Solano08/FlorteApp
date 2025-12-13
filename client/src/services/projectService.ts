import { apiClient } from './apiClient';
import { CreateProjectPayload, Project, UpdateProjectPayload } from '../types/project';

export const projectService = {
  async listProjects(): Promise<Project[]> {
    const { data } = await apiClient.get<{ success: boolean; projects: Project[] }>('/projects');
    return data.projects;
  },

  async listMyProjects(): Promise<Project[]> {
    const { data } = await apiClient.get<{ success: boolean; projects: Project[] }>('/projects/me');
    return data.projects;
  },

  async createProject(payload: CreateProjectPayload): Promise<Project> {
    const { data } = await apiClient.post<{ success: boolean; project: Project }>('/projects', payload);
    return data.project;
  },

  async updateProject(projectId: string, payload: UpdateProjectPayload): Promise<Project> {
    const { data } = await apiClient.put<{ success: boolean; project: Project }>(`/projects/${projectId}`, payload);
    return data.project;
  },

  async deleteProject(projectId: string): Promise<void> {
    await apiClient.delete(`/projects/${projectId}`);
  }
};
