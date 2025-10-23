import { apiClient } from './apiClient';
export const adminService = {
    async listUsers() {
        const { data } = await apiClient.get('/admin/users');
        return data.users;
    },
    async updateRole(userId, role) {
        const { data } = await apiClient.patch(`/admin/users/${userId}/role`, {
            role
        });
        return data.user;
    },
    async updateStatus(userId, isActive) {
        const { data } = await apiClient.patch(`/admin/users/${userId}/status`, {
            isActive
        });
        return data.user;
    }
};
