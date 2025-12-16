import crypto from 'crypto';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { getPool } from '../config/database';
import { Channel, ChannelMessage, CreateChannelInput, CreateChannelMessageInput } from '../types/channel';

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
  createdAt: row.created_at
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

  async deleteChannel(id: string): Promise<void> {
    await getPool().execute<ResultSetHeader>(
      'DELETE FROM channels WHERE id = :id',
      { id }
    );
  },

  async createMessage(input: CreateChannelMessageInput): Promise<ChannelMessage> {
    const id = crypto.randomUUID();
    await getPool().execute<ResultSetHeader>(
      `INSERT INTO channel_messages (id, channel_id, sender_id, content, attachment_url)
       VALUES (:id, :channelId, :senderId, :content, :attachmentUrl)`,
      {
        id,
        channelId: input.channelId,
        senderId: input.senderId,
        content: input.content,
        attachmentUrl: input.attachmentUrl ?? null
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

  async listMessages(channelId: string, limit: number = 100, offset: number = 0): Promise<ChannelMessage[]> {
    const [rows] = await getPool().query<RowDataPacket[]>(
      `SELECT 
         cm.*,
         u.first_name as sender_first_name,
         u.last_name as sender_last_name,
         u.avatar_url as sender_avatar_url
       FROM channel_messages cm
       INNER JOIN users u ON u.id = cm.sender_id
       WHERE cm.channel_id = :channelId 
       ORDER BY cm.created_at DESC 
       LIMIT :limit OFFSET :offset`,
      { channelId, limit, offset }
    );
    return rows.reverse().map(mapChannelMessage); // Reverse para obtener orden cronológico
  },

  async deleteMessage(id: string): Promise<void> {
    await getPool().execute<ResultSetHeader>(
      'DELETE FROM channel_messages WHERE id = :id',
      { id }
    );
  }
};

