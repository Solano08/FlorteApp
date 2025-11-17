"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.groupRepository = void 0;
const crypto_1 = __importDefault(require("crypto"));
const database_1 = require("../config/database");
const mapGroup = (row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    coverImage: row.cover_image,
    createdBy: row.created_by,
    createdAt: row.created_at
});
const mapGroupMember = (row) => ({
    groupId: row.group_id,
    userId: row.user_id,
    role: row.role,
    joinedAt: row.joined_at
});
exports.groupRepository = {
    async createGroup(input) {
        const id = crypto_1.default.randomUUID();
        const [result] = await (0, database_1.getPool)().execute(`INSERT INTO study_groups (id, name, description, cover_image, created_by)
       VALUES (:id, :name, :description, :coverImage, :createdBy)`, {
            id,
            name: input.name,
            description: input.description ?? null,
            coverImage: input.coverImage ?? null,
            createdBy: input.createdBy
        });
        if (result.affectedRows !== 1) {
            throw new Error('No fue posible crear el grupo');
        }
        await (0, database_1.getPool)().execute(`INSERT INTO group_members (group_id, user_id, role)
       VALUES (:groupId, :userId, 'admin')`, {
            groupId: id,
            userId: input.createdBy
        });
        const group = await this.findById(id);
        if (!group) {
            throw new Error('Grupo no encontrado después de crearlo');
        }
        return group;
    },
    async findById(id) {
        const [rows] = await (0, database_1.getPool)().query('SELECT * FROM study_groups WHERE id = :id LIMIT 1', { id });
        if (rows.length === 0)
            return null;
        return mapGroup(rows[0]);
    },
    async listGroups() {
        const [rows] = await (0, database_1.getPool)().query('SELECT * FROM study_groups ORDER BY created_at DESC');
        return rows.map(mapGroup);
    },
    async listUserGroups(userId) {
        const [rows] = await (0, database_1.getPool)().query(`SELECT g.*
       FROM study_groups g
       INNER JOIN group_members gm ON gm.group_id = g.id
       WHERE gm.user_id = :userId
       ORDER BY g.created_at DESC`, { userId });
        return rows.map(mapGroup);
    },
    async addMember(groupId, userId, role = 'member') {
        await (0, database_1.getPool)().execute(`INSERT INTO group_members (group_id, user_id, role)
       VALUES (:groupId, :userId, :role)
       ON DUPLICATE KEY UPDATE role = VALUES(role)`, { groupId, userId, role });
    },
    async listMembers(groupId) {
        const [rows] = await (0, database_1.getPool)().query(`SELECT * FROM group_members
       WHERE group_id = :groupId`, { groupId });
        return rows.map(mapGroupMember);
    }
};
