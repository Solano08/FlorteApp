import { chatRepository } from '../repositories/chatRepository';
import { AppError } from '../utils/appError';
import { Chat, CreateChatInput, CreateMessageInput, Message } from '../types/chat';

export const chatService = {
  async createChat(input: CreateChatInput): Promise<Chat> {
    if (input.memberIds.length === 0) {
      throw new AppError('Debes agregar al menos un integrante', 400);
    }
    // Para chats privados (no grupo, exactamente 1 miembro) intentar reutilizar conversación existente
    if (!input.isGroup && input.memberIds.length === 1) {
      const otherUserId = input.memberIds[0];
      const existing = await chatRepository.findDirectChatBetween(input.createdBy, otherUserId);
      if (existing) {
        return existing;
      }
    }
    return await chatRepository.createChat(input);
  },

  async listUserChats(userId: string): Promise<Array<Chat & { lastMessageAt?: Date; lastMessage?: string }>> {
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
    if (!input.content?.trim() && !input.attachmentUrl && !input.sharedPostId) {
      throw new AppError('El mensaje no puede estar vacío', 400);
    }
    return await chatRepository.createMessage(input);
  },

  async deleteMessage(messageId: string, userId: string, chatId: string): Promise<void> {
    // Verificar que el usuario tenga acceso al chat
    const members = await chatRepository.listChatMembers(chatId);
    if (!members.includes(userId)) {
      throw new AppError('No tienes acceso a esta conversación', 403);
    }

    // Verificar que el mensaje existe y pertenece al chat
    const message = await chatRepository.findMessageById(messageId);
    if (!message) {
      throw new AppError('Mensaje no encontrado', 404);
    }
    if (message.chatId !== chatId) {
      throw new AppError('El mensaje no pertenece a este chat', 403);
    }

    // Verificar que el usuario sea el autor del mensaje
    if (message.senderId !== userId) {
      throw new AppError('Solo puedes eliminar tus propios mensajes', 403);
    }

    await chatRepository.deleteMessage(messageId);
  },

  async deleteChat(chatId: string, userId: string): Promise<void> {
    const members = await chatRepository.listChatMembers(chatId);
    if (!members.includes(userId)) {
      throw new AppError('No tienes acceso a esta conversación', 403);
    }
    await chatRepository.deleteChat(chatId);
  }
};
