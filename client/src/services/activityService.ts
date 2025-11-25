import { apiClient } from './apiClient';
import { ActivityOverview } from '../types/activity';

export const activityService = {
  async getOverview(): Promise<ActivityOverview> {
    const { data } = await apiClient.get<{ success: boolean; activity: ActivityOverview }>(
      '/profile/me/activity'
    );
    return data.activity;
  }
};
