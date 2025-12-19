import { apiClient } from './apiClient';

export interface NotificationItem {
  id: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export const notificationService = {
  async listNotifications(): Promise<NotificationItem[]> {
    const { data } = await apiClient.get<{ success: boolean; notifications: NotificationItem[] }>(
      '/notifications'
    );
    return data.notifications;
  },

  async markAsRead(id: string): Promise<void> {
    await apiClient.post(`/notifications/${id}/read`);
  },

  async markAllAsRead(): Promise<void> {
    await apiClient.post('/notifications/read-all');
  }
};









