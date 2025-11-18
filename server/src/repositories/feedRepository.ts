import crypto from 'crypto';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { getConnection, getPool } from '../config/database';
import {
  CreateCommentInput,
  CreatePostInput,
  FeedAuthor,
  FeedComment,
  FeedPost,
  FeedPostAggregate,
  ReactionType,
  SharePostInput
} from '../types/feed';

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
  updatedAt: row.updated_at
});

const mapComment = (row: RowDataPacket): FeedComment => ({
  id: row.id,
  postId: row.post_id,
  userId: row.user_id,
  content: row.content,
  createdAt: row.created_at,
  author: {
    id: row.user_id,
    fullName: `${row.first_name} ${row.last_name}`.trim(),
    avatarUrl: row.avatar_url ?? null,
    headline: row.headline ?? null
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

    return {
      ...post,
      author: mapAuthor(row),
      reactionCount: Number(row.reaction_count ?? 0),
      commentCount: Number(row.comment_count ?? 0),
      shareCount: Number(row.share_count ?? 0),
      viewerReaction: (row.viewer_reaction as ReactionType | null) ?? null,
      isSaved: Boolean(row.is_saved ?? 0),
      latestComments: latestComments.get(post.id) ?? []
    };
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

    return posts.map(({ base, aggregate }) => ({
      ...base,
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
      `INSERT INTO feed_comments (id, post_id, user_id, content)
       VALUES (:id, :postId, :userId, :content)`,
      {
        id,
        postId: input.postId,
        userId: input.userId,
        content: input.content
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
  }
};
