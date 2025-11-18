import crypto from 'crypto';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { getConnection, getPool } from '../config/database';
import {
  CreateCommentInput,
  CreatePostInput,
  FeedAuthor,
  FeedAttachment,
  FeedComment,
  FeedPost,
  FeedPostAggregate,
  FeedReport,
  ProfileFeedPost,
  ReactionType,
  ReportPostInput,
  ReportStatus,
  SharePostInput
} from '../types/feed';

type MysqlError = NodeJS.ErrnoException & { code?: string };

const parseTags = (raw: unknown): string[] => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map((value) => String(value));
  try {
    const parsed = JSON.parse(String(raw));
    if (Array.isArray(parsed)) {
      return parsed.map((value) => String(value));
    }
    return [];
  } catch {
    return [];
  }
};

const mapAuthor = (row: RowDataPacket): FeedAuthor => ({
  id: row.author_id,
  fullName: `${row.first_name} ${row.last_name}`.trim(),
  avatarUrl: row.avatar_url ?? null,
  headline: row.headline ?? null
});

const mapPost = (row: RowDataPacket): FeedPost => ({
  id: row.id,
  authorId: row.author_id,
  content: row.content,
  mediaUrl: row.media_url ?? null,
  tags: parseTags(row.tags),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  attachments: []
});

const mapComment = (row: RowDataPacket): FeedComment => ({
  id: row.id,
  postId: row.post_id,
  userId: row.user_id,
  content: row.content,
  attachmentUrl: row.attachment_url ?? null,
  createdAt: row.created_at,
  author: {
    id: row.user_id,
    fullName: `${row.first_name} ${row.last_name}`.trim(),
    avatarUrl: row.avatar_url ?? null,
    headline: row.headline ?? null
  }
});

const mapAttachment = (row: RowDataPacket): FeedAttachment => ({
  id: row.id,
  postId: row.post_id,
  url: row.url,
  mimeType: row.mime_type ?? null,
  createdAt: row.created_at
});

const getPostAttachments = async (postIds: string[]): Promise<Map<string, FeedAttachment[]>> => {
  const results = new Map<string, FeedAttachment[]>();
  if (postIds.length === 0) return results;
  const placeholders = postIds.map(() => '?').join(',');
  try {
    const [rows] = await getPool().query<RowDataPacket[]>(
      `SELECT id, post_id, url, mime_type, created_at FROM feed_post_attachments WHERE post_id IN (${placeholders}) ORDER BY created_at ASC`,
      postIds
    );

    for (const row of rows) {
      const attachment = mapAttachment(row);
      const list = results.get(attachment.postId) ?? [];
      list.push(attachment);
      results.set(attachment.postId, list);
    }
  } catch (error) {
    const mysqlError = error as MysqlError;
    if (mysqlError?.code === 'ER_NO_SUCH_TABLE') {
      return results;
    }
    throw error;
  }
  return results;
};
const insertPostAttachments = async (postId: string, attachments: Array<{ url: string; mimeType?: string | null }>) => {
  if (!attachments?.length) return;
  for (const attachment of attachments) {
    await getPool().execute<ResultSetHeader>(
      `INSERT INTO feed_post_attachments (id, post_id, url, mime_type)
       VALUES (:id, :postId, :url, :mimeType)`,
      {
        id: crypto.randomUUID(),
        postId,
        url: attachment.url,
        mimeType: attachment.mimeType ?? null
      }
    );
  }
};

const mapReport = (row: RowDataPacket): FeedReport => ({
  id: row.report_id,
  postId: row.report_post_id,
  reporterId: row.reporter_id,
  reason: row.reason,
  details: row.details ?? null,
  status: row.status,
  createdAt: row.report_created_at,
  resolvedAt: row.resolved_at ?? null,
  reporter: {
    id: row.reporter_id,
    fullName: `${row.reporter_first_name} ${row.reporter_last_name}`.trim(),
    avatarUrl: row.reporter_avatar_url ?? null,
    headline: row.reporter_headline ?? null
  },
  post: mapPost(row),
  postAuthor: {
    id: row.author_id,
    fullName: `${row.first_name} ${row.last_name}`.trim(),
    avatarUrl: row.avatar_url ?? null,
    headline: row.headline ?? null
  },
  commentId: row.comment_id ?? null,
  commentContent: row.comment_content ?? null,
  commentAttachmentUrl: row.comment_attachment_url ?? null,
  commentAuthor:
    row.comment_author_id == null
      ? null
      : {
          id: row.comment_author_id,
          fullName: `${row.comment_author_first_name} ${row.comment_author_last_name}`.trim(),
          avatarUrl: row.comment_author_avatar_url ?? null,
          headline: row.comment_author_headline ?? null
        }
});

const fetchPostMetrics = async (postId: string, userId: string) => {
  const [rows] = await getPool().query<RowDataPacket[]>(
    `SELECT
        (SELECT COUNT(*) FROM feed_post_reactions WHERE post_id = :postId) AS reaction_count,
        (SELECT COUNT(*) FROM feed_comments WHERE post_id = :postId) AS comment_count,
        (SELECT COUNT(*) FROM feed_shares WHERE post_id = :postId) AS share_count,
        (SELECT reaction_type FROM feed_post_reactions WHERE post_id = :postId AND user_id = :userId LIMIT 1) AS viewer_reaction,
        EXISTS(SELECT 1 FROM feed_saved_posts WHERE post_id = :postId AND user_id = :userId) AS is_saved
     LIMIT 1`,
    { postId, userId }
  );

  const metrics = rows[0];
  return {
    reactionCount: Number(metrics?.reaction_count ?? 0),
    commentCount: Number(metrics?.comment_count ?? 0),
    shareCount: Number(metrics?.share_count ?? 0),
    viewerReaction: (metrics?.viewer_reaction as ReactionType | null) ?? null,
    isSaved: Boolean(metrics?.is_saved ?? 0)
  };
};

export const feedRepository = {
  async createPost(input: CreatePostInput): Promise<FeedPost> {
    const id = crypto.randomUUID();
    const [result] = await getPool().execute<ResultSetHeader>(
      `INSERT INTO feed_posts (id, author_id, content, media_url, tags)
       VALUES (:id, :authorId, :content, :mediaUrl, :tags)`,
      {
        id,
        authorId: input.authorId,
        content: input.content,
        mediaUrl: input.mediaUrl ?? null,
        tags: JSON.stringify(input.tags ?? [])
      }
    );

    if (result.affectedRows !== 1) {
      throw new Error('No fue posible crear la publicacion');
    }

    await insertPostAttachments(id, input.attachments ?? []);
    const post = await this.findPostById(id);
    if (!post) {
      throw new Error('No se encontro la publicacion despues de crearla');
    }
    return post;
  },

  async findPostById(id: string): Promise<FeedPost | null> {
    const [rows] = await getPool().query<RowDataPacket[]>(
      'SELECT * FROM feed_posts WHERE id = :id LIMIT 1',
      { id }
    );
    if (rows.length === 0) return null;
    return mapPost(rows[0]);
  },

  async findPostWithMeta(id: string, viewerId: string): Promise<FeedPostAggregate | null> {
    const [rows] = await getPool().query<RowDataPacket[]>(
      `SELECT
         p.*,
         u.first_name,
         u.last_name,
         u.avatar_url,
         u.headline,
         (SELECT COUNT(*) FROM feed_post_reactions r WHERE r.post_id = p.id) AS reaction_count,
         (SELECT COUNT(*) FROM feed_comments c WHERE c.post_id = p.id) AS comment_count,
         (SELECT COUNT(*) FROM feed_shares s WHERE s.post_id = p.id) AS share_count,
         (SELECT reaction_type FROM feed_post_reactions r WHERE r.post_id = p.id AND r.user_id = :viewerId LIMIT 1) AS viewer_reaction,
         EXISTS(SELECT 1 FROM feed_saved_posts sp WHERE sp.post_id = p.id AND sp.user_id = :viewerId) AS is_saved
       FROM feed_posts p
       INNER JOIN users u ON u.id = p.author_id
       WHERE p.id = :id
       LIMIT 1`,
      { id, viewerId }
    );

    if (rows.length === 0) {
      return null;
    }

    const row = rows[0];
    const post = mapPost(row);
    const latestComments = await this.getLatestComments([post.id], 3);
    const attachmentsMap = await getPostAttachments([post.id]);

    return {
      ...post,
      author: mapAuthor(row),
      attachments: attachmentsMap.get(post.id) ?? [],
      reactionCount: Number(row.reaction_count ?? 0),
      commentCount: Number(row.comment_count ?? 0),
      shareCount: Number(row.share_count ?? 0),
      viewerReaction: (row.viewer_reaction as ReactionType | null) ?? null,
      isSaved: Boolean(row.is_saved ?? 0),
      latestComments: latestComments.get(post.id) ?? []
    };
  },

  async findPostAuthorId(postId: string): Promise<string | null> {
    const [rows] = await getPool().query<RowDataPacket[]>(
      'SELECT author_id FROM feed_posts WHERE id = :postId LIMIT 1',
      { postId }
    );
    if (rows.length === 0) return null;
    return rows[0].author_id;
  },

  async updatePost(
    postId: string,
    updates: { content?: string; mediaUrl?: string | null; tags?: string[] }
  ): Promise<void> {
    const assignments: string[] = [];
    const params: Record<string, unknown> = { postId };

    if (updates.content !== undefined) {
      assignments.push('content = :content');
      params.content = updates.content;
    }
    if (updates.mediaUrl !== undefined) {
      assignments.push('media_url = :mediaUrl');
      params.mediaUrl = updates.mediaUrl;
    }
    if (updates.tags !== undefined) {
      assignments.push('tags = :tags');
      params.tags = JSON.stringify(updates.tags ?? []);
    }

    if (assignments.length === 0) {
      return;
    }

    const [result] = await getPool().execute<ResultSetHeader>(
      `UPDATE feed_posts SET ${assignments.join(', ')} WHERE id = :postId`,
      params
    );

    if (result.affectedRows !== 1) {
      throw new Error('No se encontro la publicacion para actualizar');
    }
  },

  async deletePost(postId: string): Promise<void> {
    const [result] = await getPool().execute<ResultSetHeader>(
      'DELETE FROM feed_posts WHERE id = :postId',
      { postId }
    );

    if (result.affectedRows !== 1) {
      throw new Error('No se encontro la publicacion para eliminar');
    }
  },

  async listPosts(viewerId: string, limit = 15, offset = 0): Promise<FeedPostAggregate[]> {
    const [rows] = await getPool().query<RowDataPacket[]>(
      `SELECT
         p.*,
         u.first_name,
         u.last_name,
         u.avatar_url,
         u.headline,
         (SELECT COUNT(*) FROM feed_post_reactions r WHERE r.post_id = p.id) AS reaction_count,
         (SELECT COUNT(*) FROM feed_comments c WHERE c.post_id = p.id) AS comment_count,
         (SELECT COUNT(*) FROM feed_shares s WHERE s.post_id = p.id) AS share_count,
         (SELECT reaction_type FROM feed_post_reactions r WHERE r.post_id = p.id AND r.user_id = :viewerId LIMIT 1) AS viewer_reaction,
         EXISTS(SELECT 1 FROM feed_saved_posts sp WHERE sp.post_id = p.id AND sp.user_id = :viewerId) AS is_saved
       FROM feed_posts p
       INNER JOIN users u ON u.id = p.author_id
       ORDER BY p.created_at DESC
       LIMIT ${limit} OFFSET ${offset}`,
      { viewerId }
    );

    if (rows.length === 0) return [];

    const posts = rows.map((row) => ({
      base: mapPost(row),
      aggregate: {
        reactionCount: Number(row.reaction_count ?? 0),
        commentCount: Number(row.comment_count ?? 0),
        shareCount: Number(row.share_count ?? 0),
        viewerReaction: (row.viewer_reaction as ReactionType | null) ?? null,
        isSaved: Boolean(row.is_saved ?? 0),
        author: mapAuthor(row)
      }
    }));

    const postIds = posts.map(({ base }) => base.id);
    const latestComments = await this.getLatestComments(postIds, 3);
    const attachmentsMap = await getPostAttachments(postIds);

    return posts.map(({ base, aggregate }) => ({
      ...base,
      attachments: attachmentsMap.get(base.id) ?? [],
      author: aggregate.author,
      reactionCount: aggregate.reactionCount,
      commentCount: aggregate.commentCount,
      shareCount: aggregate.shareCount,
      viewerReaction: aggregate.viewerReaction,
      isSaved: aggregate.isSaved,
      latestComments: latestComments.get(base.id) ?? []
    }));
  },

  async listPostsForUser(userId: string, viewerId: string, limit = 6): Promise<ProfileFeedPost[]> {
    const [rows] = await getPool().query<RowDataPacket[]>(
      `WITH shared_posts AS (
         SELECT s.id AS share_id, s.post_id, s.message, s.created_at AS shared_at
         FROM feed_shares s
         INNER JOIN (
           SELECT post_id, MAX(created_at) AS latest_shared_at
           FROM feed_shares
           WHERE user_id = :userId
           GROUP BY post_id
         ) latest ON latest.post_id = s.post_id AND latest.latest_shared_at = s.created_at
         WHERE s.user_id = :userId
       )
       SELECT
         p.*,
         u.first_name,
         u.last_name,
         u.avatar_url,
         u.headline,
         shared_posts.share_id,
         shared_posts.shared_at,
         shared_posts.message,
         (SELECT COUNT(*) FROM feed_post_reactions r WHERE r.post_id = p.id) AS reaction_count,
         (SELECT COUNT(*) FROM feed_comments c WHERE c.post_id = p.id) AS comment_count,
         (SELECT COUNT(*) FROM feed_shares s WHERE s.post_id = p.id) AS share_count,
         (SELECT reaction_type FROM feed_post_reactions r WHERE r.post_id = p.id AND r.user_id = :viewerId LIMIT 1) AS viewer_reaction,
         EXISTS(SELECT 1 FROM feed_saved_posts sp WHERE sp.post_id = p.id AND sp.user_id = :viewerId) AS is_saved
       FROM feed_posts p
       INNER JOIN users u ON u.id = p.author_id
       LEFT JOIN shared_posts ON shared_posts.post_id = p.id
       WHERE p.author_id = :userId OR shared_posts.share_id IS NOT NULL
       ORDER BY GREATEST(p.created_at, COALESCE(shared_posts.shared_at, p.created_at)) DESC
       LIMIT :limit`,
      { userId, viewerId, limit }
    );

    if (rows.length === 0) return [];

    const posts = rows.map((row) => ({
      base: mapPost(row),
      aggregate: {
        reactionCount: Number(row.reaction_count ?? 0),
        commentCount: Number(row.comment_count ?? 0),
        shareCount: Number(row.share_count ?? 0),
        viewerReaction: (row.viewer_reaction as ReactionType | null) ?? null,
        isSaved: Boolean(row.is_saved ?? 0),
        author: mapAuthor(row)
      },
      source: row.share_id ? 'shared' : 'own',
      sharedAt: row.shared_at ?? null,
      shareMessage: row.message ?? null,
      shareId: row.share_id ?? null
    }));

    const postIds = posts.map(({ base }) => base.id);
    const latestComments = await this.getLatestComments(postIds, 3);
    const attachmentsMap = await getPostAttachments(postIds);

    return posts.map(({ base, aggregate, source, sharedAt, shareMessage, shareId }) => ({
      ...base,
      attachments: attachmentsMap.get(base.id) ?? [],
      author: aggregate.author,
      reactionCount: aggregate.reactionCount,
      commentCount: aggregate.commentCount,
      shareCount: aggregate.shareCount,
      viewerReaction: aggregate.viewerReaction,
      isSaved: aggregate.isSaved,
      latestComments: latestComments.get(base.id) ?? [],
      source,
      sharedAt,
      shareMessage,
      shareId
    }));
  },

  async listSavedPosts(userId: string, limit = 10): Promise<FeedPostAggregate[]> {
    const [rows] = await getPool().query<RowDataPacket[]>(
      `SELECT
         p.*,
         u.first_name,
         u.last_name,
         u.avatar_url,
         u.headline,
         (SELECT COUNT(*) FROM feed_post_reactions r WHERE r.post_id = p.id) AS reaction_count,
         (SELECT COUNT(*) FROM feed_comments c WHERE c.post_id = p.id) AS comment_count,
         (SELECT COUNT(*) FROM feed_shares s WHERE s.post_id = p.id) AS share_count,
         (SELECT reaction_type FROM feed_post_reactions r WHERE r.post_id = p.id AND r.user_id = :userId LIMIT 1) AS viewer_reaction,
         EXISTS(SELECT 1 FROM feed_saved_posts sp WHERE sp.post_id = p.id AND sp.user_id = :userId) AS is_saved
       FROM feed_posts p
       INNER JOIN users u ON u.id = p.author_id
       INNER JOIN feed_saved_posts sp ON sp.post_id = p.id
       WHERE sp.user_id = :userId
       ORDER BY sp.created_at DESC
       LIMIT :limit`,
      { userId, limit }
    );

    if (rows.length === 0) return [];

    const posts = rows.map((row) => ({
      base: mapPost(row),
      aggregate: {
        reactionCount: Number(row.reaction_count ?? 0),
        commentCount: Number(row.comment_count ?? 0),
        shareCount: Number(row.share_count ?? 0),
        viewerReaction: (row.viewer_reaction as ReactionType | null) ?? null,
        isSaved: Boolean(row.is_saved ?? 0),
        author: mapAuthor(row)
      }
    }));

    const postIds = posts.map(({ base }) => base.id);
    const latestComments = await this.getLatestComments(postIds, 3);
    const attachmentsMap = await getPostAttachments(postIds);

    return posts.map(({ base, aggregate }) => ({
      ...base,
      attachments: attachmentsMap.get(base.id) ?? [],
      author: aggregate.author,
      reactionCount: aggregate.reactionCount,
      commentCount: aggregate.commentCount,
      shareCount: aggregate.shareCount,
      viewerReaction: aggregate.viewerReaction,
      isSaved: aggregate.isSaved,
      latestComments: latestComments.get(base.id) ?? []
    }));
  },

  async getLatestComments(postIds: string[], limitPerPost: number): Promise<Map<string, FeedComment[]>> {
    const results = new Map<string, FeedComment[]>();
    if (postIds.length === 0 || limitPerPost <= 0) return results;

    const placeholders = postIds.map(() => '?').join(',');
    const [rows] = await getPool().query<RowDataPacket[]>(
      `SELECT c.*, u.first_name, u.last_name, u.avatar_url, u.headline
       FROM feed_comments c
       INNER JOIN users u ON u.id = c.user_id
       WHERE c.post_id IN (${placeholders})
       ORDER BY c.created_at DESC`,
      postIds
    );

    for (const row of rows) {
      const comment = mapComment(row);
      const list = results.get(comment.postId) ?? [];
      if (list.length < limitPerPost) {
        list.push(comment);
        results.set(comment.postId, list);
      }
    }

    for (const [key, list] of results.entries()) {
      list.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      results.set(key, list);
    }

    return results;
  },

  async addComment(input: CreateCommentInput): Promise<FeedComment> {
    const id = crypto.randomUUID();
    const [result] = await getPool().execute<ResultSetHeader>(
      `INSERT INTO feed_comments (id, post_id, user_id, content, attachment_url)
       VALUES (:id, :postId, :userId, :content, :attachmentUrl)`,
      {
        id,
        postId: input.postId,
        userId: input.userId,
        content: input.content,
        attachmentUrl: input.attachmentUrl ?? null
      }
    );

    if (result.affectedRows !== 1) {
      throw new Error('No fue posible registrar el comentario');
    }

    const [rows] = await getPool().query<RowDataPacket[]>(
      `SELECT c.*, u.first_name, u.last_name, u.avatar_url, u.headline
       FROM feed_comments c
       INNER JOIN users u ON u.id = c.user_id
       WHERE c.id = :id
       LIMIT 1`,
      { id }
    );
    if (rows.length === 0) {
      throw new Error('Comentario no encontrado despues de crearlo');
    }
    return mapComment(rows[0]);
  },

  async toggleReaction(postId: string, userId: string, reactionType: ReactionType) {
    const connection = await getConnection();
    try {
      const [rows] = await connection.query<RowDataPacket[]>(
        `SELECT reaction_type
         FROM feed_post_reactions
         WHERE post_id = :postId AND user_id = :userId
         LIMIT 1`,
        { postId, userId }
      );

      if (rows.length === 0) {
        await connection.execute<ResultSetHeader>(
          `INSERT INTO feed_post_reactions (post_id, user_id, reaction_type)
           VALUES (:postId, :userId, :reactionType)`,
          { postId, userId, reactionType }
        );
      } else if (rows[0].reaction_type === reactionType) {
        await connection.execute<ResultSetHeader>(
          `DELETE FROM feed_post_reactions
           WHERE post_id = :postId AND user_id = :userId`,
          { postId, userId }
        );
      } else {
        await connection.execute<ResultSetHeader>(
          `UPDATE feed_post_reactions
           SET reaction_type = :reactionType
           WHERE post_id = :postId AND user_id = :userId`,
          { postId, userId, reactionType }
        );
      }
    } finally {
      connection.release();
    }

    return await fetchPostMetrics(postId, userId);
  },

  async toggleSave(postId: string, userId: string) {
    const connection = await getConnection();
    try {
      const [rows] = await connection.query<RowDataPacket[]>(
        `SELECT 1
         FROM feed_saved_posts
         WHERE post_id = :postId AND user_id = :userId
         LIMIT 1`,
        { postId, userId }
      );

      if (rows.length === 0) {
        await connection.execute<ResultSetHeader>(
          `INSERT INTO feed_saved_posts (post_id, user_id)
           VALUES (:postId, :userId)`,
          { postId, userId }
        );
      } else {
        await connection.execute<ResultSetHeader>(
          `DELETE FROM feed_saved_posts
           WHERE post_id = :postId AND user_id = :userId`,
          { postId, userId }
        );
      }
    } finally {
      connection.release();
    }

    return await fetchPostMetrics(postId, userId);
  },

  async sharePost(input: SharePostInput) {
    const id = crypto.randomUUID();
    const [result] = await getPool().execute<ResultSetHeader>(
      `INSERT INTO feed_shares (id, post_id, user_id, message)
       VALUES (:id, :postId, :userId, :message)`,
      {
        id,
        postId: input.postId,
        userId: input.userId,
        message: input.message ?? null
      }
    );

    if (result.affectedRows !== 1) {
      throw new Error('No fue posible compartir la publicacion');
    }

    const metrics = await fetchPostMetrics(input.postId, input.userId);
    return { shareId: id, ...metrics };
  },

  async getPostMetrics(postId: string, userId: string) {
    return await fetchPostMetrics(postId, userId);
  },

  async listComments(postId: string): Promise<FeedComment[]> {
    const [rows] = await getPool().query<RowDataPacket[]>(
      `SELECT c.*, u.first_name, u.last_name, u.avatar_url, u.headline
       FROM feed_comments c
       INNER JOIN users u ON u.id = c.user_id
       WHERE c.post_id = :postId
       ORDER BY c.created_at ASC`,
      { postId }
    );
    return rows.map(mapComment);
  },

  async findCommentById(commentId: string): Promise<FeedComment | null> {
    const [rows] = await getPool().query<RowDataPacket[]>(
      `SELECT c.*, u.first_name, u.last_name, u.avatar_url, u.headline
       FROM feed_comments c
       INNER JOIN users u ON u.id = c.user_id
       WHERE c.id = :commentId
       LIMIT 1`,
      { commentId }
    );
    if (rows.length === 0) return null;
    return mapComment(rows[0]);
  },

  async findCommentOwner(commentId: string): Promise<{ userId: string; postId: string } | null> {
    const [rows] = await getPool().query<RowDataPacket[]>(
      'SELECT user_id, post_id FROM feed_comments WHERE id = :commentId LIMIT 1',
      { commentId }
    );
    if (rows.length === 0) return null;
    return { userId: rows[0].user_id, postId: rows[0].post_id };
  },

  async updateComment(commentId: string, content: string): Promise<void> {
    const [result] = await getPool().execute<ResultSetHeader>(
      'UPDATE feed_comments SET content = :content WHERE id = :commentId',
      { commentId, content }
    );
    if (result.affectedRows !== 1) {
      throw new Error('No se encontro el comentario para actualizar');
    }
  },

  async deleteComment(commentId: string): Promise<void> {
    const [result] = await getPool().execute<ResultSetHeader>(
      'DELETE FROM feed_comments WHERE id = :commentId',
      { commentId }
    );
    if (result.affectedRows !== 1) {
      throw new Error('No se encontro el comentario para eliminar');
    }
  },

  async reportPost(input: ReportPostInput): Promise<FeedReport> {
    const id = crypto.randomUUID();
    const [result] = await getPool().execute<ResultSetHeader>(
      `INSERT INTO feed_reports (id, post_id, reporter_id, reason, details, comment_id)
       VALUES (:id, :postId, :reporterId, :reason, :details, :commentId)`,
      {
        id,
        postId: input.postId,
        reporterId: input.reporterId,
        reason: input.reason,
        details: input.details ?? null,
        commentId: input.commentId ?? null
      }
    );

    if (result.affectedRows !== 1) {
      throw new Error('No fue posible registrar el reporte');
    }

    const report = await this.findReportById(id);
    if (!report) {
      throw new Error('No fue posible cargar el reporte recien creado');
    }
    return report;
  },

  async listReports(): Promise<FeedReport[]> {
    const [rows] = await getPool().query<RowDataPacket[]>(
      `SELECT
         r.id AS report_id,
         r.post_id AS report_post_id,
         r.reporter_id,
         r.comment_id,
         r.reason,
         r.details,
         r.status,
         r.created_at AS report_created_at,
         r.resolved_at,
         p.*,
         u.first_name,
         u.last_name,
         u.avatar_url,
         u.headline,
         reporter.first_name AS reporter_first_name,
         reporter.last_name AS reporter_last_name,
         reporter.avatar_url AS reporter_avatar_url,
         reporter.headline AS reporter_headline,
         c.content AS comment_content,
         c.attachment_url AS comment_attachment_url,
         comment_author.id AS comment_author_id,
         comment_author.first_name AS comment_author_first_name,
         comment_author.last_name AS comment_author_last_name,
         comment_author.avatar_url AS comment_author_avatar_url,
         comment_author.headline AS comment_author_headline
       FROM feed_reports r
       INNER JOIN feed_posts p ON p.id = r.post_id
       INNER JOIN users u ON u.id = p.author_id
       INNER JOIN users reporter ON reporter.id = r.reporter_id
       LEFT JOIN feed_comments c ON c.id = r.comment_id
       LEFT JOIN users comment_author ON comment_author.id = c.user_id
       ORDER BY r.created_at DESC`
    );
    return rows.map(mapReport);
  },

  async updateReportStatus(reportId: string, status: ReportStatus): Promise<FeedReport> {
    const [result] = await getPool().execute<ResultSetHeader>(
      `UPDATE feed_reports
       SET status = :status,
           resolved_at = CASE WHEN :status = 'reviewed' THEN NOW() ELSE resolved_at END
       WHERE id = :reportId`,
      { reportId, status }
    );

    if (result.affectedRows !== 1) {
      throw new Error('No se encontro el reporte para actualizar');
    }

    const report = await this.findReportById(reportId);
    if (!report) {
      throw new Error('No fue posible cargar el reporte actualizado');
    }
    return report;
  },

  async findReportById(id: string): Promise<FeedReport | null> {
    const [rows] = await getPool().query<RowDataPacket[]>(
      `SELECT
         r.id AS report_id,
         r.post_id AS report_post_id,
         r.reporter_id,
         r.comment_id,
         r.reason,
         r.details,
         r.status,
         r.created_at AS report_created_at,
         r.resolved_at,
         p.*,
         u.first_name,
         u.last_name,
         u.avatar_url,
         u.headline,
         reporter.first_name AS reporter_first_name,
         reporter.last_name AS reporter_last_name,
         reporter.avatar_url AS reporter_avatar_url,
         reporter.headline AS reporter_headline,
         c.content AS comment_content,
         c.attachment_url AS comment_attachment_url,
         comment_author.id AS comment_author_id,
         comment_author.first_name AS comment_author_first_name,
         comment_author.last_name AS comment_author_last_name,
         comment_author.avatar_url AS comment_author_avatar_url,
         comment_author.headline AS comment_author_headline
       FROM feed_reports r
       INNER JOIN feed_posts p ON p.id = r.post_id
       INNER JOIN users u ON u.id = p.author_id
       INNER JOIN users reporter ON reporter.id = r.reporter_id
       LEFT JOIN feed_comments c ON c.id = r.comment_id
       LEFT JOIN users comment_author ON comment_author.id = c.user_id
       WHERE r.id = :id
       LIMIT 1`,
      { id }
    );

    if (rows.length === 0) return null;
    return mapReport(rows[0]);
  }
};
