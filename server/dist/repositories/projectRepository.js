"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectRepository = void 0;
const crypto_1 = __importDefault(require("crypto"));
const database_1 = require("../config/database");
const mapProject = (row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    repositoryUrl: row.repository_url,
    status: row.status,
    ownerId: row.owner_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at
});
exports.projectRepository = {
    async createProject(input) {
        const id = crypto_1.default.randomUUID();
        const [result] = await (0, database_1.getPool)().execute(`INSERT INTO projects (id, title, description, repository_url, status, owner_id)
       VALUES (:id, :title, :description, :repositoryUrl, :status, :ownerId)`, {
            id,
            title: input.title,
            description: input.description ?? null,
            repositoryUrl: input.repositoryUrl ?? null,
            status: input.status ?? 'draft',
            ownerId: input.ownerId
        });
        if (result.affectedRows !== 1) {
            throw new Error('No fue posible crear el proyecto');
        }
        await this.addMember(id, input.ownerId, 'lead');
        const project = await this.findById(id);
        if (!project)
            throw new Error('Proyecto no encontrado después de crearlo');
        return project;
    },
    async findById(id) {
        const [rows] = await (0, database_1.getPool)().query('SELECT * FROM projects WHERE id = :id LIMIT 1', { id });
        if (rows.length === 0)
            return null;
        return mapProject(rows[0]);
    },
    async listProjects() {
        const [rows] = await (0, database_1.getPool)().query('SELECT * FROM projects ORDER BY updated_at DESC');
        return rows.map(mapProject);
    },
    async listByOwner(userId) {
        const [rows] = await (0, database_1.getPool)().query(`SELECT p.*
       FROM projects p
       WHERE p.owner_id = :userId
       ORDER BY p.updated_at DESC`, { userId });
        return rows.map(mapProject);
    },
    async listByMember(userId) {
        const [rows] = await (0, database_1.getPool)().query(`SELECT p.*
       FROM projects p
       INNER JOIN project_members pm ON pm.project_id = p.id
       WHERE pm.user_id = :userId
       ORDER BY p.updated_at DESC`, { userId });
        return rows.map(mapProject);
    },
    async updateProject(input) {
        const fields = [];
        const params = { id: input.projectId };
        if (input.title !== undefined) {
            fields.push('title = :title');
            params.title = input.title;
        }
        if (input.description !== undefined) {
            fields.push('description = :description');
            params.description = input.description;
        }
        if (input.repositoryUrl !== undefined) {
            fields.push('repository_url = :repositoryUrl');
            params.repositoryUrl = input.repositoryUrl;
        }
        if (input.status !== undefined) {
            fields.push('status = :status');
            params.status = input.status;
        }
        if (fields.length === 0) {
            const project = await this.findById(input.projectId);
            if (!project)
                throw new Error('Proyecto no encontrado');
            return project;
        }
        const [result] = await (0, database_1.getPool)().execute(`UPDATE projects
       SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = :id`, params);
        if (result.affectedRows !== 1) {
            throw new Error('No fue posible actualizar el proyecto');
        }
        const project = await this.findById(input.projectId);
        if (!project)
            throw new Error('Proyecto no encontrado tras actualizarlo');
        return project;
    },
    async addMember(projectId, userId, role = 'member') {
        await (0, database_1.getPool)().execute(`INSERT INTO project_members (project_id, user_id, role)
       VALUES (:projectId, :userId, :role)
       ON DUPLICATE KEY UPDATE role = VALUES(role)`, { projectId, userId, role });
    },
    async listMembers(projectId) {
        const [rows] = await (0, database_1.getPool)().query(`SELECT user_id, role
       FROM project_members
       WHERE project_id = :projectId`, { projectId });
        return rows.map((row) => ({ userId: row.user_id, role: row.role }));
    }
};
