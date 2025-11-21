import { apiClient } from './apiClient';
export const userService = {
    async getAllUsers() {
        const { data } = await apiClient.get('/users');
        return data.users;
    },
    async getUserById(id) {
        const { data } = await apiClient.get(`/users/${id}`);
        return data.user;
    },
    async createUser(userData) {
        const { data } = await apiClient.post('/users', userData);
        return data.user;
    },
    async updateUser(id, userData) {
        const { data } = await apiClient.put(`/users/${id}`, userData);
        return data.user;
    },
    async deleteUser(id) {
        const { data } = await apiClient.delete(`/users/${id}`);
        return data.user;
    },
    async restoreUser(id) {
        const { data } = await apiClient.post(`/users/${id}/restore`);
        return data.user;
    }
};
