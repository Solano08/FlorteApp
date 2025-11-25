export type ReactionType = 'like' | 'celebrate' | 'love' | 'insightful' | 'support';

export interface FeedAuthor {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  headline: string | null;
}

export interface FeedPost {
  id: string;
  authorId: string;
  content: string;
  mediaUrl: string | null;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  attachments?: FeedAttachment[];
}

export interface FeedComment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  attachmentUrl: string | null;
  createdAt: Date;
  author: FeedAuthor;
}

export interface FeedAttachment {
  id: string;
  postId: string;
  url: string;
  mimeType: string | null;
  createdAt: Date;
}

export interface FeedPostAggregate extends FeedPost {
  author: FeedAuthor;
  reactionCount: number;
  commentCount: number;
  shareCount: number;
  viewerReaction: ReactionType | null;
  isSaved: boolean;
  latestComments: FeedComment[];
}

export interface PostMetrics {
  reactionCount: number;
  commentCount: number;
  shareCount: number;
  viewerReaction: ReactionType | null;
  isSaved: boolean;
}

export interface CreatePostInput {
  authorId: string;
  content: string;
  mediaUrl?: string | null;
  tags?: string[];
  attachments?: Array<{ url: string; mimeType?: string | null }>;
}

export interface CreateCommentInput {
  postId: string;
  userId: string;
  content: string;
  attachmentUrl?: string | null;
}

export interface ToggleReactionInput {
  postId: string;
  userId: string;
  reactionType: ReactionType;
}

export interface SharePostInput {
  postId: string;
  userId: string;
  message?: string;
}

export type ReportStatus = 'pending' | 'reviewed';

export interface FeedReport {
  id: string;
  postId: string;
  reporterId: string;
  reason: string;
  details: string | null;
  status: ReportStatus;
  createdAt: Date;
  resolvedAt: Date | null;
  reporter: FeedAuthor;
  post: FeedPost;
  postAuthor: FeedAuthor;
  commentId: string | null;
  commentContent: string | null;
  commentAttachmentUrl: string | null;
  commentAuthor: FeedAuthor | null;
}

export interface ReportPostInput {
  postId: string;
  reporterId: string;
  reason: string;
  details?: string | null;
  commentId?: string | null;
}

export type ProfilePostSource = 'own' | 'shared';

export interface ProfileFeedPost extends FeedPostAggregate {
  source: ProfilePostSource;
  sharedAt: Date | null;
  shareMessage: string | null;
  shareId: string | null;
}
