import { apiClient } from './apiClient';
import { FeedComment, FeedPostAggregate, PostMetrics, ReactionType } from '../types/feed';

interface ListPostsResponse {
  success: boolean;
  posts: FeedPostAggregate[];
}

interface CreatePostPayload {
  content: string;
  mediaUrl?: string | null;
  tags?: string[];
}

interface CreatePostResponse {
  success: boolean;
  post: FeedPostAggregate;
}

interface ReactionResponse {
  success: boolean;
  metrics: PostMetrics;
}

interface CommentResponse {
  success: boolean;
  comment: FeedComment;
  reactionCount: number;
  commentCount: number;
  shareCount: number;
  viewerReaction: ReactionType | null;
  isSaved: boolean;
}

interface CommentsListResponse {
  success: boolean;
  comments: FeedComment[];
}

interface ShareResponse extends PostMetrics {
  success: boolean;
  shareId: string;
}

export const feedService = {
  async listPosts(params?: { limit?: number; offset?: number }): Promise<FeedPostAggregate[]> {
    const { data } = await apiClient.get<ListPostsResponse>('/feed', { params });
    return data.posts;
  },

  async createPost(payload: CreatePostPayload): Promise<FeedPostAggregate> {
    const { data } = await apiClient.post<CreatePostResponse>('/feed', payload);
    return data.post;
  },

  async react(postId: string, reactionType: ReactionType): Promise<PostMetrics> {
    const { data } = await apiClient.post<ReactionResponse>(`/feed/${postId}/reactions`, { reactionType });
    return data.metrics;
  },

  async comment(postId: string, content: string): Promise<CommentResponse> {
    const { data } = await apiClient.post<CommentResponse>(`/feed/${postId}/comments`, { content });
    return data;
  },

  async listComments(postId: string): Promise<FeedComment[]> {
    const { data } = await apiClient.get<CommentsListResponse>(`/feed/${postId}/comments`);
    return data.comments;
  },

  async toggleSave(postId: string): Promise<PostMetrics> {
    const { data } = await apiClient.post<ReactionResponse>(`/feed/${postId}/save`);
    return data.metrics;
  },

  async share(postId: string, message?: string): Promise<ShareResponse> {
    const { data } = await apiClient.post<ShareResponse>(`/feed/${postId}/share`, { message });
    return data;
  }
};
