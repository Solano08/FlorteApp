import { apiClient } from './apiClient';
import {
  Channel,
  ChannelMessage,
  ChannelPollSummary,
  CreateChannelPayload,
  CreateChannelMessagePayload
} from '../types/channel';
import { mockDataService } from './mockDataService';

export const channelService = {
  async listChannels(communityId: string): Promise<Channel[]> {
    if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
      return await mockDataService.getChannels(communityId);
    }
    const { data } = await apiClient.get<{ success: boolean; channels: Channel[] }>(
      `/groups/${communityId}/channels`
    );
    return data.channels;
  },

  async getChannel(channelId: string): Promise<Channel> {
    const { data } = await apiClient.get<{ success: boolean; channel: Channel }>(
      `/groups/channels/${channelId}`
    );
    return data.channel;
  },

  async createChannel(payload: CreateChannelPayload): Promise<Channel> {
    const { data } = await apiClient.post<{ success: boolean; channel: Channel }>(
      `/groups/${payload.communityId}/channels`,
      payload
    );
    return data.channel;
  },

  async updateChannel(channelId: string, payload: { name?: string; description?: string | null; type?: 'text' | 'voice'; position?: number }): Promise<Channel> {
    if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
      return await mockDataService.updateChannel(channelId, payload);
    }
    const { data } = await apiClient.patch<{ success: boolean; channel: Channel }>(
      `/groups/channels/${channelId}`,
      payload
    );
    return data.channel;
  },

  async deleteChannel(channelId: string): Promise<void> {
    await apiClient.delete(`/groups/channels/${channelId}`);
  },

  async listMessages(channelId: string, limit: number = 100, offset: number = 0): Promise<ChannelMessage[]> {
    if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
      const messages = await mockDataService.getChannelMessages(channelId);
      // Aplicar limit y offset si se proporcionan
      let result = messages;
      if (offset) {
        result = result.slice(offset);
      }
      if (limit) {
        result = result.slice(0, limit);
      }
      return result;
    }
    const { data } = await apiClient.get<{ success: boolean; messages: ChannelMessage[] }>(
      `/groups/channels/${channelId}/messages`,
      { params: { limit, offset } }
    );
    return data.messages;
  },

  async createMessage(channelId: string, payload: CreateChannelMessagePayload): Promise<ChannelMessage> {
    const { data } = await apiClient.post<{ success: boolean; message: ChannelMessage }>(
      `/groups/channels/${channelId}/messages`,
      payload
    );
    return data.message;
  },

  async toggleStarMessage(messageId: string): Promise<{ starred: boolean }> {
    if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
      return await mockDataService.toggleStarMessage(messageId);
    }
    const { data } = await apiClient.post<{ success: boolean; starred: boolean }>(
      `/groups/channels/messages/${messageId}/star`
    );
    return { starred: data.starred };
  },

  async togglePinMessage(messageId: string): Promise<ChannelMessage> {
    if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
      return await mockDataService.togglePinMessage(messageId);
    }
    const { data } = await apiClient.patch<{ success: boolean; message: ChannelMessage }>(
      `/groups/channels/messages/${messageId}/pin`
    );
    return data.message;
  },

  async reportMessage(messageId: string, payload: { reason: string; details?: string }): Promise<void> {
    if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
      return; // Mock: no-op, could add local state
    }
    await apiClient.post(`/groups/channels/messages/${messageId}/report`, payload);
  },

  async deleteMessage(messageId: string): Promise<void> {
    await apiClient.delete(`/groups/channels/messages/${messageId}`);
  },

  async voteChannelPoll(messageId: string, optionIndex: number): Promise<ChannelPollSummary> {
    const { data } = await apiClient.post<{ success: boolean; poll: ChannelPollSummary }>(
      `/groups/channels/messages/${messageId}/poll-vote`,
      { optionIndex }
    );
    return data.poll;
  }
};









