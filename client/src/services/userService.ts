import { apiClient } from './apiClient';
import { Profile } from '../types/profile';

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
    const { data } = await apiClient.get<{ success: boolean; users: Profile[] }>('/users');
    return data.users;
  },

  async getUserById(id: string): Promise<Profile> {
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
  }
};














