import { apiClient } from './apiClient';
import { storage } from '../utils/storage';
const handleAuthResponse = (response) => {
    if (response.tokens?.accessToken && response.tokens?.refreshToken) {
        storage.setSession(response.tokens.accessToken, response.tokens.refreshToken);
    }
    if (response.user) {
        storage.setUser(response.user);
    }
    return response.user;
};
export const authService = {
    async register(payload) {
        const { data } = await apiClient.post('/auth/register', payload);
        return handleAuthResponse(data);
    },
    async login(payload) {
        const { data } = await apiClient.post('/auth/login', payload);
        return handleAuthResponse(data);
    },
    async logout() {
        const refreshToken = storage.getRefreshToken();
        if (refreshToken) {
            await apiClient.post('/auth/logout', { refreshToken }).catch(() => { });
        }
        storage.clear();
    },
    async forgotPassword(email) {
        const { data } = await apiClient.post('/auth/forgot-password', { email });
        return data.message;
    },
    async resetPassword(token, password) {
        const { data } = await apiClient.post('/auth/reset-password', { token, password });
        return data.message;
    },
    restoreSession() {
        return storage.getUser();
    }
};
