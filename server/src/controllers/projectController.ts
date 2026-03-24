import { Request, Response } from 'express';
import { projectService } from '../services/projectService';
import { uploadBuffer } from '../services/cloudinaryService';
import {
  createProjectSchema,
  updateProjectSchema,
  updateWorkspaceNotesSchema
} from '../validators/projectValidators';
import { AppError } from '../utils/appError';

export const projectController = {
  create: async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw new AppError('Autenticación requerida', 401);
    const data = createProjectSchema.parse(req.body);
    const project = await projectService.createProject({ ...data, ownerId: userId });
    res.status(201).json({ success: true, project });
  },

  list: async (_req: Request, res: Response) => {
    const projects = await projectService.listProjects();
    res.json({ success: true, projects });
  },

  listMine: async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw new AppError('Autenticación requerida', 401);
    const projects = await projectService.listByUser(userId);
    res.json({ success: true, projects });
  },

  update: async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw new AppError('Autenticación requerida', 401);
    const { projectId } = req.params;
    const data = updateProjectSchema.parse(req.body);
    const project = await projectService.updateProject(userId, { projectId, ...data });
    res.json({ success: true, project });

  },

  delete: async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw new AppError('Autenticación requerida', 401);
    const { projectId } = req.params;
    await projectService.deleteProject(userId, projectId);
    res.status(204).send();
  },

  uploadCover: async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw new AppError('Autenticación requerida', 401);
    const { projectId } = req.params;
    const file = req.file;
    if (!file?.buffer) {
      throw new AppError('No se proporcionó ningún archivo', 400);
    }
    const coverUrl = await uploadBuffer(file.buffer, 'projects', {
      mimetype: file.mimetype,
      filename: file.originalname
    });
    const project = await projectService.updateProjectCover(userId, projectId, coverUrl);
    res.json({ success: true, project });
  },

  getPanel: async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw new AppError('Autenticación requerida', 401);
    const { projectId } = req.params;
    const panel = await projectService.getProjectPanel(userId, projectId);
    res.json({ success: true, ...panel });
  },

  updateWorkspaceNotes: async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw new AppError('Autenticación requerida', 401);
    const { projectId } = req.params;
    const { notes } = updateWorkspaceNotesSchema.parse(req.body);
    const project = await projectService.updateWorkspaceNotes(userId, projectId, notes ?? null);
    res.json({ success: true, project });
  },

  uploadWorkspaceAttachment: async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw new AppError('Autenticación requerida', 401);
    const { projectId } = req.params;
    const file = req.file;
    if (!file?.buffer) {
      throw new AppError('No se proporcionó ningún archivo', 400);
    }
    const attachment = await projectService.addProjectAttachment(userId, projectId, {
      buffer: file.buffer,
      mimetype: file.mimetype,
      originalname: file.originalname
    });
    res.status(201).json({ success: true, attachment });
  },

  deleteWorkspaceAttachment: async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw new AppError('Autenticación requerida', 401);
    const { projectId, attachmentId } = req.params;
    await projectService.deleteProjectAttachment(userId, projectId, attachmentId);
    res.status(204).send();
  }
};
