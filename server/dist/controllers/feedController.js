"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.feedController = void 0;
const feedService_1 = require("../services/feedService");
const feedValidators_1 = require("../validators/feedValidators");
const appError_1 = require("../utils/appError");
exports.feedController = {
    async listFeed(req, res) {
        const userId = req.user?.userId;
        if (!userId) {
            throw new appError_1.AppError('Autenticacion requerida', 401);
        }
        const { limit = 15, offset = 0, authorId } = feedValidators_1.feedPaginationSchema.parse(req.query);
        const posts = await feedService_1.feedService.listPosts({ viewerId: userId, limit, offset, authorId });
        res.json({ success: true, posts });
    },
    async createPost(req, res) {
        const userId = req.user?.userId;
        if (!userId) {
            throw new appError_1.AppError('Autenticacion requerida', 401);
        }
        const data = feedValidators_1.createPostSchema.parse(req.body);
        const post = await feedService_1.feedService.createPost({
            authorId: userId,
            content: data.content,
            mediaUrl: data.mediaUrl ?? null,
            tags: data.tags ?? [],
            attachments: data.attachments ?? []
        }, userId);
        res.status(201).json({ success: true, post });
    },
    async reactToPost(req, res) {
        const userId = req.user?.userId;
        if (!userId) {
            throw new appError_1.AppError('Autenticacion requerida', 401);
        }
        const { postId } = req.params;
        const { reactionType } = feedValidators_1.toggleReactionSchema.parse(req.body);
        const metrics = await feedService_1.feedService.toggleReaction(postId, userId, reactionType);
        res.json({ success: true, metrics });
    },
    async commentOnPost(req, res) {
        const userId = req.user?.userId;
        if (!userId) {
            throw new appError_1.AppError('Autenticacion requerida', 401);
        }
        const { postId } = req.params;
        const { content } = feedValidators_1.createCommentSchema.parse(req.body);
        const result = await feedService_1.feedService.addComment({ postId, userId, content }, userId);
        res.status(201).json({ success: true, ...result });
    },
    async listComments(req, res) {
        const userId = req.user?.userId;
        if (!userId) {
            throw new appError_1.AppError('Autenticacion requerida', 401);
        }
        const { postId } = req.params;
        const comments = await feedService_1.feedService.listComments(postId);
        res.json({ success: true, comments });
    },
    async toggleSave(req, res) {
        const userId = req.user?.userId;
        if (!userId) {
            throw new appError_1.AppError('Autenticacion requerida', 401);
        }
        const { postId } = req.params;
        const metrics = await feedService_1.feedService.toggleSave(postId, userId);
        res.json({ success: true, metrics });
    },
    async sharePost(req, res) {
        const userId = req.user?.userId;
        if (!userId) {
            throw new appError_1.AppError('Autenticacion requerida', 401);
        }
        const { postId } = req.params;
        const { message } = feedValidators_1.sharePostSchema.parse(req.body);
        const result = await feedService_1.feedService.sharePost({ postId, userId, message });
        res.status(201).json({ success: true, ...result });
    },
    async listSavedPosts(req, res) {
        const userId = req.user?.userId;
        if (!userId)
            throw new appError_1.AppError('Autenticacion requerida', 401);
        const posts = await feedService_1.feedService.listSavedPosts(userId);
        res.json({ success: true, posts });
    },
    async reportPost(req, res) {
        const userId = req.user?.userId;
        if (!userId)
            throw new appError_1.AppError('Autenticacion requerida', 401);
        const { postId } = req.params;
        const { reason } = feedValidators_1.reportPostSchema.parse(req.body);
        const report = await feedService_1.feedService.reportPost(postId, userId, reason);
        res.status(201).json({ success: true, report });
    },
    async uploadMedia(req, res) {
        if (!req.user?.userId) {
            throw new appError_1.AppError('Autenticacion requerida', 401);
        }
        const file = req.file;
        if (!file) {
            throw new appError_1.AppError('No se recibio ningun archivo', 400);
        }
        res.status(201).json({
            success: true,
            url: `/uploads/feed/media/${file.filename}`,
            fileName: file.originalname,
            mimeType: file.mimetype
        });
    },
    async uploadAttachment(req, res) {
        if (!req.user?.userId) {
            throw new appError_1.AppError('Autenticacion requerida', 401);
        }
        const file = req.file;
        if (!file) {
            throw new appError_1.AppError('No se recibio ningun archivo', 400);
        }
        res.status(201).json({
            success: true,
            url: `/uploads/feed/files/${file.filename}`,
            fileName: file.originalname,
            mimeType: file.mimetype
        });
    },
    async deletePost(req, res) {
        const userId = req.user?.userId;
        if (!userId) {
            throw new appError_1.AppError('Autenticacion requerida', 401);
        }
        const { postId } = req.params;
        await feedService_1.feedService.deletePost(postId, userId);
        res.status(204).send();
    }
};
