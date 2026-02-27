import { apiClient } from './apiClient';
import { resolveAssetUrl } from '../utils/media';

export interface StoryData {
  id: string;
  userId: string;
  userName: string;
  userAvatarUrl?: string | null;
  mediaUrl: string;
  createdAt: string;
}

const normalizeStory = (s: StoryData): StoryData => ({
  ...s,
  mediaUrl: resolveAssetUrl(s.mediaUrl) ?? s.mediaUrl,
  userAvatarUrl: resolveAssetUrl(s.userAvatarUrl) ?? s.userAvatarUrl
});

export const storyService = {
  async listStories(): Promise<StoryData[]> {
    const { data } = await apiClient.get<{ success: boolean; stories: StoryData[] }>('/stories');
    return (data.stories ?? []).map(normalizeStory);
  },

  async createStory(mediaUrl: string): Promise<StoryData> {
    const { data } = await apiClient.post<{ success: boolean; story: StoryData }>('/stories', {
      mediaUrl
    });
    return normalizeStory(data.story);
  },

  async deleteStory(storyId: string): Promise<void> {
    await apiClient.delete(`/stories/${storyId}`);
  },

  async recordView(storyId: string): Promise<void> {
    await apiClient.post(`/stories/${storyId}/view`);
  },

  async getStoryViewers(storyId: string): Promise<Array<{ id: string; firstName: string; lastName: string; avatarUrl: string | null }>> {
    const { data } = await apiClient.get<{ success: boolean; viewers: Array<{ id: string; firstName: string; lastName: string; avatarUrl: string | null }> }>(`/stories/${storyId}/viewers`);
    return data.viewers ?? [];
  }
};
