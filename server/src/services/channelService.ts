import { channelRepository } from '../repositories/channelRepository';
import { groupRepository } from '../repositories/groupRepository';
import { AppError } from '../utils/appError';
import { Channel, ChannelMessage, ChannelMessageReport, CreateChannelInput, CreateChannelMessageInput } from '../types/channel';

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

  async updateChannel(id: string, input: { name?: string; description?: string | null; type?: 'text' | 'voice'; position?: number }): Promise<Channel> {
    const channel = await channelRepository.findById(id);
    if (!channel) {
      throw new AppError('Canal no encontrado', 404);
    }
    if (input.name !== undefined && input.name.trim() === '') {
      throw new AppError('El nombre del canal no puede estar vacío', 400);
    }
    if (input.name !== undefined) {
      const existingChannels = await channelRepository.listByCommunity(channel.communityId);
      const nameExists = existingChannels.some(
        c => c.id !== id && c.name.toLowerCase() === input.name!.toLowerCase()
      );
      if (nameExists) {
        throw new AppError('Ya existe un canal con ese nombre en esta comunidad', 400);
      }
    }
    const updated = await channelRepository.updateChannel(id, input);
    if (!updated) {
      throw new AppError('No se pudo actualizar el canal', 500);
    }
    return updated;
  },

  async deleteChannel(id: string): Promise<void> {
    const channel = await channelRepository.findById(id);
    if (!channel) {
      throw new AppError('Canal no encontrado', 404);
    }
    await channelRepository.deleteChannel(id);
  },

  async createMessage(input: CreateChannelMessageInput): Promise<ChannelMessage> {
    if (!input.content?.trim() && !input.attachmentUrl) {
      throw new AppError('El mensaje debe tener contenido o un archivo adjunto', 400);
    }
    let attachmentUrl = input.attachmentUrl;
    if (attachmentUrl?.startsWith('data:')) {
      const { uploadDataUrl } = await import('./cloudinaryService');
      attachmentUrl = await uploadDataUrl(attachmentUrl, 'channels') ?? attachmentUrl;
    }

    // Verificar que el canal existe
    const channel = await channelRepository.findById(input.channelId);
    if (!channel) {
      throw new AppError('Canal no encontrado', 404);
    }

    return await channelRepository.createMessage({
      ...input,
      attachmentUrl: attachmentUrl ?? input.attachmentUrl
    });
  },

  async listMessages(channelId: string, limit: number = 100, offset: number = 0, viewerId?: string): Promise<ChannelMessage[]> {
    // Verificar que el canal existe
    const channel = await channelRepository.findById(channelId);
    if (!channel) {
      throw new AppError('Canal no encontrado', 404);
    }

    return await channelRepository.listMessages(channelId, limit, offset, viewerId);
  },

  async reportMessage(messageId: string, reporterId: string, reason: string, details?: string): Promise<ChannelMessageReport> {
    const message = await channelRepository.findMessageById(messageId);
    if (!message) {
      throw new AppError('Mensaje no encontrado', 404);
    }
    return await channelRepository.reportMessage(messageId, reporterId, reason, details);
  },

  async listChannelMessageReports(): Promise<ChannelMessageReport[]> {
    return await channelRepository.listChannelMessageReports();
  },

  async updateChannelReportStatus(reportId: string, status: 'pending' | 'reviewed'): Promise<ChannelMessageReport> {
    const updated = await channelRepository.updateChannelReportStatus(reportId, status);
    if (!updated) {
      throw new AppError('Reporte no encontrado', 404);
    }
    return updated;
  },

  async toggleStarMessage(messageId: string, userId: string): Promise<{ starred: boolean }> {
    const message = await channelRepository.findMessageById(messageId);
    if (!message) {
      throw new AppError('Mensaje no encontrado', 404);
    }
    return await channelRepository.toggleStarMessage(messageId, userId);
  },

  async togglePinMessage(messageId: string, userId: string): Promise<ChannelMessage> {
    const message = await channelRepository.findMessageById(messageId);
    if (!message) {
      throw new AppError('Mensaje no encontrado', 404);
    }
    const updated = await channelRepository.togglePinMessage(messageId, userId);
    if (!updated) {
      throw new AppError('No se pudo actualizar el mensaje', 500);
    }
    return updated;
  },

  async deleteMessage(id: string): Promise<void> {
    const message = await channelRepository.findMessageById(id);
    if (!message) {
      throw new AppError('Mensaje no encontrado', 404);
    }
    await channelRepository.deleteMessage(id);
  }
};















