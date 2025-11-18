import crypto from 'crypto';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { getPool } from '../config/database';
import { CreateResourceInput, LibraryResource } from '../types/library';

const mapResource = (row: RowDataPacket): LibraryResource => ({
  id: row.id,
  title: row.title,
  description: row.description,
  resourceType: row.resource_type,
  url: row.url,
  uploadedBy: row.uploaded_by,
  tags: row.tags ? JSON.parse(row.tags) : null,
  createdAt: row.created_at
});

export const libraryRepository = {
  async createResource(input: CreateResourceInput): Promise<LibraryResource> {
    const id = crypto.randomUUID();
    const [result] = await getPool().execute<ResultSetHeader>(
      `INSERT INTO library_resources (id, title, description, resource_type, url, uploaded_by, tags)
       VALUES (:id, :title, :description, :resourceType, :url, :uploadedBy, :tags)`,
      {
        id,
        title: input.title,
        description: input.description ?? null,
        resourceType: input.resourceType,
        url: input.url ?? null,
        uploadedBy: input.uploadedBy,
        tags: input.tags ? JSON.stringify(input.tags) : null
      }
    );

    if (result.affectedRows !== 1) {
      throw new Error('No fue posible crear el recurso');
    }

    const resource = await this.findById(id);
    if (!resource) throw new Error('Recurso no encontrado después de crearlo');
    return resource;
  },

  async findById(id: string): Promise<LibraryResource | null> {
    const [rows] = await getPool().query<RowDataPacket[]>(
      'SELECT * FROM library_resources WHERE id = :id LIMIT 1',
      { id }
    );
    if (rows.length === 0) return null;
    return mapResource(rows[0]);
  },

  async listResources(limit = 100): Promise<LibraryResource[]> {
    const [rows] = await getPool().query<RowDataPacket[]>(
      `SELECT * FROM library_resources
       ORDER BY created_at DESC
       LIMIT :limit`,
      { limit }
    );
    return rows.map(mapResource);
  },

  async searchResources(term: string): Promise<LibraryResource[]> {
    const like = `%${term}%`;
    const [rows] = await getPool().query<RowDataPacket[]>(
      `SELECT *
       FROM library_resources
       WHERE title LIKE :like OR description LIKE :like`,
      { like }
    );
    return rows.map(mapResource);
  },

  async listByUser(userId: string): Promise<LibraryResource[]> {
    const [rows] = await getPool().query<RowDataPacket[]>(
      `SELECT *
       FROM library_resources
       WHERE uploaded_by = :userId
       ORDER BY created_at DESC`,
      { userId }
    );
    return rows.map(mapResource);
  }
};
