"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.profileController = void 0;
const profileService_1 = require("../services/profileService");
const profileValidators_1 = require("../validators/profileValidators");
const appError_1 = require("../utils/appError");
const activityService_1 = require("../services/activityService");
const feedService_1 = require("../services/feedService");
exports.profileController = {
    me: async (req, res) => {
        const userId = req.user?.userId;
        if (!userId) {
            throw new appError_1.AppError('Autenticacion requerida', 401);
        }
        const profile = await profileService_1.profileService.getProfile(userId);
        res.json({ success: true, profile });
    },
    updateProfile: async (req, res) => {
        const userId = req.user?.userId;
        if (!userId) {
            throw new appError_1.AppError('Autenticacion requerida', 401);
        }
        const data = profileValidators_1.updateProfileSchema.parse(req.body);
        const profile = await profileService_1.profileService.updateProfile({ userId, ...data });
        res.json({ success: true, profile });
    },
    updateAvatar: async (req, res) => {
        const userId = req.user?.userId;
        if (!userId) {
            throw new appError_1.AppError('Autenticacion requerida', 401);
        }
        const file = req.file;
        const avatarUrl = file ? `/uploads/avatars/${file.filename}` : null;
        const profile = await profileService_1.profileService.updateAvatar(userId, avatarUrl);
        res.json({ success: true, profile });
    },
    updateCover: async (req, res) => {
        const userId = req.user?.userId;
        if (!userId) {
            throw new appError_1.AppError('Autenticacion requerida', 401);
        }
        const file = req.file;
        const coverUrl = file ? `/uploads/covers/${file.filename}` : null;
        const profile = await profileService_1.profileService.updateCover(userId, coverUrl);
        res.json({ success: true, profile });
    },
    activityOverview: async (req, res) => {
        const userId = req.user?.userId;
        if (!userId) {
            throw new appError_1.AppError('Autenticacion requerida', 401);
        }
        const { weeks } = profileValidators_1.profileActivityQuerySchema.parse(req.query);
        const activity = await activityService_1.activityService.getProfileActivity(userId, weeks);
        res.json({ success: true, activity });
    },
    recentPosts: async (req, res) => {
        const userId = req.user?.userId;
        if (!userId) {
            throw new appError_1.AppError('Autenticacion requerida', 401);
        }
        const { limit } = profileValidators_1.profilePostsQuerySchema.parse(req.query);
        const posts = await feedService_1.feedService.listPosts({ viewerId: userId, limit, authorId: userId });
        res.json({ success: true, posts });
    }
};
