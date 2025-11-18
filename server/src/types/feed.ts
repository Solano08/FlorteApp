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
