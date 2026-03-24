import { channelRepository } from '../repositories/channelRepository';
import { groupRepository } from '../repositories/groupRepository';
import { AppError } from '../utils/appError';
import {
  Channel,
  ChannelMessage,
  ChannelMessageReport,
  ChannelPollSummary,
  CreateChannelInput,
  CreateChannelMessageInput
} from '../types/channel';

const POLL_PREFIX = '__POLL__:';

function buildPollSummaryForMessage(
  content: string,
  messageId: string,
  countsMap: Map<string, { optionIndex: number; count: number }[]>,
  viewerMap: Map<string, number>
): ChannelPollSummary | undefined {
  if (!content.startsWith(POLL_PREFIX)) return undefined;
  let optionLen = 0;
  try {
    const p = JSON.parse(content.slice(POLL_PREFIX.length)) as { options?: string[] };
    if (Array.isArray(p.options)) optionLen = p.options.length;
  } catch {
    return undefined;
  }
  if (optionLen < 2) return undefined;
  const tallies = new Array(optionLen).fill(0);
  const rows = countsMap.get(messageId) ?? [];
  for (const { optionIndex, count } of rows) {
    if (optionIndex >= 0 && optionIndex < optionLen) tallies[optionIndex] = count;
  }
  const totalVotes = tallies.reduce((a, b) => a + b, 0);
  const vi = viewerMap.get(messageId);
  return {
    tallies,
    viewerVoteIndex: vi !== undefined ? vi : null,
    totalVotes
  };
}

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

    const trimmedTitle =
      input.threadTitle !== undefined && input.threadTitle !== null && String(input.threadTitle).trim() !== ''
        ? String(input.threadTitle).trim().slice(0, 120)
        : null;
    let threadRootId = input.threadRootId ?? null;

    if (threadRootId && trimmedTitle !== null) {
      throw new AppError('No puedes crear un hilo y responder al mismo tiempo', 400);
    }

    if (threadRootId) {
      const parent = await channelRepository.findMessageById(threadRootId);
      if (!parent || parent.channelId !== input.channelId) {
        throw new AppError('Mensaje del hilo no encontrado', 404);
      }
      if (parent.threadTitle == null) {
        throw new AppError('Solo puedes responder en hilos creados como tal', 400);
      }
    }

    const created = await channelRepository.createMessage({
      channelId: input.channelId,
      senderId: input.senderId,
      content: input.content ?? '',
      attachmentUrl: attachmentUrl ?? input.attachmentUrl ?? null,
      threadRootId: threadRootId ?? null,
      threadTitle: trimmedTitle
    });

    return this.attachPollSummaryIfNeeded(created);
  },

  async attachPollSummaryIfNeeded(message: ChannelMessage, viewerId?: string): Promise<ChannelMessage> {
    if (!message.content?.startsWith(POLL_PREFIX)) return message;
    const countsMap = await channelRepository.getPollVoteCountsByMessage([message.id]);
    const viewerMap = viewerId
      ? await channelRepository.getViewerPollVoteIndexes([message.id], viewerId)
      : new Map<string, number>();
    const poll = buildPollSummaryForMessage(message.content ?? '', message.id, countsMap, viewerMap);
    return poll ? { ...message, poll } : message;
  },

  async listMessages(channelId: string, limit: number = 100, offset: number = 0, viewerId?: string): Promise<ChannelMessage[]> {
    // Verificar que el canal existe
    const channel = await channelRepository.findById(channelId);
    if (!channel) {
      throw new AppError('Canal no encontrado', 404);
    }

    const messages = await channelRepository.listMessages(channelId, limit, offset, viewerId);
    const pollIds = messages.filter((m) => m.content?.startsWith(POLL_PREFIX)).map((m) => m.id);
    if (pollIds.length === 0) return messages;

    const countsMap = await channelRepository.getPollVoteCountsByMessage(pollIds);
    const viewerMap = viewerId
      ? await channelRepository.getViewerPollVoteIndexes(pollIds, viewerId)
      : new Map<string, number>();

    return messages.map((m) => {
      const poll = buildPollSummaryForMessage(m.content ?? '', m.id, countsMap, viewerMap);
      return poll ? { ...m, poll } : m;
    });
  },

  async voteChannelPoll(messageId: string, userId: string, optionIndex: number): Promise<ChannelPollSummary> {
    const message = await channelRepository.findMessageById(messageId);
    if (!message) {
      throw new AppError('Mensaje no encontrado', 404);
    }
    if (!message.content?.startsWith(POLL_PREFIX)) {
      throw new AppError('Este mensaje no es una encuesta', 400);
    }
    let options: string[] = [];
    try {
      const p = JSON.parse(message.content.slice(POLL_PREFIX.length)) as { options?: string[] };
      options = Array.isArray(p.options) ? p.options : [];
    } catch {
      throw new AppError('Encuesta inválida', 400);
    }
    if (options.length < 2 || optionIndex < 0 || optionIndex >= options.length) {
      throw new AppError('Opción de encuesta inválida', 400);
    }

    await channelRepository.upsertPollVote(messageId, userId, optionIndex);
    const countsMap = await channelRepository.getPollVoteCountsByMessage([messageId]);
    const viewerMap = await channelRepository.getViewerPollVoteIndexes([messageId], userId);
    const built = buildPollSummaryForMessage(message.content ?? '', messageId, countsMap, viewerMap);
    if (!built) {
      throw new AppError('No se pudo calcular el resultado de la encuesta', 500);
    }
    return built;
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















