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

const updateChannelSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  type: z.enum(['text', 'voice']).optional(),
  position: z.number().int().optional()
});

const reportMessageSchema = z.object({
  reason: z.string().min(1, 'Indica el motivo'),
  details: z.string().max(500).optional()
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

  update: async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw new AppError('Autenticación requerida', 401);

    const { id } = req.params;
    const data = updateChannelSchema.parse(req.body);
    const payload: { name?: string; description?: string | null; type?: 'text' | 'voice'; position?: number } = {};
    if (data.name !== undefined) payload.name = data.name;
    if (data.description !== undefined) payload.description = data.description ?? null;
    if (data.type !== undefined) payload.type = data.type;
    if (data.position !== undefined) payload.position = data.position;

    const channel = await channelService.updateChannel(id, payload);
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
    const viewerId = req.user?.userId;

    const messages = await channelService.listMessages(channelId, limit, offset, viewerId);
    res.json({ success: true, messages });
  },

  deleteMessage: async (req: Request, res: Response) => {
    const { id } = req.params;
    await channelService.deleteMessage(id);
    res.json({ success: true });
  },

  reportMessage: async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw new AppError('Autenticación requerida', 401);

    const { id } = req.params;
    const data = reportMessageSchema.parse(req.body);
    const report = await channelService.reportMessage(id, userId, data.reason, data.details);
    res.status(201).json({ success: true, report });
  },

  toggleStarMessage: async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw new AppError('Autenticación requerida', 401);

    const { id } = req.params;
    const result = await channelService.toggleStarMessage(id, userId);
    res.json({ success: true, starred: result.starred });
  },

  togglePinMessage: async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw new AppError('Autenticación requerida', 401);

    const { id } = req.params;
    const message = await channelService.togglePinMessage(id, userId);
    res.json({ success: true, message });
  }
};















