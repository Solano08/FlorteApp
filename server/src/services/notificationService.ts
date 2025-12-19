import { notificationRepository } from '../repositories/notificationRepository';
import { Notification } from '../types/notification';

export const notificationService = {
  async createNotification(input: {
    userId: string;
    message: string;
    link?: string | null;
  }): Promise<Notification> {
    return await notificationRepository.create(input);
  },

  async listUserNotifications(userId: string, limit = 20): Promise<Notification[]> {
    return await notificationRepository.listForUser(userId, limit);
  },

  async markAsRead(userId: string, notificationId: string): Promise<void> {
    await notificationRepository.markAsRead(userId, notificationId);
  },

  async markAllAsRead(userId: string): Promise<void> {
    await notificationRepository.markAllAsRead(userId);
  }
};









