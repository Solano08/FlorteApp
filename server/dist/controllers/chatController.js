"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatController = void 0;
const chatService_1 = require("../services/chatService");
const chatValidators_1 = require("../validators/chatValidators");
const appError_1 = require("../utils/appError");
exports.chatController = {
    createChat: async (req, res) => {
        const userId = req.user?.userId;
        if (!userId)
            throw new appError_1.AppError('Autenticación requerida', 401);
        const data = chatValidators_1.createChatSchema.parse(req.body);
        const chat = await chatService_1.chatService.createChat({
            ...data,
            createdBy: userId
        });
        res.status(201).json({ success: true, chat });
    },
    listChats: async (req, res) => {
        const userId = req.user?.userId;
        if (!userId)
            throw new appError_1.AppError('Autenticación requerida', 401);
        const chats = await chatService_1.chatService.listUserChats(userId);
        res.json({ success: true, chats });
    },
    getMessages: async (req, res) => {
        const userId = req.user?.userId;
        if (!userId)
            throw new appError_1.AppError('Autenticación requerida', 401);
        const { chatId } = req.params;
        const messages = await chatService_1.chatService.getMessages(chatId, userId);
        res.json({ success: true, messages });
    },
    sendMessage: async (req, res) => {
        const userId = req.user?.userId;
        if (!userId)
            throw new appError_1.AppError('Autenticación requerida', 401);
        const { chatId } = req.params;
        const data = chatValidators_1.sendMessageSchema.parse(req.body);
        const message = await chatService_1.chatService.sendMessage({
            chatId,
            senderId: userId,
            content: data.content ?? '',
            attachmentUrl: data.attachmentUrl
        });
        res.status(201).json({ success: true, message });
    }
};
