import crypto from 'crypto';
import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { getPool } from '../config/database';
import { FriendRequest, FriendRequestStatus, Friendship } from '../types/friend';
import { PublicProfile } from '../types/user';

interface FriendRequestRow extends RowDataPacket {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: FriendRequestStatus;
  created_at: Date;
  updated_at: Date;
  sender_first_name: string;
  sender_last_name: string;
  sender_email: string;
  sender_avatar_url: string | null;
  sender_cover_image_url: string | null;
  sender_headline: string | null;
  sender_bio: string | null;
  sender_instagram_url: string | null;
  sender_github_url: string | null;
  sender_facebook_url: string | null;
  sender_contact_email: string | null;
  sender_x_url: string | null;
  sender_role: string;
  sender_is_active: number;
  sender_created_at: Date;
  sender_updated_at: Date;
  receiver_first_name: string;
  receiver_last_name: string;
  receiver_email: string;
  receiver_avatar_url: string | null;
  receiver_cover_image_url: string | null;
  receiver_headline: string | null;
  receiver_bio: string | null;
  receiver_instagram_url: string | null;
  receiver_github_url: string | null;
  receiver_facebook_url: string | null;
  receiver_contact_email: string | null;
  receiver_x_url: string | null;
  receiver_role: string;
  receiver_is_active: number;
  receiver_created_at: Date;
  receiver_updated_at: Date;
}

const mapProfileFromPrefix = (row: FriendRequestRow, prefix: 'sender' | 'receiver'): PublicProfile => ({
  id: prefix === 'sender' ? row.sender_id : row.receiver_id,
  firstName: row[`${prefix}_first_name`] as string,
  lastName: row[`${prefix}_last_name`] as string,
  email: row[`${prefix}_email`] as string,
  avatarUrl: row[`${prefix}_avatar_url`] ?? null,
  coverImageUrl: row[`${prefix}_cover_image_url`] ?? null,
  headline: row[`${prefix}_headline`] ?? null,
  bio: row[`${prefix}_bio`] ?? null,
  instagramUrl: row[`${prefix}_instagram_url`] ?? null,
  githubUrl: row[`${prefix}_github_url`] ?? null,
  facebookUrl: row[`${prefix}_facebook_url`] ?? null,
  contactEmail: row[`${prefix}_contact_email`] ?? null,
  xUrl: row[`${prefix}_x_url`] ?? null,
  role: row[`${prefix}_role`] as any,
  isActive: Boolean(row[`${prefix}_is_active`]),
  createdAt: row[`${prefix}_created_at`],
  updatedAt: row[`${prefix}_updated_at`]
});

const mapFriendRequest = (row: FriendRequestRow): FriendRequest => ({
  id: row.id,
  senderId: row.sender_id,
  receiverId: row.receiver_id,
  status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  sender: mapProfileFromPrefix(row, 'sender'),
  receiver: mapProfileFromPrefix(row, 'receiver')
});

interface FriendshipRow extends RowDataPacket {
  user_id: string;
  friend_id: string;
  created_at: Date;
  friend_first_name: string;
  friend_last_name: string;
  friend_email: string;
  friend_avatar_url: string | null;
  friend_cover_image_url: string | null;
  friend_headline: string | null;
  friend_bio: string | null;
  friend_instagram_url: string | null;
  friend_github_url: string | null;
  friend_facebook_url: string | null;
  friend_contact_email: string | null;
  friend_x_url: string | null;
  friend_role: string;
  friend_is_active: number;
  friend_created_at: Date;
  friend_updated_at: Date;
}

export const friendRepository = {
  async createRequest(senderId: string, receiverId: string): Promise<FriendRequest> {
    const id = crypto.randomUUID();
    const pool = getPool();

    await pool.execute<ResultSetHeader>(
      `INSERT INTO friend_requests (id, sender_id, receiver_id, status)
       VALUES (:id, :senderId, :receiverId, 'pending')
       ON DUPLICATE KEY UPDATE status = VALUES(status), updated_at = CURRENT_TIMESTAMP`,
      { id, senderId, receiverId }
    );

    const [rows] = await pool.query<FriendRequestRow[]>(
      `SELECT fr.*,
              s.first_name  AS sender_first_name,
              s.last_name   AS sender_last_name,
              s.email       AS sender_email,
              s.avatar_url  AS sender_avatar_url,
              s.cover_image_url AS sender_cover_image_url,
              s.headline    AS sender_headline,
              s.bio         AS sender_bio,
              s.instagram_url AS sender_instagram_url,
              s.github_url  AS sender_github_url,
              s.facebook_url AS sender_facebook_url,
              s.contact_email AS sender_contact_email,
              s.x_url       AS sender_x_url,
              s.role        AS sender_role,
              s.is_active   AS sender_is_active,
              s.created_at  AS sender_created_at,
              s.updated_at  AS sender_updated_at,
              r.first_name  AS receiver_first_name,
              r.last_name   AS receiver_last_name,
              r.email       AS receiver_email,
              r.avatar_url  AS receiver_avatar_url,
              r.cover_image_url AS receiver_cover_image_url,
              r.headline    AS receiver_headline,
              r.bio         AS receiver_bio,
              r.instagram_url AS receiver_instagram_url,
              r.github_url  AS receiver_github_url,
              r.facebook_url AS receiver_facebook_url,
              r.contact_email AS receiver_contact_email,
              r.x_url       AS receiver_x_url,
              r.role        AS receiver_role,
              r.is_active   AS receiver_is_active,
              r.created_at  AS receiver_created_at,
              r.updated_at  AS receiver_updated_at
       FROM friend_requests fr
       JOIN users s ON s.id = fr.sender_id
       JOIN users r ON r.id = fr.receiver_id
       WHERE fr.sender_id = :senderId AND fr.receiver_id = :receiverId`,
      { senderId, receiverId }
    );

    if (!rows[0]) {
      throw new Error('No se pudo recuperar la solicitud de amistad recién creada');
    }
    return mapFriendRequest(rows[0]);
  },

  async findRequestByUsers(senderId: string, receiverId: string): Promise<FriendRequest | null> {
    const pool = getPool();
    const [rows] = await pool.query<FriendRequestRow[]>(
      `SELECT fr.*,
              s.first_name  AS sender_first_name,
              s.last_name   AS sender_last_name,
              s.email       AS sender_email,
              s.avatar_url  AS sender_avatar_url,
              s.cover_image_url AS sender_cover_image_url,
              s.headline    AS sender_headline,
              s.bio         AS sender_bio,
              s.instagram_url AS sender_instagram_url,
              s.github_url  AS sender_github_url,
              s.facebook_url AS sender_facebook_url,
              s.contact_email AS sender_contact_email,
              s.x_url       AS sender_x_url,
              s.role        AS sender_role,
              s.is_active   AS sender_is_active,
              s.created_at  AS sender_created_at,
              s.updated_at  AS sender_updated_at,
              r.first_name  AS receiver_first_name,
              r.last_name   AS receiver_last_name,
              r.email       AS receiver_email,
              r.avatar_url  AS receiver_avatar_url,
              r.cover_image_url AS receiver_cover_image_url,
              r.headline    AS receiver_headline,
              r.bio         AS receiver_bio,
              r.instagram_url AS receiver_instagram_url,
              r.github_url  AS receiver_github_url,
              r.facebook_url AS receiver_facebook_url,
              r.contact_email AS receiver_contact_email,
              r.x_url       AS receiver_x_url,
              r.role        AS receiver_role,
              r.is_active   AS receiver_is_active,
              r.created_at  AS receiver_created_at,
              r.updated_at  AS receiver_updated_at
       FROM friend_requests fr
       JOIN users s ON s.id = fr.sender_id
       JOIN users r ON r.id = fr.receiver_id
       WHERE (fr.sender_id = :senderId AND fr.receiver_id = :receiverId)
          OR (fr.sender_id = :receiverId AND fr.receiver_id = :senderId)
       LIMIT 1`,
      { senderId, receiverId }
    );
    if (!rows[0]) return null;
    return mapFriendRequest(rows[0]);
  },

  async findRequestById(id: string): Promise<FriendRequest | null> {
    const pool = getPool();
    const [rows] = await pool.query<FriendRequestRow[]>(
      `SELECT fr.*,
              s.first_name  AS sender_first_name,
              s.last_name   AS sender_last_name,
              s.email       AS sender_email,
              s.avatar_url  AS sender_avatar_url,
              s.cover_image_url AS sender_cover_image_url,
              s.headline    AS sender_headline,
              s.bio         AS sender_bio,
              s.instagram_url AS sender_instagram_url,
              s.github_url  AS sender_github_url,
              s.facebook_url AS sender_facebook_url,
              s.contact_email AS sender_contact_email,
              s.x_url       AS sender_x_url,
              s.role        AS sender_role,
              s.is_active   AS sender_is_active,
              s.created_at  AS sender_created_at,
              s.updated_at  AS sender_updated_at,
              r.first_name  AS receiver_first_name,
              r.last_name   AS receiver_last_name,
              r.email       AS receiver_email,
              r.avatar_url  AS receiver_avatar_url,
              r.cover_image_url AS receiver_cover_image_url,
              r.headline    AS receiver_headline,
              r.bio         AS receiver_bio,
              r.instagram_url AS receiver_instagram_url,
              r.github_url  AS receiver_github_url,
              r.facebook_url AS receiver_facebook_url,
              r.contact_email AS receiver_contact_email,
              r.x_url       AS receiver_x_url,
              r.role        AS receiver_role,
              r.is_active   AS receiver_is_active,
              r.created_at  AS receiver_created_at,
              r.updated_at  AS receiver_updated_at
       FROM friend_requests fr
       JOIN users s ON s.id = fr.sender_id
       JOIN users r ON r.id = fr.receiver_id
       WHERE fr.id = :id`,
      { id }
    );
    if (!rows[0]) return null;
    return mapFriendRequest(rows[0]);
  },

  async listRequestsForUser(userId: string): Promise<FriendRequest[]> {
    const pool = getPool();
    const [rows] = await pool.query<FriendRequestRow[]>(
      `SELECT fr.*,
              s.first_name  AS sender_first_name,
              s.last_name   AS sender_last_name,
              s.email       AS sender_email,
              s.avatar_url  AS sender_avatar_url,
              s.cover_image_url AS sender_cover_image_url,
              s.headline    AS sender_headline,
              s.bio         AS sender_bio,
              s.instagram_url AS sender_instagram_url,
              s.github_url  AS sender_github_url,
              s.facebook_url AS sender_facebook_url,
              s.contact_email AS sender_contact_email,
              s.x_url       AS sender_x_url,
              s.role        AS sender_role,
              s.is_active   AS sender_is_active,
              s.created_at  AS sender_created_at,
              s.updated_at  AS sender_updated_at,
              r.first_name  AS receiver_first_name,
              r.last_name   AS receiver_last_name,
              r.email       AS receiver_email,
              r.avatar_url  AS receiver_avatar_url,
              r.cover_image_url AS receiver_cover_image_url,
              r.headline    AS receiver_headline,
              r.bio         AS receiver_bio,
              r.instagram_url AS receiver_instagram_url,
              r.github_url  AS receiver_github_url,
              r.facebook_url AS receiver_facebook_url,
              r.contact_email AS receiver_contact_email,
              r.x_url       AS receiver_x_url,
              r.role        AS receiver_role,
              r.is_active   AS receiver_is_active,
              r.created_at  AS receiver_created_at,
              r.updated_at  AS receiver_updated_at
       FROM friend_requests fr
       JOIN users s ON s.id = fr.sender_id
       JOIN users r ON r.id = fr.receiver_id
       WHERE fr.sender_id = :userId OR fr.receiver_id = :userId
       ORDER BY fr.created_at DESC`,
      { userId }
    );
    return rows.map(mapFriendRequest);
  },

  async updateRequestStatus(id: string, status: FriendRequestStatus): Promise<void> {
    const pool = getPool();
    await pool.execute<ResultSetHeader>(
      `UPDATE friend_requests
       SET status = :status, updated_at = CURRENT_TIMESTAMP
       WHERE id = :id`,
      { id, status }
    );
  },

  async deleteRequest(id: string): Promise<void> {
    const pool = getPool();
    await pool.execute<ResultSetHeader>(
      'DELETE FROM friend_requests WHERE id = :id',
      { id }
    );
  },

  async createFriendship(userId: string, friendId: string): Promise<void> {
    const pool = getPool();
    await pool.execute<ResultSetHeader>(
      `INSERT INTO friends (user_id, friend_id)
       VALUES (:userId, :friendId)
       ON DUPLICATE KEY UPDATE created_at = created_at`,
      { userId, friendId }
    );
    await pool.execute<ResultSetHeader>(
      `INSERT INTO friends (user_id, friend_id)
       VALUES (:friendId, :userId)
       ON DUPLICATE KEY UPDATE created_at = created_at`,
      { userId, friendId }
    );
  },

  async listFriends(userId: string): Promise<PublicProfile[]> {
    const pool = getPool();
    const [rows] = await pool.query<FriendshipRow[]>(
      `SELECT f.user_id, f.friend_id, f.created_at,
              u.first_name  AS friend_first_name,
              u.last_name   AS friend_last_name,
              u.email       AS friend_email,
              u.avatar_url  AS friend_avatar_url,
              u.cover_image_url AS friend_cover_image_url,
              u.headline    AS friend_headline,
              u.bio         AS friend_bio,
              u.instagram_url AS friend_instagram_url,
              u.github_url  AS friend_github_url,
              u.facebook_url AS friend_facebook_url,
              u.contact_email AS friend_contact_email,
              u.x_url       AS friend_x_url,
              u.role        AS friend_role,
              u.is_active   AS friend_is_active,
              u.created_at  AS friend_created_at,
              u.updated_at  AS friend_updated_at
       FROM friends f
       JOIN users u ON u.id = f.friend_id
       WHERE f.user_id = :userId
       ORDER BY u.first_name, u.last_name`,
      { userId }
    );
    return rows.map((row) => ({
      id: row.friend_id,
      firstName: row.friend_first_name,
      lastName: row.friend_last_name,
      email: row.friend_email,
      avatarUrl: row.friend_avatar_url ?? null,
      coverImageUrl: row.friend_cover_image_url ?? null,
      headline: row.friend_headline ?? null,
      bio: row.friend_bio ?? null,
      instagramUrl: row.friend_instagram_url ?? null,
      githubUrl: row.friend_github_url ?? null,
      facebookUrl: row.friend_facebook_url ?? null,
      contactEmail: row.friend_contact_email ?? null,
      xUrl: row.friend_x_url ?? null,
      role: row.friend_role as any,
      isActive: Boolean(row.friend_is_active),
      createdAt: row.friend_created_at,
      updatedAt: row.friend_updated_at
    }));
  }
};



