import { apiClient } from './apiClient';
import { Chat, CreateChatPayload, Message, SendMessagePayload } from '../types/chat';
import { mockDataService } from './mockDataService';

export const chatService = {
  async listChats(): Promise<Chat[]> {
    if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
      return await mockDataService.getAllChats();
    }
    const { data } = await apiClient.get<{ success: boolean; chats: Chat[] }>('/chats');
    return data.chats;
  },

  async createChat(payload: CreateChatPayload): Promise<Chat> {
    const { data } = await apiClient.post<{ success: boolean; chat: Chat }>('/chats', payload);
    return data.chat;
  },

  async listMessages(chatId: string): Promise<Message[]> {
    if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
      return await mockDataService.getChatMessages(chatId);
    }
    const { data } = await apiClient.get<{ success: boolean; messages: Message[] }>(`/chats/${chatId}/messages`);
    return data.messages;
  },

  async sendMessage(chatId: string, payload: SendMessagePayload): Promise<Message> {
    const { data } = await apiClient.post<{ success: boolean; message: Message }>(`/chats/${chatId}/messages`, payload);
    return data.message;
  },

  async deleteChat(chatId: string): Promise<void> {
    await apiClient.delete(`/chats/${chatId}`);
  },

  async deleteMessage(chatId: string, messageId: string): Promise<void> {
    await apiClient.delete(`/chats/${chatId}/messages/${messageId}`);
  }
};
