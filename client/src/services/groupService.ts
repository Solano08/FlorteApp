import { apiClient } from './apiClient';
import { CreateGroupPayload, Group } from '../types/group';

export const groupService = {
  async listGroups(): Promise<Group[]> {
    const { data } = await apiClient.get<{ success: boolean; groups: Group[] }>('/groups');
    return data.groups;
  },

  async listMyGroups(): Promise<Group[]> {
    const { data } = await apiClient.get<{ success: boolean; groups: Group[] }>('/groups/me');
    return data.groups;
  },

  async createGroup(payload: CreateGroupPayload): Promise<Group> {
    const { data } = await apiClient.post<{ success: boolean; group: Group }>('/groups', payload);
    return data.group;
  }
};
