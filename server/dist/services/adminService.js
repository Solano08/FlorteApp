"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminService = void 0;
const userService_1 = require("./userService");
exports.adminService = {
    async listUsers() {
        return await userService_1.userService.listUsers();
    },
    async updateUserRole(actorId, input) {
        return await userService_1.userService.updateUser(actorId, {
            userId: input.userId,
            role: input.role
        });
    },
    async updateUserStatus(actorId, input) {
        return await userService_1.userService.updateUser(actorId, {
            userId: input.userId,
            isActive: input.isActive
        });
    },
    async updateUser(actorId, input) {
        return await userService_1.userService.updateUser(actorId, input);
    }
};
