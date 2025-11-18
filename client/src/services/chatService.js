import { apiClient } from './apiClient';
export const chatService = {
    async listChats() {
        const { data } = await apiClient.get('/chats');
        return data.chats;
    },
    async createChat(payload) {
        const { data } = await apiClient.post('/chats', payload);
        return data.chat;
    },
    async listMessages(chatId) {
        const { data } = await apiClient.get(`/chats/${chatId}/messages`);
        return data.messages;
    },
    async sendMessage(chatId, payload) {
        const { data } = await apiClient.post(`/chats/${chatId}/messages`, payload);
        return data.message;
    }
};
