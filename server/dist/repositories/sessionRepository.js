"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionRepository = void 0;
const crypto_1 = __importDefault(require("crypto"));
const database_1 = require("../config/database");
const mapSession = (row) => ({
    id: row.id,
    userId: row.user_id,
    refreshTokenHash: row.refresh_token_hash,
    device: row.device,
    ipAddress: row.ip_address,
    expiresAt: row.expires_at,
    createdAt: row.created_at
});
exports.sessionRepository = {
    async createSession(input) {
        const id = crypto_1.default.randomUUID();
        const [result] = await (0, database_1.getPool)().execute(`INSERT INTO user_sessions (id, user_id, refresh_token_hash, device, ip_address, expires_at)
       VALUES (:id, :userId, :refreshTokenHash, :device, :ipAddress, :expiresAt)`, {
            id,
            userId: input.userId,
            refreshTokenHash: input.refreshTokenHash,
            device: input.device ?? null,
            ipAddress: input.ipAddress ?? null,
            expiresAt: input.expiresAt
        });
        if (result.affectedRows !== 1) {
            throw new Error('No fue posible crear la sesión');
        }
        const created = await this.findById(id);
        if (!created) {
            throw new Error('Sesión no encontrada después de crearla');
        }
        return created;
    },
    async findById(id) {
        const [rows] = await (0, database_1.getPool)().query('SELECT * FROM user_sessions WHERE id = :id LIMIT 1', { id });
        if (rows.length === 0)
            return null;
        return mapSession(rows[0]);
    },
    async findByRefreshTokenHash(hash) {
        const [rows] = await (0, database_1.getPool)().query('SELECT * FROM user_sessions WHERE refresh_token_hash = :hash LIMIT 1', { hash });
        if (rows.length === 0)
            return null;
        return mapSession(rows[0]);
    },
    async deleteSession(id) {
        await (0, database_1.getPool)().execute('DELETE FROM user_sessions WHERE id = :id', { id });
    },
    async deleteSessionsByUser(userId) {
        await (0, database_1.getPool)().execute('DELETE FROM user_sessions WHERE user_id = :userId', { userId });
    },
    async cleanupExpiredSessions() {
        await (0, database_1.getPool)().execute('DELETE FROM user_sessions WHERE expires_at < NOW()');
    }
};
