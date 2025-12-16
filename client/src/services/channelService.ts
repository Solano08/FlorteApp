import { apiClient } from './apiClient';
import { Channel, ChannelMessage, CreateChannelPayload, CreateChannelMessagePayload } from '../types/channel';
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

  async deleteMessage(messageId: string): Promise<void> {
    await apiClient.delete(`/groups/channels/messages/${messageId}`);
  }
};









