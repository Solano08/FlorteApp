"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.passwordResetRepository = void 0;
const crypto_1 = __importDefault(require("crypto"));
const database_1 = require("../config/database");
exports.passwordResetRepository = {
    async create(userId, tokenHash, expiresAt) {
        const id = crypto_1.default.randomUUID();
        const [result] = await (0, database_1.getPool)().execute(`INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at)
       VALUES (:id, :userId, :tokenHash, :expiresAt)`, { id, userId, tokenHash, expiresAt });
        if (result.affectedRows !== 1) {
            throw new Error('No fue posible crear el token de recuperación');
        }
        const token = await this.findByHash(tokenHash);
        if (!token)
            throw new Error('Token de recuperación no encontrado después de crearlo');
        return token;
    },
    async findByHash(tokenHash) {
        const [rows] = await (0, database_1.getPool)().query(`SELECT *
       FROM password_reset_tokens
       WHERE token_hash = :tokenHash
       LIMIT 1`, { tokenHash });
        if (rows.length === 0)
            return null;
        const row = rows[0];
        return {
            id: row.id,
            userId: row.user_id,
            tokenHash: row.token_hash,
            expiresAt: row.expires_at,
            createdAt: row.created_at
        };
    },
    async delete(tokenId) {
        await (0, database_1.getPool)().execute('DELETE FROM password_reset_tokens WHERE id = :tokenId', { tokenId });
    },
    async deleteByUser(userId) {
        await (0, database_1.getPool)().execute('DELETE FROM password_reset_tokens WHERE user_id = :userId', { userId });
    },
    async cleanupExpired() {
        await (0, database_1.getPool)().execute('DELETE FROM password_reset_tokens WHERE expires_at < NOW()');
    }
};
