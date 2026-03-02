import crypto from 'crypto';
import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { getPool } from '../config/database';
import { Notification } from '../types/notification';

interface NotificationRow extends RowDataPacket {
  id: string;
  user_id: string;
  message: string;
  link: string | null;
  is_read: number;
  created_at: Date;
}

const mapNotification = (row: NotificationRow): Notification => ({
  id: row.id,
  userId: row.user_id,
  message: row.message,
  link: row.link,
  isRead: Boolean(row.is_read),
  createdAt: row.created_at
});

export const notificationRepository = {
  async create(input: { userId: string; message: string; link?: string | null }): Promise<Notification> {
    const id = crypto.randomUUID();
    const [result] = await getPool().execute<ResultSetHeader>(
      `INSERT INTO notifications (id, user_id, message, link)
       VALUES (:id, :userId, :message, :link)`,
      {
        id,
        userId: input.userId,
        message: input.message,
        link: input.link ?? null
      }
    );

    if (result.affectedRows !== 1) {
      throw new Error('No fue posible crear la notificación');
    }

    const [rows] = await getPool().query<NotificationRow[]>(
      'SELECT * FROM notifications WHERE id = :id LIMIT 1',
      { id }
    );
    if (!rows[0]) {
      throw new Error('No se pudo recuperar la notificación recién creada');
    }
    return mapNotification(rows[0]);
  },

  async listForUser(userId: string, limit = 20): Promise<Notification[]> {
    const [rows] = await getPool().query<NotificationRow[]>(
      `SELECT * FROM notifications
       WHERE user_id = :userId
       ORDER BY created_at DESC
       LIMIT :limit`,
      { userId, limit }
    );
    return rows.map(mapNotification);
  },

  async markAsRead(userId: string, notificationId: string): Promise<void> {
    await getPool().execute<ResultSetHeader>(
      `UPDATE notifications
       SET is_read = 1
       WHERE id = :id AND user_id = :userId`,
      { id: notificationId, userId }
    );
  },

  async markAllAsRead(userId: string): Promise<void> {
    await getPool().execute<ResultSetHeader>(
      `UPDATE notifications
       SET is_read = 1
       WHERE user_id = :userId AND is_read = 0`,
      { userId }
    );
  }
};









