import { apiClient } from './apiClient';
import { storage } from '../utils/storage';
import { AuthResponse, AuthUser } from '../types/auth';

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

const handleAuthResponse = (response: AuthResponse) => {
  if (response.tokens?.accessToken && response.tokens?.refreshToken) {
    storage.setSession(response.tokens.accessToken, response.tokens.refreshToken);
  }
  if (response.user) {
    storage.setUser(response.user);
  }
  return response.user;
};

export const authService = {
  async register(payload: RegisterPayload): Promise<AuthUser> {
    const { data } = await apiClient.post<AuthResponse>('/auth/register', payload);
    return handleAuthResponse(data);
  },

  async login(payload: LoginPayload): Promise<AuthUser> {
    const { data } = await apiClient.post<AuthResponse>('/auth/login', payload);
    return handleAuthResponse(data);
  },

  async logout(): Promise<void> {
    const refreshToken = storage.getRefreshToken();
    if (refreshToken) {
      await apiClient.post('/auth/logout', { refreshToken }).catch(() => {});
    }
    storage.clear();
  },

  async forgotPassword(email: string): Promise<string> {
    const { data } = await apiClient.post<{ success: boolean; message: string }>('/auth/forgot-password', { email });
    return data.message;
  },

  async resetPassword(token: string, password: string): Promise<string> {
    const { data } = await apiClient.post<{ success: boolean; message: string }>('/auth/reset-password', { token, password });
    return data.message;
  },

  restoreSession(): AuthUser | null {
    return storage.getUser<AuthUser>();
  }
};
