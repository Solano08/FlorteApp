import { userService } from './userService';
import { PublicProfile, UpdateUserRoleInput, UpdateUserStatusInput } from '../types/user';

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
  }
};
