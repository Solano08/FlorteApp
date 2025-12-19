import { channelRepository } from '../repositories/channelRepository';
import { groupRepository } from '../repositories/groupRepository';
import { AppError } from '../utils/appError';
import { Channel, ChannelMessage, CreateChannelInput, CreateChannelMessageInput } from '../types/channel';

export const channelService = {
  async createChannel(input: CreateChannelInput): Promise<Channel> {
    if (!input.name.trim()) {
      throw new AppError('El nombre del canal es obligatorio', 400);
    }

    // Verificar que la comunidad existe
    const community = await groupRepository.findById(input.communityId);
    if (!community) {
      throw new AppError('Comunidad no encontrada', 404);
    }

    // Verificar que el nombre no esté duplicado en la misma comunidad
    const existingChannels = await channelRepository.listByCommunity(input.communityId);
    const nameExists = existingChannels.some(c => c.name.toLowerCase() === input.name.toLowerCase());
    if (nameExists) {
      throw new AppError('Ya existe un canal con ese nombre en esta comunidad', 400);
    }

    return await channelRepository.createChannel(input);
  },

  async listChannels(communityId: string): Promise<Channel[]> {
    return await channelRepository.listByCommunity(communityId);
  },

  async getChannel(id: string): Promise<Channel | null> {
    return await channelRepository.findById(id);
  },

  async deleteChannel(id: string): Promise<void> {
    const channel = await channelRepository.findById(id);
    if (!channel) {
      throw new AppError('Canal no encontrado', 404);
    }
    await channelRepository.deleteChannel(id);
  },

  async createMessage(input: CreateChannelMessageInput): Promise<ChannelMessage> {
    if (!input.content.trim() && !input.attachmentUrl) {
      throw new AppError('El mensaje debe tener contenido o un archivo adjunto', 400);
    }

    // Verificar que el canal existe
    const channel = await channelRepository.findById(input.channelId);
    if (!channel) {
      throw new AppError('Canal no encontrado', 404);
    }

    return await channelRepository.createMessage(input);
  },

  async listMessages(channelId: string, limit: number = 100, offset: number = 0): Promise<ChannelMessage[]> {
    // Verificar que el canal existe
    const channel = await channelRepository.findById(channelId);
    if (!channel) {
      throw new AppError('Canal no encontrado', 404);
    }

    return await channelRepository.listMessages(channelId, limit, offset);
  },

  async deleteMessage(id: string): Promise<void> {
    const message = await channelRepository.findMessageById(id);
    if (!message) {
      throw new AppError('Mensaje no encontrado', 404);
    }
    await channelRepository.deleteMessage(id);
  }
};















