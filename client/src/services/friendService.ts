import { apiClient } from './apiClient';
import type { Profile } from '../types/profile';
import { normalizeProfile } from '../utils/media';
import { mockDataService } from './mockDataService';

export interface FriendRequest {
  id: string;
  sender: Profile;
  receiver: Profile;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export const friendService = {
  async sendRequest(receiverId: string): Promise<FriendRequest> {
    const { data } = await apiClient.post<{ success: boolean; request: FriendRequest }>(
      '/friends/requests',
      { receiverId }
    );
    return data.request;
  },

  async listRequests(): Promise<FriendRequest[]> {
    const { data } = await apiClient.get<{ success: boolean; requests: FriendRequest[] }>(
      '/friends/requests'
    );
    return data.requests;
  },

  async acceptRequest(requestId: string): Promise<void> {
    await apiClient.post(`/friends/requests/${requestId}/accept`);
  },

  async rejectRequest(requestId: string): Promise<void> {
    await apiClient.post(`/friends/requests/${requestId}/reject`);
  },

  async cancelRequest(requestId: string): Promise<void> {
    await apiClient.post(`/friends/requests/${requestId}/cancel`);
  },

  async listFriends(): Promise<Profile[]> {
    if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
      return await mockDataService.getFriends();
    }
    const { data } = await apiClient.get<{ success: boolean; friends: Profile[] }>('/friends');
    return data.friends.map(normalizeProfile);
  }
};


