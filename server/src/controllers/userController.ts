import { Request, Response } from 'express';
import { userService } from '../services/userService';
import { createUserSchema, updateUserSchema, userIdParamSchema } from '../validators/userValidators';

export const userController = {
  list: async (_req: Request, res: Response) => {
    const users = await userService.listUsers();
    res.json({ success: true, users });
  },

  getById: async (req: Request, res: Response) => {
    const { userId } = userIdParamSchema.parse(req.params);
    const user = await userService.getUserById(userId);
    res.json({ success: true, user });
  },

  create: async (req: Request, res: Response) => {
    const data = createUserSchema.parse(req.body);
    const user = await userService.createUser(data);
    res.status(201).json({ success: true, user });
  },

  update: async (req: Request, res: Response) => {
    const { userId } = userIdParamSchema.parse(req.params);
    const data = updateUserSchema.parse(req.body);
    const user = await userService.updateUser(req.user?.userId, {
      userId,
      ...data
    });
    res.json({ success: true, user });
  },

  remove: async (req: Request, res: Response) => {
    const { userId } = userIdParamSchema.parse(req.params);
    const user = await userService.deleteUser(req.user?.userId, userId);
    res.json({ success: true, user });
  },

  restore: async (req: Request, res: Response) => {
    const { userId } = userIdParamSchema.parse(req.params);
    const user = await userService.restoreUser(req.user?.userId, userId);
    res.json({ success: true, user });
  }
};
