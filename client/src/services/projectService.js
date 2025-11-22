import { apiClient } from './apiClient';
export const projectService = {
    async listProjects() {
        const { data } = await apiClient.get('/projects');
        return data.projects;
    },
    async listMyProjects() {
        const { data } = await apiClient.get('/projects/me');
        return data.projects;
    },
    async createProject(payload) {
        const { data } = await apiClient.post('/projects', payload);
        return data.project;
    },
    async updateProject(projectId, payload) {
        const { data } = await apiClient.put(`/projects/${projectId}`, payload);
        return data.project;
    }
};
