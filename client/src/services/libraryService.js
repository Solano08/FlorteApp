import { apiClient } from './apiClient';
export const libraryService = {
    async listResources() {
        const { data } = await apiClient.get('/library');
        return data.resources;
    },
    async searchResources(term) {
        const { data } = await apiClient.get('/library/search', {
            params: { q: term }
        });
        return data.resources;
    },
    async listMyResources() {
        const { data } = await apiClient.get('/library/me');
        return data.resources;
    },
    async createResource(payload) {
        const { data } = await apiClient.post('/library', payload);
        return data.resource;
    }
};
