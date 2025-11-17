"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminController = void 0;
const adminService_1 = require("../services/adminService");
const feedService_1 = require("../services/feedService");
const appError_1 = require("../utils/appError");
const adminValidators_1 = require("../validators/adminValidators");
exports.adminController = {
    listUsers: async (_req, res) => {
        const users = await adminService_1.adminService.listUsers();
        res.json({ success: true, users });
    },
    updateRole: async (req, res) => {
        const { userId } = req.params;
        const { role } = adminValidators_1.updateRoleSchema.parse(req.body);
        const actorId = req.user?.userId;
        if (!actorId)
            throw new appError_1.AppError('Autenticacion requerida', 401);
        const user = await adminService_1.adminService.updateUserRole(actorId, { userId, role });
        res.json({ success: true, user });
    },
    updateStatus: async (req, res) => {
        const { userId } = req.params;
        const { isActive } = adminValidators_1.updateStatusSchema.parse(req.body);
        const actorId = req.user?.userId;
        if (!actorId)
            throw new appError_1.AppError('Autenticacion requerida', 401);
        const user = await adminService_1.adminService.updateUserStatus(actorId, { userId, isActive });
        res.json({ success: true, user });
    },
    updateUser: async (req, res) => {
        const { userId } = req.params;
        const actorId = req.user?.userId;
        if (!actorId)
            throw new appError_1.AppError('Autenticacion requerida', 401);
        const data = adminValidators_1.adminUpdateUserSchema.parse(req.body);
        const user = await adminService_1.adminService.updateUser(actorId, { userId, ...data });
        res.json({ success: true, user });
    },
    listReports: async (_req, res) => {
        const reports = await feedService_1.feedService.listReports();
        res.json({ success: true, reports });
    },
    updateReportStatus: async (req, res) => {
        const { reportId } = req.params;
        const { status } = adminValidators_1.updateReportStatusSchema.parse(req.body);
        const report = await feedService_1.feedService.updateReportStatus(reportId, status);
        res.json({ success: true, report });
    }
};
