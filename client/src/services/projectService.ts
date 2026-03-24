import { apiClient } from './apiClient';
import {
  CreateProjectPayload,
  Project,
  ProjectAttachment,
  ProjectPanelMember,
  UpdateProjectPayload
} from '../types/project';

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
  },

  async uploadProjectCover(projectId: string, file: File): Promise<Project> {
    const formData = new FormData();
    formData.append('cover', file);
    const { data } = await apiClient.post<{ success: boolean; project: Project }>(
      `/projects/${projectId}/cover`,
      formData
    );
    return data.project;
  },

  async getProjectPanel(projectId: string): Promise<{
    project: Project;
    members: ProjectPanelMember[];
    attachments: ProjectAttachment[];
  }> {
    const { data } = await apiClient.get<{
      success: boolean;
      project: Project;
      members: ProjectPanelMember[];
      attachments: ProjectAttachment[];
    }>(`/projects/${projectId}/panel`);
    return {
      project: data.project,
      members: data.members,
      attachments: data.attachments
    };
  },

  async updateWorkspaceNotes(projectId: string, notes: string | null): Promise<Project> {
    const { data } = await apiClient.put<{ success: boolean; project: Project }>(
      `/projects/${projectId}/workspace-notes`,
      { notes }
    );
    return data.project;
  },

  async uploadProjectAttachment(projectId: string, file: File): Promise<ProjectAttachment> {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await apiClient.post<{ success: boolean; attachment: ProjectAttachment }>(
      `/projects/${projectId}/attachments`,
      formData
    );
    return data.attachment;
  },

  async deleteProjectAttachment(projectId: string, attachmentId: string): Promise<void> {
    await apiClient.delete(`/projects/${projectId}/attachments/${attachmentId}`);
  }
};
