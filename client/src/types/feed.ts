export type ReactionType = 'like' | 'celebrate' | 'love' | 'insightful' | 'support';

export interface FeedAuthor {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  headline: string | null;
}

export interface FeedComment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  attachmentUrl: string | null;
  createdAt: string;
  author: FeedAuthor;
}

export interface FeedAttachment {
  id: string;
  postId: string;
  url: string;
  mimeType: string | null;
  createdAt: string;
}

export interface FeedPost {
  id: string;
  authorId: string;
  content: string;
  mediaUrl: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  attachments?: FeedAttachment[];
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

export type ProfilePostSource = 'own' | 'shared';

export interface ProfileFeedPost extends FeedPostAggregate {
  source: ProfilePostSource;
  sharedAt: string | null;
  shareMessage: string | null;
  shareId: string | null;
}

export interface PostMetrics {
  reactionCount: number;
  commentCount: number;
  shareCount: number;
  viewerReaction: ReactionType | null;
  isSaved: boolean;
}

export type ReportStatus = 'pending' | 'reviewed';

export interface FeedReport {
  id: string;
  postId: string;
  reporterId: string;
  reason: string;
  details: string | null;
  status: ReportStatus;
  createdAt: string;
  resolvedAt: string | null;
  reporter: FeedAuthor;
  post: FeedPost;
  postAuthor: FeedAuthor;
  commentId: string | null;
  commentContent: string | null;
  commentAttachmentUrl: string | null;
  commentAuthor: FeedAuthor | null;
}
