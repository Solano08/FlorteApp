import { apiClient } from './apiClient';
import { UserRole } from '../types/auth';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string | null;
  headline?: string | null;
  bio?: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface UpdateUserPayload {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  role?: UserRole;
  isActive?: boolean;
}

export const userService = {
  async getAllUsers(): Promise<User[]> {
    const { data } = await apiClient.get<{ success: boolean; users: User[] }>('/users');
    return data.users;
  },

  async getUserById(id: string): Promise<User> {
    const { data } = await apiClient.get<{ success: boolean; user: User }>(`/users/${id}`);
    return data.user;
  },

  async createUser(userData: CreateUserPayload): Promise<User> {
    const { data } = await apiClient.post<{ success: boolean; user: User }>('/users', userData);
    return data.user;
  },

  async updateUser(id: string, userData: UpdateUserPayload): Promise<User> {
    const { data } = await apiClient.put<{ success: boolean; user: User }>(`/users/${id}`, userData);
    return data.user;
  },

  async deleteUser(id: string): Promise<User> {
    const { data } = await apiClient.delete<{ success: boolean; user: User }>(`/users/${id}`);
    return data.user;
  },

  async restoreUser(id: string): Promise<User> {
    const { data } = await apiClient.post<{ success: boolean; user: User }>(`/users/${id}/restore`);
    return data.user;
  }
};
