"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.profileService = void 0;
const userRepository_1 = require("../repositories/userRepository");
const appError_1 = require("../utils/appError");
const toPublicProfile = (user) => ({
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    avatarUrl: user.avatarUrl ?? null,
    coverImageUrl: user.coverImageUrl ?? null,
    headline: user.headline ?? null,
    bio: user.bio,
    instagramUrl: user.instagramUrl ?? null,
    githubUrl: user.githubUrl ?? null,
    facebookUrl: user.facebookUrl ?? null,
    contactEmail: user.contactEmail ?? null,
    xUrl: user.xUrl ?? null,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
});
exports.profileService = {
    async getProfile(userId) {
        const user = await userRepository_1.userRepository.findById(userId);
        if (!user) {
            throw new appError_1.AppError('Usuario no encontrado', 404);
        }
        return toPublicProfile(user);
    },
    async updateProfile(input) {
        const updated = await userRepository_1.userRepository.updateProfile(input);
        return toPublicProfile(updated);
    },
    async updateAvatar(userId, avatarUrl) {
        const updated = await userRepository_1.userRepository.updateProfile({ userId, avatarUrl });
        return toPublicProfile(updated);
    },
    async updateCover(userId, coverImageUrl) {
        const updated = await userRepository_1.userRepository.updateProfile({ userId, coverImageUrl });
        return toPublicProfile(updated);
    }
};
