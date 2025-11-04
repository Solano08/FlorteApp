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
  createdAt: string;
  author: FeedAuthor;
}

export interface FeedPost {
  id: string;
  authorId: string;
  content: string;
  mediaUrl: string | null;
  tags: string[];
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
