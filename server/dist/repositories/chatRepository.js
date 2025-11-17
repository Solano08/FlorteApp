"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatRepository = void 0;
const crypto_1 = __importDefault(require("crypto"));
const database_1 = require("../config/database");
const mapChat = (row) => ({
    id: row.id,
    name: row.name,
    isGroup: row.is_group === 1,
    createdBy: row.created_by,
    createdAt: row.created_at
});
const mapMessage = (row) => ({
    id: row.id,
    chatId: row.chat_id,
    senderId: row.sender_id,
    content: row.content,
    attachmentUrl: row.attachment_url,
    createdAt: row.created_at
});
exports.chatRepository = {
    async createChat(input) {
        const connection = await (0, database_1.getConnection)();
        const chatId = crypto_1.default.randomUUID();
        try {
            await connection.beginTransaction();
            await connection.execute(`INSERT INTO chats (id, name, is_group, created_by)
         VALUES (:id, :name, :isGroup, :createdBy)`, {
                id: chatId,
                name: input.name ?? null,
                isGroup: input.isGroup ? 1 : 0,
                createdBy: input.createdBy
            });
            const memberIds = Array.from(new Set([...input.memberIds, input.createdBy]));
            for (const memberId of memberIds) {
                await connection.execute(`INSERT INTO chat_members (chat_id, user_id)
           VALUES (:chatId, :userId)
           ON DUPLICATE KEY UPDATE joined_at = joined_at`, { chatId, userId: memberId });
            }
            await connection.commit();
        }
        catch (error) {
            await connection.rollback();
            throw error;
        }
        finally {
            connection.release();
        }
        const chat = await this.findById(chatId);
        if (!chat) {
            throw new Error('Chat no encontrado tras crearlo');
        }
        return chat;
    },
    async findById(id) {
        const [rows] = await (0, database_1.getPool)().query('SELECT * FROM chats WHERE id = :id LIMIT 1', { id });
        if (rows.length === 0)
            return null;
        return mapChat(rows[0]);
    },
    async findUserChats(userId) {
        const [rows] = await (0, database_1.getPool)().query(`SELECT c.*, MAX(m.created_at) AS last_message_at
       FROM chats c
       INNER JOIN chat_members cm ON cm.chat_id = c.id
       LEFT JOIN messages m ON m.chat_id = c.id
       WHERE cm.user_id = :userId
       GROUP BY c.id
       ORDER BY last_message_at IS NULL, last_message_at DESC, c.created_at DESC`, { userId });
        return rows.map((row) => ({
            ...mapChat(row),
            lastMessageAt: row.last_message_at
        }));
    },
    async listChatMembers(chatId) {
        const [rows] = await (0, database_1.getPool)().query(`SELECT user_id
       FROM chat_members
       WHERE chat_id = :chatId`, { chatId });
        return rows.map((row) => row.user_id);
    },
    async createMessage(input) {
        const id = crypto_1.default.randomUUID();
        const [result] = await (0, database_1.getPool)().execute(`INSERT INTO messages (id, chat_id, sender_id, content, attachment_url)
       VALUES (:id, :chatId, :senderId, :content, :attachmentUrl)`, {
            id,
            chatId: input.chatId,
            senderId: input.senderId,
            content: input.content,
            attachmentUrl: input.attachmentUrl ?? null
        });
        if (result.affectedRows !== 1) {
            throw new Error('No fue posible crear el mensaje');
        }
        const [rows] = await (0, database_1.getPool)().query('SELECT * FROM messages WHERE id = :id LIMIT 1', { id });
        if (rows.length === 0) {
            throw new Error('Mensaje no encontrado después de crearlo');
        }
        return mapMessage(rows[0]);
    },
    async getMessages(chatId, limit = 50) {
        const [rows] = await (0, database_1.getPool)().query(`SELECT * FROM messages
       WHERE chat_id = :chatId
       ORDER BY created_at DESC
       LIMIT :limit`, { chatId, limit });
        return rows.map(mapMessage).reverse();
    }
};
