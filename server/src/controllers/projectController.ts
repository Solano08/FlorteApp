import { Request, Response } from 'express';
import { projectService } from '../services/projectService';
import { createProjectSchema, updateProjectSchema } from '../validators/projectValidators';
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
  }
};
