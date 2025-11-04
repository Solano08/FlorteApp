import { apiClient } from './apiClient';
export const profileService = {
    async getProfile() {
        const { data } = await apiClient.get('/profile/me');
        return data.profile;
    },
    async updateProfile(payload) {
        const { data } = await apiClient.put('/profile/me', payload);
        return data.profile;
    },
    async updateAvatar(file) {
        const formData = new FormData();
        formData.append('avatar', file);
        const { data } = await apiClient.put('/profile/me/avatar', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return data.profile;
    },
    async removeAvatar() {
        const formData = new FormData();
        const { data } = await apiClient.put('/profile/me/avatar', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return data.profile;
    },
    async updateCover(file) {
        const formData = new FormData();
        formData.append('cover', file);
        const { data } = await apiClient.put('/profile/me/cover', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return data.profile;
    },
    async removeCover() {
        const formData = new FormData();
        const { data } = await apiClient.put('/profile/me/cover', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return data.profile;
    }
};
