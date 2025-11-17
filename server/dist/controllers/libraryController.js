"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.libraryController = void 0;
const libraryService_1 = require("../services/libraryService");
const libraryValidators_1 = require("../validators/libraryValidators");
const appError_1 = require("../utils/appError");
exports.libraryController = {
    create: async (req, res) => {
        const userId = req.user?.userId;
        if (!userId)
            throw new appError_1.AppError('Autenticación requerida', 401);
        const data = libraryValidators_1.createResourceSchema.parse(req.body);
        const resource = await libraryService_1.libraryService.createResource({ ...data, uploadedBy: userId });
        res.status(201).json({ success: true, resource });
    },
    list: async (_req, res) => {
        const resources = await libraryService_1.libraryService.listResources();
        res.json({ success: true, resources });
    },
    search: async (req, res) => {
        const term = req.query.q ?? '';
        const resources = await libraryService_1.libraryService.searchResources(term);
        res.json({ success: true, resources });
    },
    listMine: async (req, res) => {
        const userId = req.user?.userId;
        if (!userId)
            throw new appError_1.AppError('Autenticación requerida', 401);
        const resources = await libraryService_1.libraryService.listByUser(userId);
        res.json({ success: true, resources });
    }
};
