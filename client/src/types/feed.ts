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

export interface FeedComment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  createdAt: string;
  author: FeedAuthor;
}

export interface FeedPost {
  id: string;
  authorId: string;
  content: string;
  mediaUrl: string | null;
  tags: string[];
  attachments: FeedAttachment[];
  createdAt: string;
  updatedAt: string;
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

export interface FeedReportPostSummary {
  id: string;
  content: string;
  mediaUrl: string | null;
  createdAt: string;
  author: FeedAuthor;
}

export interface FeedReport {
  id: string;
  postId: string;
  reporterId: string;
  reason: string | null;
  status: ReportStatus;
  createdAt: string;
  reviewedAt: string | null;
  reporter: FeedAuthor;
  post: FeedReportPostSummary;
}
