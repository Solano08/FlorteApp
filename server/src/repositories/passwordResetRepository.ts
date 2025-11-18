import crypto from 'crypto';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { getPool } from '../config/database';

interface PasswordResetToken {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
}

export const passwordResetRepository = {
  async create(userId: string, tokenHash: string, expiresAt: Date): Promise<PasswordResetToken> {
    const id = crypto.randomUUID();
    const [result] = await getPool().execute<ResultSetHeader>(
      `INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at)
       VALUES (:id, :userId, :tokenHash, :expiresAt)`,
      { id, userId, tokenHash, expiresAt }
    );

    if (result.affectedRows !== 1) {
      throw new Error('No fue posible crear el token de recuperación');
    }

    const token = await this.findByHash(tokenHash);
    if (!token) throw new Error('Token de recuperación no encontrado después de crearlo');
    return token;
  },

  async findByHash(tokenHash: string): Promise<PasswordResetToken | null> {
    const [rows] = await getPool().query<RowDataPacket[]>(
      `SELECT *
       FROM password_reset_tokens
       WHERE token_hash = :tokenHash
       LIMIT 1`,
      { tokenHash }
    );
    if (rows.length === 0) return null;
    const row = rows[0];
    return {
      id: row.id,
      userId: row.user_id,
      tokenHash: row.token_hash,
      expiresAt: row.expires_at,
      createdAt: row.created_at
    };
  },

  async delete(tokenId: string): Promise<void> {
    await getPool().execute('DELETE FROM password_reset_tokens WHERE id = :tokenId', { tokenId });
  },

  async deleteByUser(userId: string): Promise<void> {
    await getPool().execute('DELETE FROM password_reset_tokens WHERE user_id = :userId', { userId });
  },

  async cleanupExpired(): Promise<void> {
    await getPool().execute('DELETE FROM password_reset_tokens WHERE expires_at < NOW()');
  }
};
