import { apiClient } from './apiClient';
import { normalizeFeedPost, normalizeProfile } from '../utils/media';
export const profileService = {
    async getProfile() {
        const { data } = await apiClient.get('/profile/me');
        return normalizeProfile(data.profile);
    },
    async updateProfile(payload) {
        const { data } = await apiClient.put('/profile/me', payload);
        return normalizeProfile(data.profile);
    },
    async updateAvatar(file) {
        const formData = new FormData();
        formData.append('avatar', file);
        const { data } = await apiClient.put('/profile/me/avatar', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return normalizeProfile(data.profile);
    },
    async removeAvatar() {
        const formData = new FormData();
        const { data } = await apiClient.put('/profile/me/avatar', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return normalizeProfile(data.profile);
    },
    async updateCover(file) {
        const formData = new FormData();
        formData.append('cover', file);
        const { data } = await apiClient.put('/profile/me/cover', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return normalizeProfile(data.profile);
    },
    async removeCover() {
        const formData = new FormData();
        const { data } = await apiClient.put('/profile/me/cover', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return normalizeProfile(data.profile);
    },
    async getActivityOverview(weeks = 5) {
        const { data } = await apiClient.get('/profile/me/activity', {
            params: { weeks }
        });
        return data.activity;
    },
    async getRecentPosts(limit = 3) {
        const { data } = await apiClient.get('/profile/me/posts', {
            params: { limit }
        });
        return data.posts.map((post) => normalizeFeedPost(post));
    }
};
