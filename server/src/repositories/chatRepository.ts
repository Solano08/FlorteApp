import crypto from 'crypto';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { getConnection, getPool } from '../config/database';
import { Chat, CreateChatInput, CreateMessageInput, Message } from '../types/chat';

const mapChat = (row: RowDataPacket): Chat => ({
  id: row.id,
  name: row.name,
  isGroup: row.is_group === 1,
  createdBy: row.created_by,
  createdAt: row.created_at
});

const mapMessage = (row: RowDataPacket): Message => ({
  id: row.id,
  chatId: row.chat_id,
  senderId: row.sender_id,
  content: row.content,
  attachmentUrl: row.attachment_url,
  createdAt: row.created_at
});

export const chatRepository = {
  async createChat(input: CreateChatInput): Promise<Chat> {
    const connection = await getConnection();
    const chatId = crypto.randomUUID();

    try {
      await connection.beginTransaction();

      await connection.execute<ResultSetHeader>(
        `INSERT INTO chats (id, name, is_group, created_by)
         VALUES (:id, :name, :isGroup, :createdBy)`,
        {
          id: chatId,
          name: input.name ?? null,
          isGroup: input.isGroup ? 1 : 0,
          createdBy: input.createdBy
        }
      );

      const memberIds = Array.from(new Set([...input.memberIds, input.createdBy]));
      for (const memberId of memberIds) {
        await connection.execute<ResultSetHeader>(
          `INSERT INTO chat_members (chat_id, user_id)
           VALUES (:chatId, :userId)
           ON DUPLICATE KEY UPDATE joined_at = joined_at`,
          { chatId, userId: memberId }
        );
      }

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    const chat = await this.findById(chatId);
    if (!chat) {
      throw new Error('Chat no encontrado tras crearlo');
    }
    return chat;
  },

  async findById(id: string): Promise<Chat | null> {
    const [rows] = await getPool().query<RowDataPacket[]>(
      'SELECT * FROM chats WHERE id = :id LIMIT 1',
      { id }
    );
    if (rows.length === 0) return null;
    return mapChat(rows[0]);
  },

  async findUserChats(userId: string): Promise<Array<Chat & { lastMessageAt?: Date; lastMessage?: string }>> {
    const [rows] = await getPool().query<RowDataPacket[]>(
      `SELECT c.*, 
              MAX(m.created_at) AS last_message_at,
              (SELECT content FROM messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_message
       FROM chats c
       INNER JOIN chat_members cm ON cm.chat_id = c.id
       LEFT JOIN messages m ON m.chat_id = c.id
       WHERE cm.user_id = :userId
       GROUP BY c.id
       ORDER BY last_message_at IS NULL, last_message_at DESC, c.created_at DESC`,
      { userId }
    );
    return rows.map((row) => ({
      ...mapChat(row),
      lastMessageAt: row.last_message_at,
      lastMessage: row.last_message || null
    }));
  },

  async listChatMembers(chatId: string): Promise<string[]> {
    const [rows] = await getPool().query<RowDataPacket[]>(
      `SELECT user_id
       FROM chat_members
       WHERE chat_id = :chatId`,
      { chatId }
    );
    return rows.map((row) => row.user_id as string);
  },

  async createMessage(input: CreateMessageInput): Promise<Message> {
    const id = crypto.randomUUID();
    const [result] = await getPool().execute<ResultSetHeader>(
      `INSERT INTO messages (id, chat_id, sender_id, content, attachment_url)
       VALUES (:id, :chatId, :senderId, :content, :attachmentUrl)`,
      {
        id,
        chatId: input.chatId,
        senderId: input.senderId,
        content: input.content,
        attachmentUrl: input.attachmentUrl ?? null
      }
    );

    if (result.affectedRows !== 1) {
      throw new Error('No fue posible crear el mensaje');
    }

    const [rows] = await getPool().query<RowDataPacket[]>(
      'SELECT * FROM messages WHERE id = :id LIMIT 1',
      { id }
    );
    if (rows.length === 0) {
      throw new Error('Mensaje no encontrado después de crearlo');
    }
    return mapMessage(rows[0]);
  },

  async getMessages(chatId: string, limit = 50): Promise<Message[]> {
    const [rows] = await getPool().query<RowDataPacket[]>(
      `SELECT * FROM messages
       WHERE chat_id = :chatId
       ORDER BY created_at DESC
       LIMIT :limit`,
      { chatId, limit }
    );
    return rows.map(mapMessage).reverse();
  }
};
