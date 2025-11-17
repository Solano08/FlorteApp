"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.feedService = void 0;
const feedRepository_1 = require("../repositories/feedRepository");
exports.feedService = {
    async createPost(input, viewerId) {
        const post = await feedRepository_1.feedRepository.createPost(input);
        const aggregate = await feedRepository_1.feedRepository.findPostWithMeta(post.id, viewerId);
        if (!aggregate) {
            throw new Error('No fue posible cargar la publicacion recien creada');
        }
        return aggregate;
    },
    async listPosts({ viewerId, limit = 15, offset = 0, authorId }) {
        return await feedRepository_1.feedRepository.listPosts(viewerId, limit, offset, authorId);
    },
    async addComment(input, viewerId) {
        const comment = await feedRepository_1.feedRepository.addComment(input);
        const metrics = await feedRepository_1.feedRepository.getPostMetrics(input.postId, viewerId);
        return {
            comment,
            ...metrics
        };
    },
    async listComments(postId) {
        return await feedRepository_1.feedRepository.listComments(postId);
    },
    async toggleReaction(postId, userId, reactionType) {
        return await feedRepository_1.feedRepository.toggleReaction(postId, userId, reactionType);
    },
    async toggleSave(postId, userId) {
        return await feedRepository_1.feedRepository.toggleSave(postId, userId);
    },
    async sharePost(input) {
        return await feedRepository_1.feedRepository.sharePost(input);
    },
    async getPost(postId, viewerId) {
        return await feedRepository_1.feedRepository.findPostWithMeta(postId, viewerId);
    },
    async deletePost(postId, userId) {
        const deleted = await feedRepository_1.feedRepository.deletePost(postId, userId);
        if (!deleted) {
            throw new Error('No se encontro la publicacion o no tienes permisos para eliminarla');
        }
    },
    async listSavedPosts(viewerId) {
        return await feedRepository_1.feedRepository.listSavedPosts(viewerId);
    },
    async reportPost(postId, reporterId, reason) {
        return await feedRepository_1.feedRepository.createReport(postId, reporterId, reason);
    },
    async listReports() {
        return await feedRepository_1.feedRepository.listReports();
    },
    async updateReportStatus(reportId, status) {
        const report = await feedRepository_1.feedRepository.updateReportStatus(reportId, status);
        if (!report) {
            throw new Error('Reporte no encontrado');
        }
        return report;
    }
};
