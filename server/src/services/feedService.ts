import { feedRepository } from '../repositories/feedRepository';
import {
  CreateCommentInput,
  CreatePostInput,
  FeedComment,
  FeedPostAggregate,
  FeedReport,
  ReactionType,
  SharePostInput,
  ReportStatus
} from '../types/feed';

interface ListPostsOptions {
  viewerId: string;
  limit?: number;
  offset?: number;
  authorId?: string;
}

export const feedService = {
  async createPost(input: CreatePostInput, viewerId: string): Promise<FeedPostAggregate> {
    const post = await feedRepository.createPost(input);
    const aggregate = await feedRepository.findPostWithMeta(post.id, viewerId);
    if (!aggregate) {
      throw new Error('No fue posible cargar la publicacion recien creada');
    }
    return aggregate;
  },

  async listPosts({ viewerId, limit = 15, offset = 0, authorId }: ListPostsOptions): Promise<FeedPostAggregate[]> {
    return await feedRepository.listPosts(viewerId, limit, offset, authorId);
  },

  async addComment(input: CreateCommentInput, viewerId: string): Promise<{
    comment: FeedComment;
    reactionCount: number;
    commentCount: number;
    shareCount: number;
    viewerReaction: ReactionType | null;
    isSaved: boolean;
  }> {
    const comment = await feedRepository.addComment(input);
    const metrics = await feedRepository.getPostMetrics(input.postId, viewerId);
    return {
      comment,
      ...metrics
    };
  },

  async listComments(postId: string): Promise<FeedComment[]> {
    return await feedRepository.listComments(postId);
  },

  async toggleReaction(postId: string, userId: string, reactionType: ReactionType) {
    return await feedRepository.toggleReaction(postId, userId, reactionType);
  },

  async toggleSave(postId: string, userId: string) {
    return await feedRepository.toggleSave(postId, userId);
  },

  async sharePost(input: SharePostInput) {
    return await feedRepository.sharePost(input);
  },

  async getPost(postId: string, viewerId: string): Promise<FeedPostAggregate | null> {
    return await feedRepository.findPostWithMeta(postId, viewerId);
  },

  async deletePost(postId: string, userId: string) {
    const deleted = await feedRepository.deletePost(postId, userId);
    if (!deleted) {
      throw new Error('No se encontro la publicacion o no tienes permisos para eliminarla');
    }
  },

  async listSavedPosts(viewerId: string): Promise<FeedPostAggregate[]> {
    return await feedRepository.listSavedPosts(viewerId);
  },

  async reportPost(postId: string, reporterId: string, reason?: string | null): Promise<FeedReport> {
    return await feedRepository.createReport(postId, reporterId, reason);
  },

  async listReports(): Promise<FeedReport[]> {
    return await feedRepository.listReports();
  },

  async updateReportStatus(reportId: string, status: ReportStatus): Promise<FeedReport> {
    const report = await feedRepository.updateReportStatus(reportId, status);
    if (!report) {
      throw new Error('Reporte no encontrado');
    }
    return report;
  }
};
