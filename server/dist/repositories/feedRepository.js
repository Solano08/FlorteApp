"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.feedRepository = void 0;
const crypto_1 = __importDefault(require("crypto"));
const database_1 = require("../config/database");
const parseTags = (raw) => {
    if (!raw)
        return [];
    if (Array.isArray(raw))
        return raw.map((value) => String(value));
    try {
        const parsed = JSON.parse(String(raw));
        if (Array.isArray(parsed)) {
            return parsed.map((value) => String(value));
        }
        return [];
    }
    catch {
        return [];
    }
};
const mapAuthor = (row) => ({
    id: row.author_id,
    fullName: `${row.first_name} ${row.last_name}`.trim(),
    avatarUrl: row.avatar_url ?? null,
    headline: row.headline ?? null
});
const mapPost = (row, attachments = []) => ({
    id: row.id,
    authorId: row.author_id,
    content: row.content,
    mediaUrl: row.media_url ?? null,
    tags: parseTags(row.tags),
    attachments,
    createdAt: row.created_at,
    updatedAt: row.updated_at
});
const mapReporter = (row) => ({
    id: row.reporter_id,
    fullName: `${row.reporter_first_name ?? ''} ${row.reporter_last_name ?? ''}`.trim(),
    avatarUrl: row.reporter_avatar_url ?? null,
    headline: row.reporter_headline ?? null
});
const mapReportPost = (row) => ({
    id: row.post_id,
    content: row.post_content,
    mediaUrl: row.post_media_url ?? null,
    createdAt: row.post_created_at,
    author: {
        id: row.post_author_id,
        fullName: `${row.post_author_first_name ?? ''} ${row.post_author_last_name ?? ''}`.trim(),
        avatarUrl: row.post_author_avatar_url ?? null,
        headline: row.post_author_headline ?? null
    }
});
const mapAttachment = (row) => ({
    id: row.id,
    postId: row.post_id,
    url: row.url,
    fileName: row.file_name ?? null,
    fileType: row.file_type ?? null
});
const mapReportRow = (row) => ({
    id: row.report_id,
    postId: row.post_id,
    reporterId: row.reporter_id,
    reason: row.reason ?? null,
    status: row.status,
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at ?? null,
    reporter: mapReporter(row),
    post: mapReportPost(row)
});
const reportSelectBase = `
  SELECT
    r.id AS report_id,
    r.post_id,
    r.reporter_id,
    r.reason,
    r.status,
    r.created_at,
    r.reviewed_at,
    rep.first_name AS reporter_first_name,
    rep.last_name AS reporter_last_name,
    rep.avatar_url AS reporter_avatar_url,
    rep.headline AS reporter_headline,
    p.content AS post_content,
    p.media_url AS post_media_url,
    p.created_at AS post_created_at,
    u.id AS post_author_id,
    u.first_name AS post_author_first_name,
    u.last_name AS post_author_last_name,
    u.avatar_url AS post_author_avatar_url,
    u.headline AS post_author_headline
  FROM feed_reports r
  INNER JOIN users rep ON rep.id = r.reporter_id
  INNER JOIN feed_posts p ON p.id = r.post_id
  INNER JOIN users u ON u.id = p.author_id
`;
const mapComment = (row) => ({
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
const fetchPostMetrics = async (postId, userId) => {
    const [rows] = await (0, database_1.getPool)().query(`SELECT
        (SELECT COUNT(*) FROM feed_post_reactions WHERE post_id = :postId) AS reaction_count,
        (SELECT COUNT(*) FROM feed_comments WHERE post_id = :postId) AS comment_count,
        (SELECT COUNT(*) FROM feed_shares WHERE post_id = :postId) AS share_count,
        (SELECT reaction_type FROM feed_post_reactions WHERE post_id = :postId AND user_id = :userId LIMIT 1) AS viewer_reaction,
        EXISTS(SELECT 1 FROM feed_saved_posts WHERE post_id = :postId AND user_id = :userId) AS is_saved
     LIMIT 1`, { postId, userId });
    const metrics = rows[0];
    return {
        reactionCount: Number(metrics?.reaction_count ?? 0),
        commentCount: Number(metrics?.comment_count ?? 0),
        shareCount: Number(metrics?.share_count ?? 0),
        viewerReaction: metrics?.viewer_reaction ?? null,
        isSaved: Boolean(metrics?.is_saved ?? 0)
    };
};
exports.feedRepository = {
    async createPost(input) {
        const id = crypto_1.default.randomUUID();
        const [result] = await (0, database_1.getPool)().execute(`INSERT INTO feed_posts (id, author_id, content, media_url, tags)
       VALUES (:id, :authorId, :content, :mediaUrl, :tags)`, {
            id,
            authorId: input.authorId,
            content: input.content,
            mediaUrl: input.mediaUrl ?? null,
            tags: JSON.stringify(input.tags ?? [])
        });
        if (result.affectedRows !== 1) {
            throw new Error('No fue posible crear la publicacion');
        }
        if (input.attachments && input.attachments.length > 0) {
            await this.insertAttachments(id, input.attachments);
        }
        const post = await this.findPostById(id);
        if (!post) {
            throw new Error('No se encontro la publicacion despues de crearla');
        }
        return post;
    },
    async insertAttachments(postId, attachments) {
        if (!attachments || attachments.length === 0)
            return;
        for (const attachment of attachments) {
            const [result] = await (0, database_1.getPool)().execute(`INSERT INTO feed_post_attachments (id, post_id, file_name, file_type, url)
         VALUES (:id, :postId, :fileName, :fileType, :url)`, {
                id: crypto_1.default.randomUUID(),
                postId,
                fileName: attachment.fileName ?? null,
                fileType: attachment.fileType ?? null,
                url: attachment.url
            });
            if (result.affectedRows !== 1) {
                throw new Error('No fue posible adjuntar el archivo');
            }
        }
    },
    async findPostById(id) {
        const [rows] = await (0, database_1.getPool)().query('SELECT * FROM feed_posts WHERE id = :id LIMIT 1', { id });
        if (rows.length === 0)
            return null;
        const attachments = await this.getAttachments([id]);
        return mapPost(rows[0], attachments.get(id) ?? []);
    },
    async findPostWithMeta(id, viewerId) {
        const [rows] = await (0, database_1.getPool)().query(`SELECT
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
       LIMIT 1`, { id, viewerId });
        if (rows.length === 0) {
            return null;
        }
        const row = rows[0];
        const post = mapPost(row);
        const latestComments = await this.getLatestComments([post.id], 3);
        const attachments = await this.getAttachments([post.id]);
        return {
            ...post,
            author: mapAuthor(row),
            reactionCount: Number(row.reaction_count ?? 0),
            commentCount: Number(row.comment_count ?? 0),
            shareCount: Number(row.share_count ?? 0),
            viewerReaction: row.viewer_reaction ?? null,
            isSaved: Boolean(row.is_saved ?? 0),
            latestComments: latestComments.get(post.id) ?? [],
            attachments: attachments.get(post.id) ?? []
        };
    },
    async listPosts(viewerId, limit = 15, offset = 0, authorId) {
        const filters = [];
        const params = { viewerId };
        if (authorId) {
            filters.push('p.author_id = :authorId');
            params.authorId = authorId;
        }
        const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';
        const [rows] = await (0, database_1.getPool)().query(`SELECT
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
       ${whereClause}
       ORDER BY p.created_at DESC
       LIMIT ${Math.max(1, limit)} OFFSET ${Math.max(0, offset)}`, params);
        if (rows.length === 0)
            return [];
        const posts = rows.map((row) => ({
            base: mapPost(row),
            aggregate: {
                reactionCount: Number(row.reaction_count ?? 0),
                commentCount: Number(row.comment_count ?? 0),
                shareCount: Number(row.share_count ?? 0),
                viewerReaction: row.viewer_reaction ?? null,
                isSaved: Boolean(row.is_saved ?? 0),
                author: mapAuthor(row)
            }
        }));
        const postIds = posts.map(({ base }) => base.id);
        const latestComments = await this.getLatestComments(postIds, 3);
        const attachments = await this.getAttachments(postIds);
        return posts.map(({ base, aggregate }) => ({
            ...base,
            author: aggregate.author,
            reactionCount: aggregate.reactionCount,
            commentCount: aggregate.commentCount,
            shareCount: aggregate.shareCount,
            viewerReaction: aggregate.viewerReaction,
            isSaved: aggregate.isSaved,
            latestComments: latestComments.get(base.id) ?? [],
            attachments: attachments.get(base.id) ?? []
        }));
    },
    async listSavedPosts(viewerId) {
        const [rows] = await (0, database_1.getPool)().query(`SELECT
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
       FROM feed_saved_posts sp
       INNER JOIN feed_posts p ON p.id = sp.post_id
       INNER JOIN users u ON u.id = p.author_id
       WHERE sp.user_id = :viewerId
       ORDER BY sp.created_at DESC`, { viewerId });
        if (rows.length === 0)
            return [];
        const posts = rows.map((row) => ({
            base: mapPost(row),
            aggregate: {
                reactionCount: Number(row.reaction_count ?? 0),
                commentCount: Number(row.comment_count ?? 0),
                shareCount: Number(row.share_count ?? 0),
                viewerReaction: row.viewer_reaction ?? null,
                isSaved: Boolean(row.is_saved ?? 0),
                author: mapAuthor(row)
            }
        }));
        const postIds = posts.map(({ base }) => base.id);
        const latestComments = await this.getLatestComments(postIds, 3);
        const attachments = await this.getAttachments(postIds);
        return posts.map(({ base, aggregate }) => ({
            ...base,
            author: aggregate.author,
            reactionCount: aggregate.reactionCount,
            commentCount: aggregate.commentCount,
            shareCount: aggregate.shareCount,
            viewerReaction: aggregate.viewerReaction,
            isSaved: aggregate.isSaved,
            latestComments: latestComments.get(base.id) ?? [],
            attachments: attachments.get(base.id) ?? []
        }));
    },
    async getLatestComments(postIds, limitPerPost) {
        const results = new Map();
        if (postIds.length === 0 || limitPerPost <= 0)
            return results;
        const placeholders = postIds.map(() => '?').join(',');
        const [rows] = await (0, database_1.getPool)().query(`SELECT c.*, u.first_name, u.last_name, u.avatar_url, u.headline
       FROM feed_comments c
       INNER JOIN users u ON u.id = c.user_id
       WHERE c.post_id IN (${placeholders})
       ORDER BY c.created_at DESC`, postIds);
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
    async addComment(input) {
        const id = crypto_1.default.randomUUID();
        const [result] = await (0, database_1.getPool)().execute(`INSERT INTO feed_comments (id, post_id, user_id, content)
       VALUES (:id, :postId, :userId, :content)`, {
            id,
            postId: input.postId,
            userId: input.userId,
            content: input.content
        });
        if (result.affectedRows !== 1) {
            throw new Error('No fue posible registrar el comentario');
        }
        const [rows] = await (0, database_1.getPool)().query(`SELECT c.*, u.first_name, u.last_name, u.avatar_url, u.headline
       FROM feed_comments c
       INNER JOIN users u ON u.id = c.user_id
       WHERE c.id = :id
       LIMIT 1`, { id });
        if (rows.length === 0) {
            throw new Error('Comentario no encontrado despues de crearlo');
        }
        return mapComment(rows[0]);
    },
    async toggleReaction(postId, userId, reactionType) {
        const connection = await (0, database_1.getConnection)();
        try {
            const [rows] = await connection.query(`SELECT reaction_type
         FROM feed_post_reactions
         WHERE post_id = :postId AND user_id = :userId
         LIMIT 1`, { postId, userId });
            if (rows.length === 0) {
                await connection.execute(`INSERT INTO feed_post_reactions (post_id, user_id, reaction_type)
           VALUES (:postId, :userId, :reactionType)`, { postId, userId, reactionType });
            }
            else if (rows[0].reaction_type === reactionType) {
                await connection.execute(`DELETE FROM feed_post_reactions
           WHERE post_id = :postId AND user_id = :userId`, { postId, userId });
            }
            else {
                await connection.execute(`UPDATE feed_post_reactions
           SET reaction_type = :reactionType
           WHERE post_id = :postId AND user_id = :userId`, { postId, userId, reactionType });
            }
        }
        finally {
            connection.release();
        }
        return await fetchPostMetrics(postId, userId);
    },
    async toggleSave(postId, userId) {
        const connection = await (0, database_1.getConnection)();
        try {
            const [rows] = await connection.query(`SELECT 1
         FROM feed_saved_posts
         WHERE post_id = :postId AND user_id = :userId
         LIMIT 1`, { postId, userId });
            if (rows.length === 0) {
                await connection.execute(`INSERT INTO feed_saved_posts (post_id, user_id)
           VALUES (:postId, :userId)`, { postId, userId });
            }
            else {
                await connection.execute(`DELETE FROM feed_saved_posts
           WHERE post_id = :postId AND user_id = :userId`, { postId, userId });
            }
        }
        finally {
            connection.release();
        }
        return await fetchPostMetrics(postId, userId);
    },
    async sharePost(input) {
        const id = crypto_1.default.randomUUID();
        const [result] = await (0, database_1.getPool)().execute(`INSERT INTO feed_shares (id, post_id, user_id, message)
       VALUES (:id, :postId, :userId, :message)`, {
            id,
            postId: input.postId,
            userId: input.userId,
            message: input.message ?? null
        });
        if (result.affectedRows !== 1) {
            throw new Error('No fue posible compartir la publicacion');
        }
        const metrics = await fetchPostMetrics(input.postId, input.userId);
        return { shareId: id, ...metrics };
    },
    async deletePost(postId, userId) {
        const [result] = await (0, database_1.getPool)().execute(`DELETE FROM feed_posts
       WHERE id = :postId AND author_id = :userId`, { postId, userId });
        return result.affectedRows > 0;
    },
    async getPostMetrics(postId, userId) {
        return await fetchPostMetrics(postId, userId);
    },
    async listComments(postId) {
        const [rows] = await (0, database_1.getPool)().query(`SELECT c.*, u.first_name, u.last_name, u.avatar_url, u.headline
       FROM feed_comments c
       INNER JOIN users u ON u.id = c.user_id
       WHERE c.post_id = :postId
       ORDER BY c.created_at ASC`, { postId });
        return rows.map(mapComment);
    },
    async getAttachments(postIds) {
        const results = new Map();
        if (postIds.length === 0)
            return results;
        const placeholders = postIds.map(() => '?').join(',');
        const [rows] = await (0, database_1.getPool)().query(`SELECT *
       FROM feed_post_attachments
       WHERE post_id IN (${placeholders})
       ORDER BY created_at ASC`, postIds);
        for (const row of rows) {
            const attachment = mapAttachment(row);
            if (!results.has(attachment.postId)) {
                results.set(attachment.postId, []);
            }
            results.get(attachment.postId).push(attachment);
        }
        return results;
    },
    async createReport(postId, reporterId, reason) {
        const id = crypto_1.default.randomUUID();
        const [result] = await (0, database_1.getPool)().execute(`INSERT INTO feed_reports (id, post_id, reporter_id, reason)
       VALUES (:id, :postId, :reporterId, :reason)`, {
            id,
            postId,
            reporterId,
            reason: reason ?? null
        });
        if (result.affectedRows !== 1) {
            throw new Error('No fue posible registrar el reporte');
        }
        const [rows] = await (0, database_1.getPool)().query(`${reportSelectBase}
       WHERE r.id = :id
       LIMIT 1`, { id });
        if (rows.length === 0) {
            throw new Error('No se encontro el reporte despues de crearlo');
        }
        return mapReportRow(rows[0]);
    },
    async listReports() {
        const [rows] = await (0, database_1.getPool)().query(`${reportSelectBase}
       ORDER BY r.created_at DESC`);
        return rows.map(mapReportRow);
    },
    async updateReportStatus(reportId, status) {
        const [result] = await (0, database_1.getPool)().execute(`UPDATE feed_reports
       SET status = :status,
           reviewed_at = CASE WHEN :status = 'reviewed' THEN NOW() ELSE reviewed_at END
       WHERE id = :reportId`, { status, reportId });
        if (result.affectedRows === 0) {
            return null;
        }
        const [rows] = await (0, database_1.getPool)().query(`${reportSelectBase}
       WHERE r.id = :reportId
       LIMIT 1`, { reportId });
        if (rows.length === 0)
            return null;
        return mapReportRow(rows[0]);
    }
};
