import { Request, Response } from 'express';
import { channelService } from '../services/channelService';
import { AppError } from '../utils/appError';
import { z } from 'zod';

const createChannelSchema = z.object({
  communityId: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  type: z.enum(['text', 'voice']).optional().default('text'),
  position: z.number().int().optional()
});

const dataUrlSchema = z.string().refine((v) => v.startsWith('data:'), 'Debe ser data URL');
const createMessageSchema = z.object({
  content: z.string().min(1).optional(),
  attachmentUrl: z.union([z.string().url(), dataUrlSchema]).optional()
}).refine(data => data.content || data.attachmentUrl, {
  message: 'El mensaje debe tener contenido o un archivo adjunto'
});

export const channelController = {
  create: async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw new AppError('Autenticación requerida', 401);

    const data = createChannelSchema.parse(req.body);
    const channel = await channelService.createChannel({
      ...data,
      createdBy: userId
    });
    res.status(201).json({ success: true, channel });
  },

  list: async (req: Request, res: Response) => {
    const { communityId } = req.params;
    if (!communityId) {
      throw new AppError('communityId es requerido', 400);
    }
    const channels = await channelService.listChannels(communityId);
    res.json({ success: true, channels });
  },

  get: async (req: Request, res: Response) => {
    const { id } = req.params;
    const channel = await channelService.getChannel(id);
    if (!channel) {
      throw new AppError('Canal no encontrado', 404);
    }
    res.json({ success: true, channel });
  },

  delete: async (req: Request, res: Response) => {
    const { id } = req.params;
    await channelService.deleteChannel(id);
    res.json({ success: true });
  },

  createMessage: async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw new AppError('Autenticación requerida', 401);

    const { channelId } = req.params;
    const data = createMessageSchema.parse(req.body);

    const message = await channelService.createMessage({
      channelId,
      senderId: userId,
      ...data
    });
    res.status(201).json({ success: true, message });
  },

  listMessages: async (req: Request, res: Response) => {
    const { channelId } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

    const messages = await channelService.listMessages(channelId, limit, offset);
    res.json({ success: true, messages });
  },

  deleteMessage: async (req: Request, res: Response) => {
    const { id } = req.params;
    await channelService.deleteMessage(id);
    res.json({ success: true });
  }
};















