"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatService = void 0;
const chatRepository_1 = require("../repositories/chatRepository");
const appError_1 = require("../utils/appError");
exports.chatService = {
    async createChat(input) {
        if (input.memberIds.length === 0) {
            throw new appError_1.AppError('Debes agregar al menos un integrante', 400);
        }
        return await chatRepository_1.chatRepository.createChat(input);
    },
    async listUserChats(userId) {
        return await chatRepository_1.chatRepository.findUserChats(userId);
    },
    async getMessages(chatId, userId) {
        const members = await chatRepository_1.chatRepository.listChatMembers(chatId);
        if (!members.includes(userId)) {
            throw new appError_1.AppError('No tienes acceso a esta conversación', 403);
        }
        return await chatRepository_1.chatRepository.getMessages(chatId);
    },
    async sendMessage(input) {
        const members = await chatRepository_1.chatRepository.listChatMembers(input.chatId);
        if (!members.includes(input.senderId)) {
            throw new appError_1.AppError('No tienes acceso a esta conversación', 403);
        }
        if (!input.content && !input.attachmentUrl) {
            throw new appError_1.AppError('El mensaje no puede estar vacío', 400);
        }
        return await chatRepository_1.chatRepository.createMessage(input);
    }
};
