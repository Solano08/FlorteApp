import crypto from 'crypto';
import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { getPool } from '../config/database';
import { Story, StoryWithUser } from '../types/story';

interface StoryRow extends RowDataPacket {
  id: string;
  user_id: string;
  media_url: string;
  created_at: Date;
  user_name: string;
  user_avatar_url: string | null;
}

const HOURS_24_MS = 24 * 60 * 60 * 1000;

const mapStoryRow = (row: StoryRow): StoryWithUser => ({
  id: row.id,
  userId: row.user_id,
  mediaUrl: row.media_url,
  createdAt: row.created_at,
  userName: row.user_name,
  userAvatarUrl: row.user_avatar_url ?? null
});

export const storyRepository = {
  async create(userId: string, mediaUrl: string): Promise<Story> {
    const id = crypto.randomUUID();
    const pool = getPool();
    await pool.execute<ResultSetHeader>(
      `INSERT INTO stories (id, user_id, media_url) VALUES (:id, :userId, :mediaUrl)`,
      { id, userId, mediaUrl }
    );
    const [rows] = await pool.query<StoryRow[]>(
      `SELECT s.*, 
        CONCAT(COALESCE(u.first_name,''), ' ', COALESCE(u.last_name,'')) AS user_name,
        u.avatar_url AS user_avatar_url
       FROM stories s
       JOIN users u ON u.id = s.user_id
       WHERE s.id = :id`,
      { id }
    );
    if (!rows[0]) throw new Error('No se pudo recuperar la historia creada');
    return mapStoryRow(rows[0]);
  },

  async findById(storyId: string): Promise<StoryWithUser | null> {
    const pool = getPool();
    const [rows] = await pool.query<StoryRow[]>(
      `SELECT s.*, 
        CONCAT(COALESCE(u.first_name,''), ' ', COALESCE(u.last_name,'')) AS user_name,
        u.avatar_url AS user_avatar_url
       FROM stories s
       JOIN users u ON u.id = s.user_id
       WHERE s.id = :storyId`,
      { storyId }
    );
    return rows[0] ? mapStoryRow(rows[0]) : null;
  },

  async listByUserIds(userIds: string[]): Promise<StoryWithUser[]> {
    if (userIds.length === 0) return [];
    const pool = getPool();
    const cutoff = new Date(Date.now() - HOURS_24_MS);
    const placeholders = userIds.map(() => '?').join(',');
    const [rows] = await pool.query<StoryRow[]>(
      `SELECT s.*, 
        CONCAT(COALESCE(u.first_name,''), ' ', COALESCE(u.last_name,'')) AS user_name,
        u.avatar_url AS user_avatar_url
       FROM stories s
       JOIN users u ON u.id = s.user_id
       WHERE s.user_id IN (${placeholders}) AND s.created_at > ?
       ORDER BY s.created_at ASC`,
      [...userIds, cutoff]
    );
    return rows.map(mapStoryRow);
  },

  async deleteById(storyId: string, userId: string): Promise<boolean> {
    const pool = getPool();
    const [result] = await pool.execute<ResultSetHeader>(
      `DELETE FROM stories WHERE id = :storyId AND user_id = :userId`,
      { storyId, userId }
    );
    return result.affectedRows > 0;
  },

  async recordView(storyId: string, viewerId: string): Promise<void> {
    const pool = getPool();
    await pool.execute(
      `INSERT IGNORE INTO story_views (story_id, viewer_id) VALUES (:storyId, :viewerId)`,
      { storyId, viewerId }
    );
  },

  async getViewers(storyId: string): Promise<Array<{ id: string; firstName: string; lastName: string; avatarUrl: string | null }>> {
    const pool = getPool();
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT u.id, u.first_name AS firstName, u.last_name AS lastName, u.avatar_url AS avatarUrl
       FROM story_views sv
       JOIN users u ON u.id = sv.viewer_id
       WHERE sv.story_id = ?
       ORDER BY sv.viewed_at DESC`,
      [storyId]
    );
    return (rows ?? []).map((r) => ({
      id: r.id,
      firstName: r.firstName ?? '',
      lastName: r.lastName ?? '',
      avatarUrl: r.avatarUrl ?? null
    }));
  }
};
