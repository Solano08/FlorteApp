import { apiClient } from './apiClient';
import {
  FeedComment,
  FeedPostAggregate,
  FeedReport,
  PostMetrics,
  ProfileFeedPost,
  ReactionType
} from '../types/feed';
import { normalizeFeedComment, normalizeFeedPost, normalizeFeedReport } from '../utils/media';

interface ListPostsResponse {
  success: boolean;
  posts: FeedPostAggregate[];
}

interface CreatePostPayload {
  content: string;
  mediaUrl?: string | null;
  tags?: string[];
  attachments?: Array<{ url: string; mimeType?: string | null }>;
}

interface CreatePostResponse {
  success: boolean;
  post: FeedPostAggregate;
}

interface UpdatePostPayload {
  content?: string;
  mediaUrl?: string | null;
  tags?: string[];
}

interface UpdatePostResponse {
  success: boolean;
  post: FeedPostAggregate;
}

interface DeletePostResponse {
  success: boolean;
}

interface GetPostResponse {
  success: boolean;
  post: FeedPostAggregate | null;
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

interface UpdateCommentResponse {
  success: boolean;
  comment: FeedComment;
}

interface DeleteCommentResponse {
  success: boolean;
  metrics: PostMetrics;
}

interface ShareResponse extends PostMetrics {
  success: boolean;
  shareId: string;
}

interface SavedPostsResponse {
  success: boolean;
  savedPosts: FeedPostAggregate[];
}

interface ProfilePostsResponse {
  success: boolean;
  posts: ProfileFeedPost[];
}

interface ReportResponse {
  success: boolean;
  report: FeedReport;
}

const normalizePost = (post: FeedPostAggregate): FeedPostAggregate => normalizeFeedPost(post);

const normalizeProfilePost = (post: ProfileFeedPost): ProfileFeedPost => ({
  ...normalizePost(post),
  source: post.source,
  sharedAt: post.sharedAt,
  shareMessage: post.shareMessage,
  shareId: post.shareId
});

const normalizeComment = (comment: FeedComment): FeedComment => normalizeFeedComment(comment);
const normalizeReport = (report: FeedReport): FeedReport => normalizeFeedReport(report);

export const feedService = {
  async listPosts(params?: { limit?: number; offset?: number }): Promise<FeedPostAggregate[]> {
    const { data } = await apiClient.get<ListPostsResponse>('/feed', { params });
    return data.posts.map(normalizePost);
  },

  async listSavedPosts(limit?: number): Promise<FeedPostAggregate[]> {
    const { data } = await apiClient.get<SavedPostsResponse>('/feed/saved', { params: { limit } });
    return data.savedPosts.map(normalizePost);
  },

  async createPost(payload: CreatePostPayload): Promise<FeedPostAggregate> {
    const { data } = await apiClient.post<CreatePostResponse>('/feed', payload);
    return normalizePost(data.post);
  },

  async updatePost(postId: string, payload: UpdatePostPayload): Promise<FeedPostAggregate> {
    const { data } = await apiClient.patch<UpdatePostResponse>(`/feed/${postId}`, payload);
    return normalizePost(data.post);
  },

  async deletePost(postId: string): Promise<boolean> {
    const { data } = await apiClient.delete<DeletePostResponse>(`/feed/${postId}`);
    return data.success;
  },

  async getPost(postId: string): Promise<FeedPostAggregate | null> {
    const { data } = await apiClient.get<GetPostResponse>(`/feed/${postId}`);
    return data.post ? normalizePost(data.post) : null;
  },

  async listProfilePosts(limit?: number): Promise<ProfileFeedPost[]> {
    const { data } = await apiClient.get<ProfilePostsResponse>('/profile/me/posts', { params: { limit } });
    return data.posts.map(normalizeProfilePost);
  },

  async react(postId: string, reactionType: ReactionType): Promise<PostMetrics> {
    const { data } = await apiClient.post<ReactionResponse>(`/feed/${postId}/reactions`, { reactionType });
    return data.metrics;
  },

  async comment(postId: string, payload: { content: string; attachmentUrl?: string | null }): Promise<CommentResponse> {
    const { data } = await apiClient.post<CommentResponse>(`/feed/${postId}/comments`, payload);
    return {
      ...data,
      comment: normalizeComment(data.comment)
    };
  },

  async listComments(postId: string): Promise<FeedComment[]> {
    const { data } = await apiClient.get<CommentsListResponse>(`/feed/${postId}/comments`);
    return data.comments.map(normalizeComment);
  },

  async updateComment(postId: string, commentId: string, content: string): Promise<FeedComment> {
    const { data } = await apiClient.patch<UpdateCommentResponse>(`/feed/${postId}/comments/${commentId}`, {
      content
    });
    return normalizeComment(data.comment);
  },

  async deleteComment(postId: string, commentId: string): Promise<PostMetrics> {
    const { data } = await apiClient.delete<DeleteCommentResponse>(`/feed/${postId}/comments/${commentId}`);
    return data.metrics;
  },

  async toggleSave(postId: string): Promise<PostMetrics> {
    const { data } = await apiClient.post<ReactionResponse>(`/feed/${postId}/save`, {});
    return data.metrics;
  },

  async share(postId: string, message?: string): Promise<ShareResponse> {
    const { data } = await apiClient.post<ShareResponse>(`/feed/${postId}/share`, { message });
    return data;
  },

  async report(
    postId: string,
    payload: { reason: string; details?: string; commentId?: string }
  ): Promise<FeedReport> {
    const { data } = await apiClient.post<ReportResponse>(`/feed/${postId}/report`, payload);
    return normalizeReport(data.report);
  }
};
