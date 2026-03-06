import { apiClient } from './apiClient';
import { CreateGroupPayload, Group } from '../types/group';
import { mockDataService } from './mockDataService';

export const groupService = {
  async listGroups(): Promise<Group[]> {
    if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
      return await mockDataService.getAllGroups();
    }
    const { data } = await apiClient.get<{ success: boolean; groups: Group[] }>('/groups');
    return data.groups;
  },

  async listMyGroups(): Promise<Group[]> {
    if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
      return await mockDataService.getMyGroups();
    }
    const { data } = await apiClient.get<{ success: boolean; groups: Group[] }>('/groups/me');
    return data.groups;
  },

  async createGroup(payload: CreateGroupPayload): Promise<Group> {
    const { data } = await apiClient.post<{ success: boolean; group: Group }>('/groups', payload);
    return data.group;
  },

  async getGroup(groupId: string): Promise<Group> {
    if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
      const group = await mockDataService.getGroupById(groupId);
      if (!group) throw new Error('Comunidad no encontrada');
      return group;
    }
    const { data } = await apiClient.get<{ success: boolean; group: Group }>(`/groups/${groupId}`);
    return data.group;
  },

  async updateGroup(groupId: string, payload: Partial<CreateGroupPayload>): Promise<Group> {
    const { data } = await apiClient.patch<{ success: boolean; group: Group }>(
      `/groups/${groupId}`,
      payload
    );
    return data.group;
  },

  async joinGroup(groupId: string): Promise<void> {
    await apiClient.post(`/groups/${groupId}/join`);
  },

  async leaveGroup(groupId: string): Promise<void> {
    await apiClient.post(`/groups/${groupId}/leave`);
  },

  async deleteGroup(groupId: string, password: string): Promise<void> {
    await apiClient.delete(`/groups/${groupId}`, {
      data: { password }
    });
  },

  async uploadCommunityIcon(communityId: string, file: File): Promise<Group> {
    const formData = new FormData();
    formData.append('icon', file);
    // No establecer Content-Type: el navegador debe añadir boundary automáticamente para que multer parsee el archivo
    const { data } = await apiClient.post<{ success: boolean; group: Group }>(
      `/groups/${communityId}/icon`,
      formData
    );
    return data.group;
  },

  async uploadCommunityCover(communityId: string, file: File): Promise<Group> {
    const formData = new FormData();
    formData.append('cover', file);
    const { data } = await apiClient.post<{ success: boolean; group: Group }>(
      `/groups/${communityId}/cover`,
      formData
    );
    return data.group;
  }
};
