import fs from 'fs';
import path from 'path';
import { feedRepository } from '../repositories/feedRepository';
import { AppError } from '../utils/appError';
import { UserRole } from '../types/user';
import {
  CreateCommentInput,
  CreatePostInput,
  FeedComment,
  FeedPostAggregate,
  FeedReport,
  PostMetrics,
  ProfileFeedPost,
  ReactionType,
  ReportPostInput,
  ReportStatus,
  SharePostInput
} from '../types/feed';

const assertPostAccess = async (postId: string, userId: string, role: UserRole): Promise<void> => {
  const authorId = await feedRepository.findPostAuthorId(postId);
  if (!authorId) {
    throw new AppError('Publicacion no encontrada', 404);
  }
  if (authorId !== userId && role !== 'admin') {
    throw new AppError('No tienes permisos para modificar esta publicacion', 403);
  }
};

const assertCommentAccess = async (
  postId: string,
  commentId: string,
  userId: string,
  role: UserRole
): Promise<void> => {
  const owner = await feedRepository.findCommentOwner(commentId);
  if (!owner) {
    throw new AppError('Comentario no encontrado', 404);
  }

  if (owner.postId !== postId) {
    throw new AppError('El comentario no pertenece a la publicacion indicada', 400);
  }

  if (owner.userId !== userId && role !== 'admin') {
    throw new AppError('No tienes permisos para modificar este comentario', 403);
  }
};

const validateReportTarget = async (input: ReportPostInput): Promise<void> => {
  if (!input.commentId) {
    return;
  }
  const owner = await feedRepository.findCommentOwner(input.commentId);
  if (!owner) {
    throw new AppError('Comentario no encontrado', 404);
  }
  if (owner.postId !== input.postId) {
    throw new AppError('El comentario reportado no pertenece a la publicacion', 400);
  }
};

const feedUploadsDir = path.resolve(__dirname, '..', '..', 'uploads', 'feed');

const ensureFeedUploadsDir = () => {
  if (!fs.existsSync(feedUploadsDir)) {
    fs.mkdirSync(feedUploadsDir, { recursive: true });
  }
};

const persistDataUrl = (dataUrl: string): string => {
  ensureFeedUploadsDir();
  const match = dataUrl.match(/^data:(.*?);base64,(.+)$/);
  if (!match) {
    throw new AppError('Formato de archivo invalido', 400);
  }
  const mimeType = match[1] || 'application/octet-stream';
  const base64Data = match[2];
  const buffer = Buffer.from(base64Data, 'base64');
  const extension = mimeType.split('/')[1] || 'bin';
  const filename = `${Date.now()}-${Math.round(Math.random() * 1e6)}.${extension}`;
  const filePath = path.join(feedUploadsDir, filename);
  fs.writeFileSync(filePath, buffer);
  return `/uploads/feed/${filename}`;
};

const processMediaUrl = (value?: string | null): string | null => {
  if (!value) return null;
  if (value.startsWith('data:')) {
    return persistDataUrl(value);
  }
  return value;
};

const processAttachments = (
  attachments?: Array<{ url: string; mimeType?: string | null }>
): Array<{ url: string; mimeType?: string | null }> => {
  if (!attachments?.length) return [];
  return attachments.map((attachment) => {
    const processedUrl = processMediaUrl(attachment.url);
    return {
      url: processedUrl ?? attachment.url,
      mimeType: attachment.mimeType ?? null
    };
  });
};

export const feedService = {
  async createPost(input: CreatePostInput, viewerId: string): Promise<FeedPostAggregate> {
    const processedMediaUrl = processMediaUrl(input.mediaUrl);
    const processedAttachments = processAttachments(input.attachments);
    const post = await feedRepository.createPost({
      ...input,
      mediaUrl: processedMediaUrl,
      attachments: processedAttachments
    });
    const aggregate = await feedRepository.findPostWithMeta(post.id, viewerId);
    if (!aggregate) {
      throw new Error('No fue posible cargar la publicacion recien creada');
    }
    return aggregate;
  },

  async listPosts(viewerId: string, limit = 15, offset = 0): Promise<FeedPostAggregate[]> {
    return await feedRepository.listPosts(viewerId, limit, offset);
  },

  async updatePost(
    postId: string,
    updates: { content?: string; mediaUrl?: string | null; tags?: string[] },
    viewerId: string,
    viewerRole: UserRole
  ): Promise<FeedPostAggregate> {
    await assertPostAccess(postId, viewerId, viewerRole);
    await feedRepository.updatePost(postId, updates);
    const post = await feedRepository.findPostWithMeta(postId, viewerId);
    if (!post) {
      throw new Error('No fue posible cargar la publicacion actualizada');
    }
    return post;
  },

  async deletePost(postId: string, viewerId: string, viewerRole: UserRole): Promise<void> {
    await assertPostAccess(postId, viewerId, viewerRole);
    await feedRepository.deletePost(postId);
  },

  async listSavedPosts(userId: string, limit = 10): Promise<FeedPostAggregate[]> {
    return await feedRepository.listSavedPosts(userId, limit);
  },

  async addComment(input: CreateCommentInput, viewerId: string): Promise<{
    comment: FeedComment;
    reactionCount: number;
    commentCount: number;
    shareCount: number;
    viewerReaction: ReactionType | null;
    isSaved: boolean;
  }> {
    const processedAttachmentUrl = processMediaUrl(input.attachmentUrl);
    const comment = await feedRepository.addComment({ ...input, attachmentUrl: processedAttachmentUrl });
    const metrics = await feedRepository.getPostMetrics(input.postId, viewerId);
    return {
      comment,
      ...metrics
    };
  },

  async listComments(postId: string): Promise<FeedComment[]> {
    return await feedRepository.listComments(postId);
  },

  async updateComment(
    postId: string,
    commentId: string,
    content: string,
    viewerId: string,
    viewerRole: UserRole
  ): Promise<FeedComment> {
    await assertCommentAccess(postId, commentId, viewerId, viewerRole);
    await feedRepository.updateComment(commentId, content);
    const comment = await feedRepository.findCommentById(commentId);
    if (!comment) {
      throw new Error('No fue posible cargar el comentario actualizado');
    }
    return comment;
  },

  async deleteComment(
    postId: string,
    commentId: string,
    viewerId: string,
    viewerRole: UserRole
  ): Promise<PostMetrics> {
    await assertCommentAccess(postId, commentId, viewerId, viewerRole);
    await feedRepository.deleteComment(commentId);
    return await feedRepository.getPostMetrics(postId, viewerId);
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

  async listProfilePosts(ownerId: string, viewerId: string, limit = 6): Promise<ProfileFeedPost[]> {
    return await feedRepository.listPostsForUser(ownerId, viewerId, limit);
  },

  async getPost(postId: string, viewerId: string): Promise<FeedPostAggregate | null> {
    return await feedRepository.findPostWithMeta(postId, viewerId);
  },

  async reportPost(input: ReportPostInput): Promise<FeedReport> {
    await validateReportTarget(input);
    return await feedRepository.reportPost(input);
  },

  async listReports(): Promise<FeedReport[]> {
    return await feedRepository.listReports();
  },

  async updateReportStatus(reportId: string, status: ReportStatus): Promise<FeedReport> {
    return await feedRepository.updateReportStatus(reportId, status);
  }
};
