"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.libraryRepository = void 0;
const crypto_1 = __importDefault(require("crypto"));
const database_1 = require("../config/database");
const mapResource = (row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    resourceType: row.resource_type,
    url: row.url,
    uploadedBy: row.uploaded_by,
    tags: row.tags ? JSON.parse(row.tags) : null,
    createdAt: row.created_at
});
exports.libraryRepository = {
    async createResource(input) {
        const id = crypto_1.default.randomUUID();
        const [result] = await (0, database_1.getPool)().execute(`INSERT INTO library_resources (id, title, description, resource_type, url, uploaded_by, tags)
       VALUES (:id, :title, :description, :resourceType, :url, :uploadedBy, :tags)`, {
            id,
            title: input.title,
            description: input.description ?? null,
            resourceType: input.resourceType,
            url: input.url ?? null,
            uploadedBy: input.uploadedBy,
            tags: input.tags ? JSON.stringify(input.tags) : null
        });
        if (result.affectedRows !== 1) {
            throw new Error('No fue posible crear el recurso');
        }
        const resource = await this.findById(id);
        if (!resource)
            throw new Error('Recurso no encontrado después de crearlo');
        return resource;
    },
    async findById(id) {
        const [rows] = await (0, database_1.getPool)().query('SELECT * FROM library_resources WHERE id = :id LIMIT 1', { id });
        if (rows.length === 0)
            return null;
        return mapResource(rows[0]);
    },
    async listResources(limit = 100) {
        const [rows] = await (0, database_1.getPool)().query(`SELECT * FROM library_resources
       ORDER BY created_at DESC
       LIMIT :limit`, { limit });
        return rows.map(mapResource);
    },
    async searchResources(term) {
        const like = `%${term}%`;
        const [rows] = await (0, database_1.getPool)().query(`SELECT *
       FROM library_resources
       WHERE title LIKE :like OR description LIKE :like`, { like });
        return rows.map(mapResource);
    },
    async listByUser(userId) {
        const [rows] = await (0, database_1.getPool)().query(`SELECT *
       FROM library_resources
       WHERE uploaded_by = :userId
       ORDER BY created_at DESC`, { userId });
        return rows.map(mapResource);
    }
};
