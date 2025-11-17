import { apiClient } from './apiClient';
import { FeedComment, FeedPostAggregate, FeedReport, PostMetrics, ReactionType } from '../types/feed';
import { normalizeFeedComment, normalizeFeedPost, normalizeFeedReport } from '../utils/media';

interface ListPostsResponse {
  success: boolean;
  posts: FeedPostAggregate[];
}

interface CreatePostPayload {
  content: string;
  mediaUrl?: string | null;
  tags?: string[];
  attachments?: Array<{
    url: string;
    fileName?: string | null;
    fileType?: string | null;
  }>;
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

interface UploadResponse {
  success: boolean;
  url: string;
  fileName?: string;
  mimeType?: string;
}

interface SavedPostsResponse {
  success: boolean;
  posts: FeedPostAggregate[];
}

interface ReportResponse {
  success: boolean;
  report: FeedReport;
}

export const feedService = {
  async listPosts(params?: { limit?: number; offset?: number; authorId?: string }): Promise<FeedPostAggregate[]> {
    const { data } = await apiClient.get<ListPostsResponse>('/feed', { params });
    return data.posts.map((post) => normalizeFeedPost(post));
  },

  async createPost(payload: CreatePostPayload): Promise<FeedPostAggregate> {
    const { data } = await apiClient.post<CreatePostResponse>('/feed', payload);
    return normalizeFeedPost(data.post);
  },

  async react(postId: string, reactionType: ReactionType): Promise<PostMetrics> {
    const { data } = await apiClient.post<ReactionResponse>(`/feed/${postId}/reactions`, { reactionType });
    return data.metrics;
  },

  async comment(postId: string, content: string): Promise<CommentResponse> {
    const { data } = await apiClient.post<CommentResponse>(`/feed/${postId}/comments`, { content });
    return {
      ...data,
      comment: normalizeFeedComment(data.comment)
    };
  },

  async listComments(postId: string): Promise<FeedComment[]> {
    const { data } = await apiClient.get<CommentsListResponse>(`/feed/${postId}/comments`);
    return data.comments.map((comment) => normalizeFeedComment(comment));
  },

  async toggleSave(postId: string): Promise<PostMetrics> {
    const { data } = await apiClient.post<ReactionResponse>(`/feed/${postId}/save`, {});
    return data.metrics;
  },

  async share(postId: string, message?: string): Promise<ShareResponse> {
    const { data } = await apiClient.post<ShareResponse>(`/feed/${postId}/share`, { message });
    return data;
  },

  async listSavedPosts(): Promise<FeedPostAggregate[]> {
    const { data } = await apiClient.get<SavedPostsResponse>('/feed/saved');
    return data.posts.map((post) => normalizeFeedPost(post));
  },

  async reportPost(postId: string, reason?: string | null): Promise<FeedReport> {
    const { data } = await apiClient.post<ReportResponse>(`/feed/${postId}/report`, { reason });
    return normalizeFeedReport(data.report);
  },

  async uploadMedia(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await apiClient.post<UploadResponse>('/feed/uploads/media', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data;
  },

  async uploadAttachment(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await apiClient.post<UploadResponse>('/feed/uploads/attachments', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data;
  },

  async deletePost(postId: string): Promise<void> {
    await apiClient.delete(`/feed/${postId}`);
  }
};
