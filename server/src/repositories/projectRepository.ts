import crypto from 'crypto';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { getPool } from '../config/database';
import { CreateProjectInput, Project, ProjectAttachment, ProjectStatus, UpdateProjectInput } from '../types/project';

const mapProject = (row: RowDataPacket): Project => ({
  id: row.id,
  title: row.title,
  description: row.description,
  repositoryUrl: row.repository_url,
  coverImage: row.cover_image ?? null,
  workspaceNotes: row.workspace_notes ?? null,
  status: row.status,
  ownerId: row.owner_id,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const mapAttachment = (row: RowDataPacket) => ({
  id: row.id as string,
  projectId: row.project_id as string,
  fileUrl: row.file_url as string,
  fileName: row.file_name as string,
  mimeType: row.mime_type as string,
  uploadedBy: row.uploaded_by as string,
  createdAt: row.created_at as Date
});

export const projectRepository = {
  async createProject(input: CreateProjectInput): Promise<Project> {
    const id = crypto.randomUUID();
    const [result] = await getPool().execute<ResultSetHeader>(
      `INSERT INTO projects (id, title, description, repository_url, status, owner_id)
       VALUES (:id, :title, :description, :repositoryUrl, :status, :ownerId)`,
      {
        id,
        title: input.title,
        description: input.description ?? null,
        repositoryUrl: input.repositoryUrl ?? null,
        status: input.status ?? 'draft',
        ownerId: input.ownerId
      }
    );

    if (result.affectedRows !== 1) {
      throw new Error('No fue posible crear el proyecto');
    }

    await this.addMember(id, input.ownerId, 'lead');
    const project = await this.findById(id);
    if (!project) throw new Error('Proyecto no encontrado después de crearlo');
    return project;
  },

  async findById(id: string): Promise<Project | null> {
    const [rows] = await getPool().query<RowDataPacket[]>(
      'SELECT * FROM projects WHERE id = :id LIMIT 1',
      { id }
    );
    if (rows.length === 0) return null;
    return mapProject(rows[0]);
  },

  async listProjects(): Promise<Project[]> {
    const [rows] = await getPool().query<RowDataPacket[]>(
      'SELECT * FROM projects ORDER BY updated_at DESC'
    );
    return rows.map(mapProject);
  },

  async listByOwner(userId: string): Promise<Project[]> {
    const [rows] = await getPool().query<RowDataPacket[]>(
      `SELECT p.*
       FROM projects p
       WHERE p.owner_id = :userId
       ORDER BY p.updated_at DESC`,
      { userId }
    );
    return rows.map(mapProject);
  },

  async listByMember(userId: string): Promise<Project[]> {
    const [rows] = await getPool().query<RowDataPacket[]>(
      `SELECT p.*
       FROM projects p
       INNER JOIN project_members pm ON pm.project_id = p.id
       WHERE pm.user_id = :userId
       ORDER BY p.updated_at DESC`,
      { userId }
    );
    return rows.map(mapProject);
  },

  async updateProject(input: UpdateProjectInput): Promise<Project> {
    const fields: string[] = [];
    const params: Record<string, unknown> = { id: input.projectId };

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
      params.status = input.status satisfies ProjectStatus;
    }

    if (fields.length === 0) {
      const project = await this.findById(input.projectId);
      if (!project) throw new Error('Proyecto no encontrado');
      return project;
    }

    const [result] = await getPool().execute<ResultSetHeader>(
      `UPDATE projects
       SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = :id`,
      params
    );

    if (result.affectedRows !== 1) {
      throw new Error('No fue posible actualizar el proyecto');
    }

    const project = await this.findById(input.projectId);
    if (!project) throw new Error('Proyecto no encontrado tras actualizarlo');
    return project;
  },

  async addMember(projectId: string, userId: string, role: 'member' | 'lead' | 'coach' = 'member'): Promise<void> {
    await getPool().execute<ResultSetHeader>(
      `INSERT INTO project_members (project_id, user_id, role)
       VALUES (:projectId, :userId, :role)
       ON DUPLICATE KEY UPDATE role = VALUES(role)`,
      { projectId, userId, role }
    );
  },

  async listMembers(projectId: string): Promise<Array<{ userId: string; role: string }>> {
    const [rows] = await getPool().query<RowDataPacket[]>(
      `SELECT user_id, role
       FROM project_members
       WHERE project_id = :projectId`,
      { projectId }
    );
    return rows.map((row) => ({ userId: row.user_id as string, role: row.role as string }));
  },

  async deleteProject(id: string): Promise<void> {
    const [result] = await getPool().execute<ResultSetHeader>(
      'DELETE FROM projects WHERE id = :id',
      { id }
    );
    if (result.affectedRows === 0) {
      // It's possible the project didn't exist, but for idempotency we can just ignore or throw.
      // In this context, if we want to be strict:
      // throw new Error('Project not found or already deleted');
    }
  },

  async updateCover(projectId: string, coverUrl: string): Promise<Project> {
    const [result] = await getPool().execute<ResultSetHeader>(
      `UPDATE projects
       SET cover_image = :coverUrl, updated_at = CURRENT_TIMESTAMP
       WHERE id = :id`,
      { id: projectId, coverUrl }
    );
    if (result.affectedRows !== 1) {
      throw new Error('No fue posible actualizar la imagen del proyecto');
    }
    const project = await this.findById(projectId);
    if (!project) throw new Error('Proyecto no encontrado tras actualizar la imagen');
    return project;
  },

  async updateWorkspaceNotes(projectId: string, notes: string | null): Promise<Project> {
    const [result] = await getPool().execute<ResultSetHeader>(
      `UPDATE projects
       SET workspace_notes = :notes, updated_at = CURRENT_TIMESTAMP
       WHERE id = :id`,
      { id: projectId, notes }
    );
    if (result.affectedRows !== 1) {
      throw new Error('No fue posible actualizar las notas del proyecto');
    }
    const project = await this.findById(projectId);
    if (!project) throw new Error('Proyecto no encontrado');
    return project;
  },

  async listAttachments(projectId: string): Promise<ProjectAttachment[]> {
    const [rows] = await getPool().query<RowDataPacket[]>(
      `SELECT id, project_id, file_url, file_name, mime_type, uploaded_by, created_at
       FROM project_attachments
       WHERE project_id = :projectId
       ORDER BY created_at DESC`,
      { projectId }
    );
    return rows.map((row) => mapAttachment(row) as ProjectAttachment);
  },

  async insertAttachment(input: {
    projectId: string;
    fileUrl: string;
    fileName: string;
    mimeType: string;
    uploadedBy: string;
  }): Promise<ProjectAttachment> {
    const id = crypto.randomUUID();
    await getPool().execute<ResultSetHeader>(
      `INSERT INTO project_attachments (id, project_id, file_url, file_name, mime_type, uploaded_by)
       VALUES (:id, :projectId, :fileUrl, :fileName, :mimeType, :uploadedBy)`,
      {
        id,
        projectId: input.projectId,
        fileUrl: input.fileUrl,
        fileName: input.fileName,
        mimeType: input.mimeType,
        uploadedBy: input.uploadedBy
      }
    );
    const [rows] = await getPool().query<RowDataPacket[]>(
      'SELECT * FROM project_attachments WHERE id = :id LIMIT 1',
      { id }
    );
    if (rows.length === 0) throw new Error('Adjunto no encontrado tras crearlo');
    return mapAttachment(rows[0]) as ProjectAttachment;
  },

  async deleteAttachment(projectId: string, attachmentId: string): Promise<boolean> {
    const [result] = await getPool().execute<ResultSetHeader>(
      'DELETE FROM project_attachments WHERE id = :attachmentId AND project_id = :projectId',
      { attachmentId, projectId }
    );
    return result.affectedRows === 1;
  }
};
