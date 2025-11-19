import { apiClient } from './apiClient';
import { normalizeProfile } from '../utils/media';
import { Profile, UpdateProfilePayload } from '../types/profile';

export const profileService = {
  async getProfile(): Promise<Profile> {
    const { data } = await apiClient.get<{ success: boolean; profile: Profile }>('/profile/me');
    return normalizeProfile(data.profile);
  },

  async getPublicProfile(userId: string): Promise<Profile> {
    const { data } = await apiClient.get<{ success: boolean; profile: Profile }>(`/profile/${userId}`);
    return normalizeProfile(data.profile);
  },

  async updateProfile(payload: UpdateProfilePayload): Promise<Profile> {
    const { data } = await apiClient.put<{ success: boolean; profile: Profile }>('/profile/me', payload);
    return normalizeProfile(data.profile);
  },

  async updateAvatar(file: File): Promise<Profile> {
    const formData = new FormData();
    formData.append('avatar', file);
    const { data } = await apiClient.put<{ success: boolean; profile: Profile }>('/profile/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return normalizeProfile(data.profile);
  },

  async removeAvatar(): Promise<Profile> {
    const formData = new FormData();
    const { data } = await apiClient.put<{ success: boolean; profile: Profile }>('/profile/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return normalizeProfile(data.profile);
  },

  async updateCover(file: File): Promise<Profile> {
    const formData = new FormData();
    formData.append('cover', file);
    const { data } = await apiClient.put<{ success: boolean; profile: Profile }>('/profile/me/cover', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return normalizeProfile(data.profile);
  },

  async removeCover(): Promise<Profile> {
    const formData = new FormData();
    const { data } = await apiClient.put<{ success: boolean; profile: Profile }>('/profile/me/cover', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return normalizeProfile(data.profile);
  }
};
