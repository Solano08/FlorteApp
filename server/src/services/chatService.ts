import { chatRepository } from '../repositories/chatRepository';
import { AppError } from '../utils/appError';
import { Chat, CreateChatInput, CreateMessageInput, Message } from '../types/chat';

export const chatService = {
  async createChat(input: CreateChatInput): Promise<Chat> {
    if (input.memberIds.length === 0) {
      throw new AppError('Debes agregar al menos un integrante', 400);
    }
    return await chatRepository.createChat(input);
  },

  async listUserChats(userId: string): Promise<Array<Chat & { lastMessageAt?: Date }>> {
    return await chatRepository.findUserChats(userId);
  },

  async getMessages(chatId: string, userId: string): Promise<Message[]> {
    const members = await chatRepository.listChatMembers(chatId);
    if (!members.includes(userId)) {
      throw new AppError('No tienes acceso a esta conversación', 403);
    }
    return await chatRepository.getMessages(chatId);
  },

  async sendMessage(input: CreateMessageInput): Promise<Message> {
    const members = await chatRepository.listChatMembers(input.chatId);
    if (!members.includes(input.senderId)) {
      throw new AppError('No tienes acceso a esta conversación', 403);
    }
    if (!input.content && !input.attachmentUrl) {
      throw new AppError('El mensaje no puede estar vacío', 400);
    }
    return await chatRepository.createMessage(input);
  }
};
