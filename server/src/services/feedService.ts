import { feedRepository } from '../repositories/feedRepository';
import {
  CreateCommentInput,
  CreatePostInput,
  FeedComment,
  FeedPostAggregate,
  ReactionType,
  SharePostInput
} from '../types/feed';

export const feedService = {
  async createPost(input: CreatePostInput, viewerId: string): Promise<FeedPostAggregate> {
    const post = await feedRepository.createPost(input);
    const aggregate = await feedRepository.findPostWithMeta(post.id, viewerId);
    if (!aggregate) {
      throw new Error('No fue posible cargar la publicacion recien creada');
    }
    return aggregate;
  },

  async listPosts(viewerId: string, limit = 15, offset = 0): Promise<FeedPostAggregate[]> {
    return await feedRepository.listPosts(viewerId, limit, offset);
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
  }
};
