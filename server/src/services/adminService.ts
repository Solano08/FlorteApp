import { userService } from './userService';
import { PublicProfile, UpdateUserRoleInput, UpdateUserStatusInput, UserRole } from '../types/user';

interface AdminUpdateUserInput {
  userId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: UserRole;
  isActive?: boolean;
  password?: string;
  headline?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  coverImageUrl?: string | null;
  instagramUrl?: string | null;
  githubUrl?: string | null;
  facebookUrl?: string | null;
  contactEmail?: string | null;
  xUrl?: string | null;
}

export const adminService = {
  async listUsers(): Promise<PublicProfile[]> {
    return await userService.listUsers();
  },

  async updateUserRole(actorId: string, input: UpdateUserRoleInput): Promise<PublicProfile> {
    return await userService.updateUser(actorId, {
      userId: input.userId,
      role: input.role
    });
  },

  async updateUserStatus(actorId: string, input: UpdateUserStatusInput): Promise<PublicProfile> {
    return await userService.updateUser(actorId, {
      userId: input.userId,
      isActive: input.isActive
    });
  },

  async updateUser(actorId: string, input: AdminUpdateUserInput): Promise<PublicProfile> {
    return await userService.updateUser(actorId, input);
  }
};
