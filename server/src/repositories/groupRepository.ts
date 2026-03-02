import crypto from 'crypto';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { getPool } from '../config/database';
import { CreateGroupInput, GroupMember, StudyGroup } from '../types/group';

const mapGroup = (row: RowDataPacket): StudyGroup => ({
  id: row.id,
  name: row.name,
  description: row.description,
  coverImage: row.cover_image,
  iconUrl: row.icon_url,
  createdBy: row.created_by,
  createdAt: row.created_at,
  memberCount: row.member_count
});

const mapGroupMember = (row: RowDataPacket): GroupMember => ({
  groupId: row.group_id,
  userId: row.user_id,
  role: row.role,
  joinedAt: row.joined_at
});

export const groupRepository = {
  async createGroup(input: CreateGroupInput): Promise<StudyGroup> {
    const id = crypto.randomUUID();
    const [result] = await getPool().execute<ResultSetHeader>(
      `INSERT INTO study_groups (id, name, description, cover_image, icon_url, created_by)
       VALUES (:id, :name, :description, :coverImage, :iconUrl, :createdBy)`,
      {
        id,
        name: input.name,
        description: input.description ?? null,
        coverImage: input.coverImage ?? null,
        iconUrl: input.iconUrl ?? null,
        createdBy: input.createdBy
      }
    );

    if (result.affectedRows !== 1) {
      throw new Error('No fue posible crear el grupo');
    }

    await getPool().execute<ResultSetHeader>(
      `INSERT INTO group_members (group_id, user_id, role)
       VALUES (:groupId, :userId, 'admin')`,
      {
        groupId: id,
        userId: input.createdBy
      }
    );

    const group = await this.findById(id);
    if (!group) {
      throw new Error('Grupo no encontrado después de crearlo');
    }
    return group;
  },

  async findById(id: string): Promise<StudyGroup | null> {
    const [rows] = await getPool().query<RowDataPacket[]>(
      'SELECT * FROM study_groups WHERE id = :id LIMIT 1',
      { id }
    );
    if (rows.length === 0) return null;
    return mapGroup(rows[0]);
  },

  async listGroups(): Promise<StudyGroup[]> {
    const [rows] = await getPool().query<RowDataPacket[]>(
      `SELECT g.*,
              (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = g.id) AS member_count
       FROM study_groups g
       ORDER BY g.created_at DESC`
    );
    return rows.map(mapGroup);
  },

  async listUserGroups(userId: string): Promise<StudyGroup[]> {
    const [rows] = await getPool().query<RowDataPacket[]>(
      `SELECT g.*,
              (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = g.id) AS member_count
       FROM study_groups g
       INNER JOIN group_members gm ON gm.group_id = g.id
       WHERE gm.user_id = :userId
       ORDER BY g.created_at DESC`,
      { userId }
    );
    return rows.map(mapGroup);
  },

  async addMember(groupId: string, userId: string, role: GroupMember['role'] = 'member'): Promise<void> {
    await getPool().execute<ResultSetHeader>(
      `INSERT INTO group_members (group_id, user_id, role)
       VALUES (:groupId, :userId, :role)
       ON DUPLICATE KEY UPDATE role = VALUES(role)`,
      { groupId, userId, role }
    );
  },

  async listMembers(groupId: string): Promise<GroupMember[]> {
    const [rows] = await getPool().query<RowDataPacket[]>(
      `SELECT * FROM group_members
       WHERE group_id = :groupId`,
      { groupId }
    );
    return rows.map(mapGroupMember);
  },

  async removeMember(groupId: string, userId: string): Promise<void> {
    await getPool().execute<ResultSetHeader>(
      'DELETE FROM group_members WHERE group_id = :groupId AND user_id = :userId',
      { groupId, userId }
    );
  },

  async updateIcon(groupId: string, iconUrl: string): Promise<StudyGroup> {
    await getPool().execute<ResultSetHeader>(
      `UPDATE study_groups SET icon_url = :iconUrl WHERE id = :groupId`,
      { groupId, iconUrl }
    );
    const group = await this.findById(groupId);
    if (!group) {
      throw new Error('Grupo no encontrado después de actualizar');
    }
    return group;
  },

  async updateCover(groupId: string, coverUrl: string): Promise<StudyGroup> {
    await getPool().execute<ResultSetHeader>(
      `UPDATE study_groups SET cover_image = :coverUrl WHERE id = :groupId`,
      { groupId, coverUrl }
    );
    const group = await this.findById(groupId);
    if (!group) {
      throw new Error('Grupo no encontrado después de actualizar');
    }
    return group;
  },

  async deleteGroup(groupId: string): Promise<void> {
    const pool = getPool();

    // Eliminar mensajes de los canales de la comunidad
    await pool.execute<ResultSetHeader>(
      `DELETE FROM channel_messages 
       WHERE channel_id IN (
         SELECT id FROM channels WHERE community_id = :groupId
       )`,
      { groupId }
    );

    // Eliminar canales de la comunidad
    await pool.execute<ResultSetHeader>(
      'DELETE FROM channels WHERE community_id = :groupId',
      { groupId }
    );

    // Eliminar miembros de la comunidad
    await pool.execute<ResultSetHeader>(
      'DELETE FROM group_members WHERE group_id = :groupId',
      { groupId }
    );

    // Eliminar la comunidad
    await pool.execute<ResultSetHeader>(
      'DELETE FROM study_groups WHERE id = :groupId',
      { groupId }
    );
  }
};
