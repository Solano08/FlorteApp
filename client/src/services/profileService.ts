import { apiClient } from './apiClient';
import { Profile, UpdateProfilePayload } from '../types/profile';

export const profileService = {
  async getProfile(): Promise<Profile> {
    const { data } = await apiClient.get<{ success: boolean; profile: Profile }>('/profile/me');
    return data.profile;
  },

  async updateProfile(payload: UpdateProfilePayload): Promise<Profile> {
    const { data } = await apiClient.put<{ success: boolean; profile: Profile }>('/profile/me', payload);
    return data.profile;
  },

  async updateAvatar(file: File): Promise<Profile> {
    const formData = new FormData();
    formData.append('avatar', file);
    const { data } = await apiClient.put<{ success: boolean; profile: Profile }>('/profile/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data.profile;
  }
};
