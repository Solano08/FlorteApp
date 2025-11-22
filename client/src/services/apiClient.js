import axios from 'axios';
import { storage } from '../utils/storage';
const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';
let refreshPromise = null;
const refreshTokens = async () => {
    if (!refreshPromise) {
        refreshPromise = (async () => {
            const refreshToken = storage.getRefreshToken();
            if (!refreshToken)
                return null;
            try {
                const response = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
                const { tokens, user } = response.data;
                if (tokens?.accessToken && tokens?.refreshToken) {
                    storage.setSession(tokens.accessToken, tokens.refreshToken);
                }
                if (user) {
                    storage.setUser(user);
                }
                return tokens?.accessToken ?? null;
            }
            catch (error) {
                storage.clear();
                return null;
            }
        })().finally(() => {
            refreshPromise = null;
        });
    }
    return await refreshPromise;
};
export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true
});
apiClient.interceptors.request.use((config) => {
    const token = storage.getAccessToken();
    if (token) {
        const headers = (config.headers ?? {});
        headers.Authorization = token.startsWith('JWT ') || token.startsWith('Bearer ') ? token : `JWT ${token}`;
        config.headers = headers;
    }
    return config;
});
apiClient.interceptors.response.use((response) => response, async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest?._retry) {
        originalRequest._retry = true;
        const newAccessToken = await refreshTokens();
        if (newAccessToken) {
            const headers = (originalRequest.headers ?? {});
            headers.Authorization =
                newAccessToken.startsWith('JWT ') || newAccessToken.startsWith('Bearer ')
                    ? newAccessToken
                    : `JWT ${newAccessToken}`;
            originalRequest.headers = headers;
            return await apiClient(originalRequest);
        }
    }
    return await Promise.reject(error);
});
