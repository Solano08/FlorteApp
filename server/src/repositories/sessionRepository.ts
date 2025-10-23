import crypto from 'crypto';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { getPool } from '../config/database';
import { CreateSessionInput, Session } from '../types/session';

const mapSession = (row: RowDataPacket): Session => ({
  id: row.id,
  userId: row.user_id,
  refreshTokenHash: row.refresh_token_hash,
  device: row.device,
  ipAddress: row.ip_address,
  expiresAt: row.expires_at,
  createdAt: row.created_at
});

export const sessionRepository = {
  async createSession(input: CreateSessionInput): Promise<Session> {
    const id = crypto.randomUUID();
    const [result] = await getPool().execute<ResultSetHeader>(
      `INSERT INTO user_sessions (id, user_id, refresh_token_hash, device, ip_address, expires_at)
       VALUES (:id, :userId, :refreshTokenHash, :device, :ipAddress, :expiresAt)`,
      {
        id,
        userId: input.userId,
        refreshTokenHash: input.refreshTokenHash,
        device: input.device ?? null,
        ipAddress: input.ipAddress ?? null,
        expiresAt: input.expiresAt
      }
    );

    if (result.affectedRows !== 1) {
      throw new Error('No fue posible crear la sesión');
    }

    const created = await this.findById(id);
    if (!created) {
      throw new Error('Sesión no encontrada después de crearla');
    }
    return created;
  },

  async findById(id: string): Promise<Session | null> {
    const [rows] = await getPool().query<RowDataPacket[]>(
      'SELECT * FROM user_sessions WHERE id = :id LIMIT 1',
      { id }
    );
    if (rows.length === 0) return null;
    return mapSession(rows[0]);
  },

  async findByRefreshTokenHash(hash: string): Promise<Session | null> {
    const [rows] = await getPool().query<RowDataPacket[]>(
      'SELECT * FROM user_sessions WHERE refresh_token_hash = :hash LIMIT 1',
      { hash }
    );
    if (rows.length === 0) return null;
    return mapSession(rows[0]);
  },

  async deleteSession(id: string): Promise<void> {
    await getPool().execute('DELETE FROM user_sessions WHERE id = :id', { id });
  },

  async deleteSessionsByUser(userId: string): Promise<void> {
    await getPool().execute('DELETE FROM user_sessions WHERE user_id = :userId', { userId });
  },

  async cleanupExpiredSessions(): Promise<void> {
    await getPool().execute('DELETE FROM user_sessions WHERE expires_at < NOW()');
  }
};
