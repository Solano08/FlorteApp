import { friendRepository } from '../repositories/friendRepository';
import { FriendRequest, FriendRequestStatus } from '../types/friend';
import { AppError } from '../utils/appError';
import { notificationService } from './notificationService';
import { userService } from './userService';

export const friendService = {
  async sendRequest(senderId: string, receiverId: string): Promise<FriendRequest> {
    if (senderId === receiverId) {
      throw new AppError('No puedes enviarte una solicitud de amistad a ti mismo', 400);
    }

    const existing = await friendRepository.findRequestByUsers(senderId, receiverId);
    if (existing) {
      // Si ya existe una solicitud o ya son amigos, devolvemos la solicitud existente
      return existing;
    }

    const request = await friendRepository.createRequest(senderId, receiverId);

    // Crear notificación para el receptor de la solicitud
    const sender = await userService.getUserById(senderId);
    const senderName = `${sender.firstName} ${sender.lastName}`.trim() || 'Un usuario';
    await notificationService.createNotification({
      userId: receiverId,
      message: `${senderName} te ha enviado una solicitud de amistad`,
      link: `/profile/${senderId}`
    });

    return request;
  },

  async listRequests(userId: string): Promise<FriendRequest[]> {
    return await friendRepository.listRequestsForUser(userId);
  },

  async updateRequestStatus(
    requestId: string,
    actingUserId: string,
    status: FriendRequestStatus
  ): Promise<void> {
    const request = await friendRepository.findRequestById(requestId);
    if (!request) {
      throw new AppError('Solicitud de amistad no encontrada', 404);
    }

    if (request.receiverId !== actingUserId) {
      throw new AppError('Solo el receptor puede gestionar esta solicitud', 403);
    }

    if (request.status !== 'pending') {
      throw new AppError('La solicitud ya fue respondida', 400);
    }

    await friendRepository.updateRequestStatus(requestId, status);

    if (status === 'accepted') {
      await friendRepository.createFriendship(request.senderId, request.receiverId);
    }
  },

  async listFriends(userId: string) {
    return await friendRepository.listFriends(userId);
  },

  async cancelRequest(requestId: string, actingUserId: string): Promise<void> {
    const request = await friendRepository.findRequestById(requestId);
    if (!request) {
      throw new AppError('Solicitud de amistad no encontrada', 404);
    }

    if (request.senderId !== actingUserId) {
      throw new AppError('Solo quien envió la solicitud puede cancelarla', 403);
    }

    if (request.status !== 'pending') {
      throw new AppError('La solicitud ya fue respondida', 400);
    }

    await friendRepository.deleteRequest(requestId);
  }
};


