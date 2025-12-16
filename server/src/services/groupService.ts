import { groupRepository } from '../repositories/groupRepository';
import { channelRepository } from '../repositories/channelRepository';
import { AppError } from '../utils/appError';
import { CreateGroupInput, StudyGroup } from '../types/group';
import { userRepository } from '../repositories/userRepository';
import { verifyPassword } from '../utils/password';

export const groupService = {
  async createGroup(input: CreateGroupInput): Promise<StudyGroup> {
    if (!input.name.trim()) {
      throw new AppError('El nombre del grupo es obligatorio', 400);
    }
    const group = await groupRepository.createGroup(input);
    
    // Crear canal "general" automáticamente
    await channelRepository.createChannel({
      communityId: group.id,
      name: 'general',
      description: 'Canal general de la comunidad',
      type: 'text',
      position: 0,
      createdBy: input.createdBy
    });
    
    return group;
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

  async leaveGroup(groupId: string, userId: string): Promise<void> {
    const group = await groupRepository.findById(groupId);
    if (!group) {
      throw new AppError('Comunidad no encontrada', 404);
    }

    // Si es el dueño, no puede simplemente abandonar
    if (group.createdBy === userId) {
      throw new AppError(
        'Eres el propietario de esta comunidad. Debes eliminarla desde los ajustes.',
        400
      );
    }

    await groupRepository.removeMember(groupId, userId);
  },

  async getGroup(groupId: string): Promise<StudyGroup | null> {
    return await groupRepository.findById(groupId);
  },

  async deleteGroup(groupId: string, userId: string, password: string): Promise<void> {
    const group = await groupRepository.findById(groupId);
    if (!group) {
      throw new AppError('Comunidad no encontrada', 404);
    }

    if (group.createdBy !== userId) {
      throw new AppError('Solo el propietario de la comunidad puede eliminarla', 403);
    }

    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError('Usuario no encontrado', 404);
    }

    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AppError('Contraseña incorrecta', 400);
    }

    await groupRepository.deleteGroup(groupId);
  },

  async updateIcon(groupId: string, iconUrl: string): Promise<StudyGroup> {
    const group = await groupRepository.findById(groupId);
    if (!group) {
      throw new AppError('Comunidad no encontrada', 404);
    }
    return await groupRepository.updateIcon(groupId, iconUrl);
  },

  async updateCover(groupId: string, coverUrl: string): Promise<StudyGroup> {
    const group = await groupRepository.findById(groupId);
    if (!group) {
      throw new AppError('Comunidad no encontrada', 404);
    }
    return await groupRepository.updateCover(groupId, coverUrl);
  }
};
