import { storyRepository } from '../repositories/storyRepository';
import { friendRepository } from '../repositories/friendRepository';
import { uploadDataUrl } from './cloudinaryService';
import { AppError } from '../utils/appError';

const processMediaUrl = async (value?: string | null): Promise<string | null> => {
  if (!value) return null;
  if (value.startsWith('data:')) {
    return uploadDataUrl(value, 'stories');
  }
  return value;
};

export const storyService = {
  async createStory(userId: string, mediaUrl: string): Promise<any> {
    const processed = await processMediaUrl(mediaUrl);
    if (!processed) throw new AppError('Medio invalido', 400);
    return storyRepository.create(userId, processed);
  },

  async listStoriesForViewer(viewerId: string): Promise<any[]> {
    const friends = await friendRepository.listFriends(viewerId);
    const friendIds = friends.map((f) => f.id);
    friendIds.push(viewerId);
    return storyRepository.listByUserIds(friendIds);
  },

  async deleteStory(storyId: string, userId: string): Promise<void> {
    const deleted = await storyRepository.deleteById(storyId, userId);
    if (!deleted) {
      throw new AppError('Historia no encontrada o sin permisos para eliminarla', 404);
    }
  },

  async recordView(storyId: string, viewerId: string): Promise<void> {
    const story = await storyRepository.findById(storyId);
    if (!story) throw new AppError('Historia no encontrada', 404);
    if (story.userId === viewerId) return;
    await storyRepository.recordView(storyId, viewerId);
  },

  async getStoryViewers(storyId: string, userId: string): Promise<Array<{ id: string; firstName: string; lastName: string; avatarUrl: string | null }>> {
    const story = await storyRepository.findById(storyId);
    if (!story) throw new AppError('Historia no encontrada', 404);
    if (story.userId !== userId) {
      throw new AppError('Solo puedes ver los espectadores de tus propias historias', 403);
    }
    return storyRepository.getViewers(storyId);
  }
};
