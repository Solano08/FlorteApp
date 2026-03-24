import crypto from 'crypto';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { getPool } from '../config/database';
import { Channel, ChannelMessage, ChannelMessageReport, CreateChannelInput, CreateChannelMessageInput } from '../types/channel';

const mapChannel = (row: RowDataPacket): Channel => ({
  id: row.id,
  communityId: row.community_id,
  name: row.name,
  description: row.description,
  type: row.type,
  position: row.position,
  createdBy: row.created_by,
  createdAt: row.created_at
});

const mapReport = (row: RowDataPacket): ChannelMessageReport => ({
  id: row.id,
  messageId: row.message_id,
  reporterId: row.reporter_id,
  reason: row.reason,
  details: row.details ?? undefined,
  status: row.status,
  createdAt: row.created_at,
  resolvedAt: row.resolved_at ?? undefined,
  reporter: row.reporter_first_name ? {
    id: row.reporter_id,
    firstName: row.reporter_first_name,
    lastName: row.reporter_last_name,
    avatarUrl: row.reporter_avatar_url
  } : undefined,
  message: row.channel_id ? {
    id: row.message_id,
    channelId: row.channel_id,
    senderId: row.sender_id,
    content: row.content,
    attachmentUrl: row.attachment_url,
    createdAt: row.msg_created_at,
    sender: row.sender_first_name ? {
      id: row.sender_id,
      firstName: row.sender_first_name,
      lastName: row.sender_last_name,
      avatarUrl: row.sender_avatar_url
    } : undefined
  } : undefined
});

const mapChannelMessage = (row: RowDataPacket): ChannelMessage => ({
  id: row.id,
  channelId: row.channel_id,
  senderId: row.sender_id,
  sender: row.sender_first_name ? {
    id: row.sender_id,
    firstName: row.sender_first_name,
    lastName: row.sender_last_name,
    avatarUrl: row.sender_avatar_url
  } : undefined,
  content: row.content,
  attachmentUrl: row.attachment_url,
  createdAt: row.created_at,
  isPinned: Boolean(row.is_pinned),
  pinnedAt: row.pinned_at ?? undefined,
  pinnedBy: row.pinned_by ?? undefined,
  threadRootId: row.thread_root_id ?? undefined,
  threadTitle: row.thread_title ?? undefined
});

export const channelRepository = {
  async createChannel(input: CreateChannelInput): Promise<Channel> {
    const id = crypto.randomUUID();
    
    // Si no se especifica posición, obtener la máxima + 1
    let position = input.position;
    if (position === undefined) {
      const [posRows] = await getPool().query<RowDataPacket[]>(
        'SELECT COALESCE(MAX(position), -1) + 1 as next_position FROM channels WHERE community_id = :communityId',
        { communityId: input.communityId }
      );
      position = posRows[0]?.next_position ?? 0;
    }

    await getPool().execute<ResultSetHeader>(
      `INSERT INTO channels (id, community_id, name, description, type, position, created_by)
       VALUES (:id, :communityId, :name, :description, :type, :position, :createdBy)`,
      {
        id,
        communityId: input.communityId,
        name: input.name,
        description: input.description ?? null,
        type: input.type ?? 'text',
        position,
        createdBy: input.createdBy
      }
    );

    const channel = await this.findById(id);
    if (!channel) {
      throw new Error('Canal no encontrado después de crearlo');
    }
    return channel;
  },

  async findById(id: string): Promise<Channel | null> {
    const [rows] = await getPool().query<RowDataPacket[]>(
      'SELECT * FROM channels WHERE id = :id LIMIT 1',
      { id }
    );
    if (rows.length === 0) return null;
    return mapChannel(rows[0]);
  },

  async listByCommunity(communityId: string): Promise<Channel[]> {
    const [rows] = await getPool().query<RowDataPacket[]>(
      'SELECT * FROM channels WHERE community_id = :communityId ORDER BY position ASC, created_at ASC',
      { communityId }
    );
    return rows.map(mapChannel);
  },

  async updateChannel(id: string, input: { name?: string; description?: string | null; type?: 'text' | 'voice'; position?: number }): Promise<Channel | null> {
    const channel = await this.findById(id);
    if (!channel) return null;

    const updates: string[] = [];
    const params: Record<string, unknown> = { id };

    if (input.name !== undefined) {
      updates.push('name = :name');
      params.name = input.name;
    }
    if (input.description !== undefined) {
      updates.push('description = :description');
      params.description = input.description;
    }
    if (input.type !== undefined) {
      updates.push('type = :type');
      params.type = input.type;
    }
    if (input.position !== undefined) {
      updates.push('position = :position');
      params.position = input.position;
    }

    if (updates.length === 0) return channel;

    await getPool().execute<ResultSetHeader>(
      `UPDATE channels SET ${updates.join(', ')} WHERE id = :id`,
      params
    );

    return await this.findById(id);
  },

  async deleteChannel(id: string): Promise<void> {
    await getPool().execute<ResultSetHeader>(
      'DELETE FROM channels WHERE id = :id',
      { id }
    );
  },

  async createMessage(input: CreateChannelMessageInput): Promise<ChannelMessage> {
    const id = crypto.randomUUID();
    await getPool().execute<ResultSetHeader>(
      `INSERT INTO channel_messages (id, channel_id, sender_id, content, attachment_url, thread_root_id, thread_title)
       VALUES (:id, :channelId, :senderId, :content, :attachmentUrl, :threadRootId, :threadTitle)`,
      {
        id,
        channelId: input.channelId,
        senderId: input.senderId,
        content: input.content ?? '',
        attachmentUrl: input.attachmentUrl ?? null,
        threadRootId: input.threadRootId ?? null,
        threadTitle: input.threadTitle ?? null
      }
    );

    const message = await this.findMessageById(id);
    if (!message) {
      throw new Error('Mensaje no encontrado después de crearlo');
    }
    return message;
  },

  async findMessageById(id: string): Promise<ChannelMessage | null> {
    const [rows] = await getPool().query<RowDataPacket[]>(
      `SELECT 
         cm.*,
         u.first_name as sender_first_name,
         u.last_name as sender_last_name,
         u.avatar_url as sender_avatar_url
       FROM channel_messages cm
       INNER JOIN users u ON u.id = cm.sender_id
       WHERE cm.id = :id LIMIT 1`,
      { id }
    );
    if (rows.length === 0) return null;
    return mapChannelMessage(rows[0]);
  },

  async listMessages(channelId: string, limit: number = 100, offset: number = 0, viewerId?: string): Promise<ChannelMessage[]> {
    const hasViewer = !!viewerId;
    const [rows] = await getPool().query<RowDataPacket[]>(
      hasViewer
        ? `SELECT 
             cm.*,
             u.first_name as sender_first_name,
             u.last_name as sender_last_name,
             u.avatar_url as sender_avatar_url,
             (SELECT 1 FROM channel_message_stars cms WHERE cms.message_id = cm.id AND cms.user_id = :viewerId LIMIT 1) as viewer_starred
           FROM channel_messages cm
           INNER JOIN users u ON u.id = cm.sender_id
           WHERE cm.channel_id = :channelId 
           ORDER BY COALESCE(cm.is_pinned, 0) DESC, cm.created_at ASC
           LIMIT :limit OFFSET :offset`
        : `SELECT 
             cm.*,
             u.first_name as sender_first_name,
             u.last_name as sender_last_name,
             u.avatar_url as sender_avatar_url
           FROM channel_messages cm
           INNER JOIN users u ON u.id = cm.sender_id
           WHERE cm.channel_id = :channelId 
           ORDER BY COALESCE(cm.is_pinned, 0) DESC, cm.created_at ASC
           LIMIT :limit OFFSET :offset`,
      hasViewer ? { channelId, limit, offset, viewerId } : { channelId, limit, offset }
    );
    return rows.map((row) => {
      const msg = mapChannelMessage(row);
      if (hasViewer && row.viewer_starred !== undefined) {
        msg.viewerStarred = !!row.viewer_starred;
      }
      return msg;
    });
  },

  async deleteMessage(id: string): Promise<void> {
    await getPool().execute<ResultSetHeader>(
      'DELETE FROM channel_messages WHERE id = :id',
      { id }
    );
  },

  async toggleStarMessage(messageId: string, userId: string): Promise<{ starred: boolean }> {
    const message = await this.findMessageById(messageId);
    if (!message) throw new Error('Mensaje no encontrado');

    const [existing] = await getPool().query<RowDataPacket[]>(
      'SELECT 1 FROM channel_message_stars WHERE message_id = :messageId AND user_id = :userId LIMIT 1',
      { messageId, userId }
    );

    if (existing && existing.length > 0) {
      await getPool().execute<ResultSetHeader>(
        'DELETE FROM channel_message_stars WHERE message_id = :messageId AND user_id = :userId',
        { messageId, userId }
      );
      return { starred: false };
    } else {
      await getPool().execute<ResultSetHeader>(
        'INSERT INTO channel_message_stars (message_id, user_id) VALUES (:messageId, :userId)',
        { messageId, userId }
      );
      return { starred: true };
    }
  },

  async reportMessage(messageId: string, reporterId: string, reason: string, details?: string): Promise<ChannelMessageReport> {
    const id = crypto.randomUUID();
    const message = await this.findMessageById(messageId);
    if (!message) throw new Error('Mensaje no encontrado');

    await getPool().execute<ResultSetHeader>(
      `INSERT INTO channel_message_reports (id, message_id, reporter_id, reason, details)
       VALUES (:id, :messageId, :reporterId, :reason, :details)`,
      { id, messageId, reporterId, reason, details: details ?? null }
    );

    const [rows] = await getPool().query<RowDataPacket[]>(
      `SELECT r.*, reporter.first_name as reporter_first_name, reporter.last_name as reporter_last_name, reporter.avatar_url as reporter_avatar_url
       FROM channel_message_reports r
       INNER JOIN users reporter ON reporter.id = r.reporter_id
       WHERE r.id = :id LIMIT 1`,
      { id }
    );
    if (rows.length === 0) throw new Error('No se pudo crear el reporte');
    return mapReport(rows[0]);
  },

  async listChannelMessageReports(): Promise<ChannelMessageReport[]> {
    const [rows] = await getPool().query<RowDataPacket[]>(
      `SELECT r.id, r.message_id, r.reporter_id, r.reason, r.details, r.status, r.created_at, r.resolved_at,
         reporter.first_name as reporter_first_name, reporter.last_name as reporter_last_name, reporter.avatar_url as reporter_avatar_url,
         cm.channel_id, cm.sender_id, cm.content, cm.attachment_url, cm.created_at as msg_created_at,
         sender.first_name as sender_first_name, sender.last_name as sender_last_name, sender.avatar_url as sender_avatar_url
       FROM channel_message_reports r
       INNER JOIN users reporter ON reporter.id = r.reporter_id
       INNER JOIN channel_messages cm ON cm.id = r.message_id
       INNER JOIN users sender ON sender.id = cm.sender_id
       ORDER BY r.created_at DESC`
    );
    return rows.map(mapReport);
  },

  async updateChannelReportStatus(reportId: string, status: 'pending' | 'reviewed'): Promise<ChannelMessageReport | null> {
    await getPool().execute<ResultSetHeader>(
      'UPDATE channel_message_reports SET status = :status, resolved_at = IF(:status = "reviewed", NOW(), NULL) WHERE id = :id',
      { id: reportId, status }
    );
    const [rows] = await getPool().query<RowDataPacket[]>(
      `SELECT r.*, reporter.first_name as reporter_first_name, reporter.last_name as reporter_last_name, reporter.avatar_url as reporter_avatar_url
       FROM channel_message_reports r
       INNER JOIN users reporter ON reporter.id = r.reporter_id
       WHERE r.id = :id LIMIT 1`,
      { id: reportId }
    );
    if (rows.length === 0) return null;
    return mapReport(rows[0]);
  },

  async togglePinMessage(messageId: string, userId: string): Promise<ChannelMessage | null> {
    const message = await this.findMessageById(messageId);
    if (!message) return null;

    const isPinned = !!message.isPinned;
    if (isPinned) {
      await getPool().execute<ResultSetHeader>(
        'UPDATE channel_messages SET is_pinned = FALSE, pinned_at = NULL, pinned_by = NULL WHERE id = :id',
        { id: messageId }
      );
    } else {
      await getPool().execute<ResultSetHeader>(
        'UPDATE channel_messages SET is_pinned = FALSE, pinned_at = NULL, pinned_by = NULL WHERE channel_id = :channelId',
        { channelId: message.channelId }
      );
      await getPool().execute<ResultSetHeader>(
        'UPDATE channel_messages SET is_pinned = TRUE, pinned_at = NOW(), pinned_by = :userId WHERE id = :id',
        { id: messageId, userId }
      );
    }
    return await this.findMessageById(messageId);
  },

  async getPollVoteCountsByMessage(
    messageIds: string[]
  ): Promise<Map<string, { optionIndex: number; count: number }[]>> {
    if (messageIds.length === 0) return new Map();
    const placeholders = messageIds.map(() => '?').join(',');
    const [rows] = await getPool().query<RowDataPacket[]>(
      `SELECT message_id AS messageId, option_index AS optionIndex, COUNT(*) AS cnt
       FROM channel_message_poll_votes
       WHERE message_id IN (${placeholders})
       GROUP BY message_id, option_index`,
      messageIds
    );
    const map = new Map<string, { optionIndex: number; count: number }[]>();
    for (const r of rows) {
      const mid = String(r.messageId);
      const arr = map.get(mid) ?? [];
      arr.push({ optionIndex: Number(r.optionIndex), count: Number(r.cnt) });
      map.set(mid, arr);
    }
    return map;
  },

  async getViewerPollVoteIndexes(messageIds: string[], userId: string): Promise<Map<string, number>> {
    if (messageIds.length === 0) return new Map();
    const placeholders = messageIds.map(() => '?').join(',');
    const [rows] = await getPool().query<RowDataPacket[]>(
      `SELECT message_id AS messageId, option_index AS optionIndex
       FROM channel_message_poll_votes
       WHERE user_id = ? AND message_id IN (${placeholders})`,
      [userId, ...messageIds]
    );
    const map = new Map<string, number>();
    for (const r of rows) {
      map.set(String(r.messageId), Number(r.optionIndex));
    }
    return map;
  },

  async upsertPollVote(messageId: string, userId: string, optionIndex: number): Promise<void> {
    await getPool().execute<ResultSetHeader>(
      `INSERT INTO channel_message_poll_votes (message_id, user_id, option_index)
       VALUES (:messageId, :userId, :optionIndex)
       ON DUPLICATE KEY UPDATE option_index = VALUES(option_index)`,
      { messageId, userId, optionIndex }
    );
  }
};

