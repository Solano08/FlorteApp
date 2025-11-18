import crypto from 'crypto';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { getPool } from '../config/database';
import {
  CreateUserInput,
  UpdateProfileInput,
  UpdateUserInput,
  UpdateUserRoleInput,
  UpdateUserStatusInput,
  User,
  UserRole
} from '../types/user';

const mapUser = (row: RowDataPacket): User => ({
  id: row.id,
  firstName: row.first_name,
  lastName: row.last_name,
  email: row.email,
  passwordHash: row.password_hash,
  avatarUrl: row.avatar_url,
  coverImageUrl: row.cover_image_url,
  headline: row.headline,
  bio: row.bio,
  instagramUrl: row.instagram_url,
  githubUrl: row.github_url,
  facebookUrl: row.facebook_url,
  contactEmail: row.contact_email,
  xUrl: row.x_url,
  role: row.role as UserRole,
  isActive: row.is_active === 1,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

export const userRepository = {
  async findByEmail(email: string): Promise<User | null> {
    const [rows] = await getPool().query<RowDataPacket[]>(
      'SELECT * FROM users WHERE email = :email LIMIT 1',
      { email }
    );
    if (rows.length === 0) return null;
    return mapUser(rows[0]);
  },

  async findById(id: string): Promise<User | null> {
    const [rows] = await getPool().query<RowDataPacket[]>(
      'SELECT * FROM users WHERE id = :id LIMIT 1',
      { id }
    );
    if (rows.length === 0) return null;
    return mapUser(rows[0]);
  },

  async createUser(input: CreateUserInput): Promise<User> {
    const id = crypto.randomUUID();
    const [result] = await getPool().execute<ResultSetHeader>(
      `INSERT INTO users (id, first_name, last_name, email, password_hash, role, is_active)
       VALUES (:id, :firstName, :lastName, :email, :passwordHash, :role, :isActive)`,
      {
        id,
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        passwordHash: input.passwordHash,
        role: input.role ?? 'apprentice',
        isActive: input.isActive === undefined || input.isActive ? 1 : 0
      }
    );

    if (result.affectedRows !== 1) {
      throw new Error('Failed to create user');
    }

    const created = await this.findById(id);
    if (!created) {
      throw new Error('User not found after creation');
    }
    return created;
  },

  async updateProfile(input: UpdateProfileInput): Promise<User> {
    const fields: string[] = [];
    const params: Record<string, unknown> = { id: input.userId };

    if (input.firstName !== undefined) {
      fields.push('first_name = :firstName');
      params.firstName = input.firstName;
    }
    if (input.lastName !== undefined) {
      fields.push('last_name = :lastName');
      params.lastName = input.lastName;
    }
    if (input.headline !== undefined) {
      fields.push('headline = :headline');
      params.headline = input.headline;
    }
    if (input.bio !== undefined) {
      fields.push('bio = :bio');
      params.bio = input.bio;
    }
    if (input.avatarUrl !== undefined) {
      fields.push('avatar_url = :avatarUrl');
      params.avatarUrl = input.avatarUrl;
    }
    if (input.coverImageUrl !== undefined) {
      fields.push('cover_image_url = :coverImageUrl');
      params.coverImageUrl = input.coverImageUrl;
    }
    if (input.instagramUrl !== undefined) {
      fields.push('instagram_url = :instagramUrl');
      params.instagramUrl = input.instagramUrl;
    }
    if (input.githubUrl !== undefined) {
      fields.push('github_url = :githubUrl');
      params.githubUrl = input.githubUrl;
    }
    if (input.facebookUrl !== undefined) {
      fields.push('facebook_url = :facebookUrl');
      params.facebookUrl = input.facebookUrl;
    }
    if (input.contactEmail !== undefined) {
      fields.push('contact_email = :contactEmail');
      params.contactEmail = input.contactEmail;
    }
    if (input.xUrl !== undefined) {
      fields.push('x_url = :xUrl');
      params.xUrl = input.xUrl;
    }

    if (fields.length === 0) {
      const user = await this.findById(input.userId);
      if (!user) {
        throw new Error('Usuario no encontrado');
      }
      return user;
    }

    const [result] = await getPool().execute<ResultSetHeader>(
      `UPDATE users
       SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = :id`,
      params
    );

    if (result.affectedRows !== 1) {
      throw new Error('No fue posible actualizar el perfil');
    }

    const updated = await this.findById(input.userId);
    if (!updated) {
      throw new Error('Usuario no encontrado despues de actualizar');
    }
    return updated;
  },

  async listUsers(): Promise<User[]> {
    const [rows] = await getPool().query<RowDataPacket[]>(
      'SELECT * FROM users ORDER BY created_at DESC'
    );
    return rows.map(mapUser);
  },

  async updateUser(input: UpdateUserInput): Promise<User> {
    const fields: string[] = [];
    const params: Record<string, unknown> = { id: input.userId };

    if (input.firstName !== undefined) {
      fields.push('first_name = :firstName');
      params.firstName = input.firstName;
    }
    if (input.lastName !== undefined) {
      fields.push('last_name = :lastName');
      params.lastName = input.lastName;
    }
    if (input.email !== undefined) {
      fields.push('email = :email');
      params.email = input.email;
    }
    if (input.passwordHash !== undefined) {
      fields.push('password_hash = :passwordHash');
      params.passwordHash = input.passwordHash;
    }
    if (input.coverImageUrl !== undefined) {
      fields.push('cover_image_url = :coverImageUrl');
      params.coverImageUrl = input.coverImageUrl;
    }
    if (input.role !== undefined) {
      fields.push('role = :role');
      params.role = input.role;
    }
    if (input.isActive !== undefined) {
      fields.push('is_active = :isActive');
      params.isActive = input.isActive ? 1 : 0;
    }

    if (fields.length === 0) {
      const user = await this.findById(input.userId);
      if (!user) {
        throw new Error('Usuario no encontrado');
      }
      return user;
    }

    const [result] = await getPool().execute<ResultSetHeader>(
      `UPDATE users
       SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = :id`,
      params
    );

    if (result.affectedRows !== 1) {
      throw new Error('No fue posible actualizar el usuario');
    }

    const updated = await this.findById(input.userId);
    if (!updated) {
      throw new Error('Usuario no encontrado despues de actualizar');
    }
    return updated;
  },

  async updateRole(input: UpdateUserRoleInput): Promise<User> {
    const [result] = await getPool().execute<ResultSetHeader>(
      `UPDATE users
       SET role = :role, updated_at = CURRENT_TIMESTAMP
       WHERE id = :userId`,
      { role: input.role, userId: input.userId }
    );

    if (result.affectedRows !== 1) {
      throw new Error('No fue posible actualizar el rol del usuario');
    }

    const updated = await this.findById(input.userId);
    if (!updated) throw new Error('Usuario no encontrado despues de actualizar el rol');
    return updated;
  },

  async updateStatus(input: UpdateUserStatusInput): Promise<User> {
    const [result] = await getPool().execute<ResultSetHeader>(
      `UPDATE users
       SET is_active = :isActive, updated_at = CURRENT_TIMESTAMP
       WHERE id = :userId`,
      { isActive: input.isActive ? 1 : 0, userId: input.userId }
    );

    if (result.affectedRows !== 1) {
      throw new Error('No fue posible actualizar el estado del usuario');
    }

    const updated = await this.findById(input.userId);
    if (!updated) throw new Error('Usuario no encontrado despues de actualizar el estado');
    return updated;
  }
};
