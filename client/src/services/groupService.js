import { apiClient } from './apiClient';
export const groupService = {
    async listGroups() {
        const { data } = await apiClient.get('/groups');
        return data.groups;
    },
    async listMyGroups() {
        const { data } = await apiClient.get('/groups/me');
        return data.groups;
    },
    async createGroup(payload) {
        const { data } = await apiClient.post('/groups', payload);
        return data.group;
    }
};
