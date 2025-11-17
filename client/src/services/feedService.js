import { apiClient } from './apiClient';
import { normalizeFeedComment, normalizeFeedPost, normalizeFeedReport } from '../utils/media';
export const feedService = {
    async listPosts(params) {
        const { data } = await apiClient.get('/feed', { params });
        return data.posts.map((post) => normalizeFeedPost(post));
    },
    async createPost(payload) {
        const { data } = await apiClient.post('/feed', payload);
        return normalizeFeedPost(data.post);
    },
    async react(postId, reactionType) {
        const { data } = await apiClient.post(`/feed/${postId}/reactions`, { reactionType });
        return data.metrics;
    },
    async comment(postId, content) {
        const { data } = await apiClient.post(`/feed/${postId}/comments`, { content });
        return {
            ...data,
            comment: normalizeFeedComment(data.comment)
        };
    },
    async listComments(postId) {
        const { data } = await apiClient.get(`/feed/${postId}/comments`);
        return data.comments.map((comment) => normalizeFeedComment(comment));
    },
    async toggleSave(postId) {
        const { data } = await apiClient.post(`/feed/${postId}/save`, {});
        return data.metrics;
    },
    async share(postId, message) {
        const { data } = await apiClient.post(`/feed/${postId}/share`, { message });
        return data;
    },
    async listSavedPosts() {
        const { data } = await apiClient.get('/feed/saved');
        return data.posts.map((post) => normalizeFeedPost(post));
    },
    async reportPost(postId, reason) {
        const { data } = await apiClient.post(`/feed/${postId}/report`, { reason });
        return normalizeFeedReport(data.report);
    },
    async uploadMedia(file) {
        const formData = new FormData();
        formData.append('file', file);
        const { data } = await apiClient.post('/feed/uploads/media', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return data;
    },
    async uploadAttachment(file) {
        const formData = new FormData();
        formData.append('file', file);
        const { data } = await apiClient.post('/feed/uploads/attachments', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return data;
    },
    async deletePost(postId) {
        await apiClient.delete(`/feed/${postId}`);
    }
};
