"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userController = void 0;
const userService_1 = require("../services/userService");
const userValidators_1 = require("../validators/userValidators");
exports.userController = {
    list: async (_req, res) => {
        const users = await userService_1.userService.listUsers();
        res.json({ success: true, users });
    },
    getById: async (req, res) => {
        const { userId } = userValidators_1.userIdParamSchema.parse(req.params);
        const user = await userService_1.userService.getUserById(userId);
        res.json({ success: true, user });
    },
    create: async (req, res) => {
        const data = userValidators_1.createUserSchema.parse(req.body);
        const user = await userService_1.userService.createUser(data);
        res.status(201).json({ success: true, user });
    },
    update: async (req, res) => {
        const { userId } = userValidators_1.userIdParamSchema.parse(req.params);
        const data = userValidators_1.updateUserSchema.parse(req.body);
        const user = await userService_1.userService.updateUser(req.user?.userId, {
            userId,
            ...data
        });
        res.json({ success: true, user });
    },
    remove: async (req, res) => {
        const { userId } = userValidators_1.userIdParamSchema.parse(req.params);
        const user = await userService_1.userService.deleteUser(req.user?.userId, userId);
        res.json({ success: true, user });
    },
    restore: async (req, res) => {
        const { userId } = userValidators_1.userIdParamSchema.parse(req.params);
        const user = await userService_1.userService.restoreUser(req.user?.userId, userId);
        res.json({ success: true, user });
    }
};
