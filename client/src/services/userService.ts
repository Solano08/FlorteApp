import { apiClient } from './apiClient';
import { Profile } from '../types/profile';
import { mockDataService } from './mockDataService';

export interface CreateUserPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role?: 'admin' | 'instructor' | 'apprentice';
}

export interface UpdateUserPayload {
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: 'admin' | 'instructor' | 'apprentice';
  isActive?: boolean;
  password?: string;
}

export const userService = {
  async getAllUsers(): Promise<Profile[]> {
    if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
      return await mockDataService.getAllUsers();
    }
    const { data } = await apiClient.get<{ success: boolean; users: Profile[] }>('/users');
    return data.users;
  },

  async getUserById(id: string): Promise<Profile> {
    if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
      const user = await mockDataService.getUserById(id);
      if (!user) throw new Error('Usuario no encontrado');
      return user;
    }
    const { data } = await apiClient.get<{ success: boolean; user: Profile }>(`/users/${id}`);
    return data.user;
  },

  async createUser(userData: CreateUserPayload): Promise<Profile> {
    const { data } = await apiClient.post<{ success: boolean; user: Profile }>('/users', userData);
    return data.user;
  },

  async updateUser(id: string, userData: UpdateUserPayload): Promise<Profile> {
    const { data } = await apiClient.put<{ success: boolean; user: Profile }>(`/users/${id}`, userData);
    return data.user;
  },

  async deleteUser(id: string): Promise<Profile> {
    const { data } = await apiClient.delete<{ success: boolean; user: Profile }>(`/users/${id}`);
    return data.user;
  },

  async restoreUser(id: string): Promise<Profile> {
    const { data } = await apiClient.post<{ success: boolean; user: Profile }>(`/users/${id}/restore`);
    return data.user;
  },

  async blockUser(userId: string): Promise<void> {
    await apiClient.post(`/users/${userId}/block`);
  },

  async unblockUser(userId: string): Promise<void> {
    await apiClient.delete(`/users/${userId}/block`);
  }
};





















