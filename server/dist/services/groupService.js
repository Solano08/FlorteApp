"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.groupService = void 0;
const groupRepository_1 = require("../repositories/groupRepository");
const appError_1 = require("../utils/appError");
exports.groupService = {
    async createGroup(input) {
        if (!input.name.trim()) {
            throw new appError_1.AppError('El nombre del grupo es obligatorio', 400);
        }
        return await groupRepository_1.groupRepository.createGroup(input);
    },
    async listGroups() {
        return await groupRepository_1.groupRepository.listGroups();
    },
    async listUserGroups(userId) {
        return await groupRepository_1.groupRepository.listUserGroups(userId);
    },
    async addMember(groupId, userId) {
        await groupRepository_1.groupRepository.addMember(groupId, userId);
    },
    async getGroup(groupId) {
        return await groupRepository_1.groupRepository.findById(groupId);
    }
};
