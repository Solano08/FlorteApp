import { groupRepository } from '../repositories/groupRepository';
import { AppError } from '../utils/appError';
import { CreateGroupInput, StudyGroup } from '../types/group';

export const groupService = {
  async createGroup(input: CreateGroupInput): Promise<StudyGroup> {
    if (!input.name.trim()) {
      throw new AppError('El nombre del grupo es obligatorio', 400);
    }
    return await groupRepository.createGroup(input);
  },

  async listGroups(): Promise<StudyGroup[]> {
    return await groupRepository.listGroups();
  },

  async listUserGroups(userId: string): Promise<StudyGroup[]> {
    return await groupRepository.listUserGroups(userId);
  },

  async addMember(groupId: string, userId: string): Promise<void> {
    await groupRepository.addMember(groupId, userId);
  },

  async getGroup(groupId: string): Promise<StudyGroup | null> {
    return await groupRepository.findById(groupId);
  }
};
