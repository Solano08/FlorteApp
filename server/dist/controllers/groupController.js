"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.groupController = void 0;
const groupService_1 = require("../services/groupService");
const groupValidators_1 = require("../validators/groupValidators");
const appError_1 = require("../utils/appError");
exports.groupController = {
    create: async (req, res) => {
        const userId = req.user?.userId;
        if (!userId)
            throw new appError_1.AppError('Autenticación requerida', 401);
        const data = groupValidators_1.createGroupSchema.parse(req.body);
        const group = await groupService_1.groupService.createGroup({ ...data, createdBy: userId });
        res.status(201).json({ success: true, group });
    },
    list: async (_req, res) => {
        const groups = await groupService_1.groupService.listGroups();
        res.json({ success: true, groups });
    },
    listMine: async (req, res) => {
        const userId = req.user?.userId;
        if (!userId)
            throw new appError_1.AppError('Autenticación requerida', 401);
        const groups = await groupService_1.groupService.listUserGroups(userId);
        res.json({ success: true, groups });
    }
};
