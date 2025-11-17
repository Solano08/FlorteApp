export type ReactionType = 'like' | 'love' | 'wow';
export type ReportStatus = 'pending' | 'reviewed';

export interface FeedAttachment {
  id: string;
  postId: string;
  url: string;
  fileName: string | null;
  fileType: string | null;
}

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
  attachments: FeedAttachment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface FeedComment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  createdAt: Date;
  author: FeedAuthor;
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

export interface CreatePostInput {
  authorId: string;
  content: string;
  mediaUrl?: string | null;
  tags?: string[];
  attachments?: PostAttachmentInput[];
}

export interface CreateCommentInput {
  postId: string;
  userId: string;
  content: string;
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

export interface PostAttachmentInput {
  url: string;
  fileName?: string | null;
  fileType?: string | null;
}

export interface FeedReportPostSummary {
  id: string;
  content: string;
  mediaUrl: string | null;
  createdAt: Date;
  author: FeedAuthor;
}

export interface FeedReport {
  id: string;
  postId: string;
  reporterId: string;
  reason: string | null;
  status: ReportStatus;
  createdAt: Date;
  reviewedAt: Date | null;
  reporter: FeedAuthor;
  post: FeedReportPostSummary;
}
