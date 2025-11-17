"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userService = void 0;
const userRepository_1 = require("../repositories/userRepository");
const sessionRepository_1 = require("../repositories/sessionRepository");
const appError_1 = require("../utils/appError");
const password_1 = require("../utils/password");
const toPublicProfile = (user) => ({
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    avatarUrl: user.avatarUrl ?? null,
    coverImageUrl: user.coverImageUrl ?? null,
    headline: user.headline ?? null,
    bio: user.bio ?? null,
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
const ensureAtLeastOneAdminRemains = async (excludingUserId) => {
    const users = await userRepository_1.userRepository.listUsers();
    const admins = users.filter((user) => user.role === 'admin' && user.isActive && user.id !== excludingUserId);
    if (admins.length === 0) {
        throw new appError_1.AppError('Debe existir al menos un administrador activo', 400);
    }
};
const ensureEmailIsAvailable = async (email, currentUserId) => {
    const existing = await userRepository_1.userRepository.findByEmail(email);
    if (existing && existing.id !== currentUserId) {
        throw new appError_1.AppError('El correo ya esta registrado', 409);
    }
};
const requireActor = (actorId) => {
    if (!actorId) {
        throw new appError_1.AppError('Autenticacion requerida', 401);
    }
    return actorId;
};
exports.userService = {
    async listUsers() {
        const users = await userRepository_1.userRepository.listUsers();
        return users.map(toPublicProfile);
    },
    async getUserById(userId) {
        const user = await userRepository_1.userRepository.findById(userId);
        if (!user) {
            throw new appError_1.AppError('Usuario no encontrado', 404);
        }
        return toPublicProfile(user);
    },
    async createUser(input) {
        await ensureEmailIsAvailable(input.email);
        if (!input.password || input.password.length < 6) {
            throw new appError_1.AppError('La contrasena debe tener al menos 6 caracteres', 400);
        }
        const passwordHash = await (0, password_1.hashPassword)(input.password);
        const user = await userRepository_1.userRepository.createUser({
            firstName: input.firstName,
            lastName: input.lastName,
            email: input.email,
            passwordHash,
            role: input.role,
            isActive: input.isActive
        });
        if (!user.isActive) {
            await sessionRepository_1.sessionRepository.deleteSessionsByUser(user.id);
        }
        return toPublicProfile(user);
    },
    async updateUser(actorId, input) {
        const actor = requireActor(actorId);
        const existing = await userRepository_1.userRepository.findById(input.userId);
        if (!existing) {
            throw new appError_1.AppError('Usuario no encontrado', 404);
        }
        if (input.email && input.email !== existing.email) {
            await ensureEmailIsAvailable(input.email, existing.id);
        }
        if (input.role && input.role !== existing.role) {
            if (existing.role === 'admin' && input.role !== 'admin') {
                await ensureAtLeastOneAdminRemains(existing.id);
            }
            if (actor === existing.id && input.role !== 'admin') {
                throw new appError_1.AppError('No puedes cambiar tu rol a un nivel inferior mientras estas conectado.', 400);
            }
        }
        if (input.isActive !== undefined && input.isActive !== existing.isActive) {
            if (actor === existing.id) {
                throw new appError_1.AppError('No puedes cambiar el estado de tu propia cuenta.', 400);
            }
            if (existing.role === 'admin' && input.isActive === false) {
                await ensureAtLeastOneAdminRemains(existing.id);
            }
        }
        const updatePayload = {
            userId: input.userId
        };
        let shouldUpdateUser = false;
        if (input.firstName !== undefined) {
            updatePayload.firstName = input.firstName;
            shouldUpdateUser = true;
        }
        if (input.lastName !== undefined) {
            updatePayload.lastName = input.lastName;
            shouldUpdateUser = true;
        }
        if (input.email !== undefined) {
            updatePayload.email = input.email;
            shouldUpdateUser = true;
        }
        if (input.role !== undefined) {
            updatePayload.role = input.role;
            shouldUpdateUser = true;
        }
        if (input.isActive !== undefined) {
            updatePayload.isActive = input.isActive;
            shouldUpdateUser = true;
        }
        if (input.password !== undefined) {
            if (input.password && input.password.length < 6) {
                throw new appError_1.AppError('La contrasena debe tener al menos 6 caracteres', 400);
            }
            updatePayload.passwordHash = input.password ? await (0, password_1.hashPassword)(input.password) : undefined;
            shouldUpdateUser = true;
        }
        const profilePayload = {
            userId: input.userId
        };
        let shouldUpdateProfile = false;
        if (input.headline !== undefined) {
            profilePayload.headline = input.headline;
            shouldUpdateProfile = true;
        }
        if (input.bio !== undefined) {
            profilePayload.bio = input.bio;
            shouldUpdateProfile = true;
        }
        if (input.avatarUrl !== undefined) {
            profilePayload.avatarUrl = input.avatarUrl;
            shouldUpdateProfile = true;
        }
        if (input.coverImageUrl !== undefined) {
            profilePayload.coverImageUrl = input.coverImageUrl;
            shouldUpdateProfile = true;
        }
        if (input.instagramUrl !== undefined) {
            profilePayload.instagramUrl = input.instagramUrl;
            shouldUpdateProfile = true;
        }
        if (input.githubUrl !== undefined) {
            profilePayload.githubUrl = input.githubUrl;
            shouldUpdateProfile = true;
        }
        if (input.facebookUrl !== undefined) {
            profilePayload.facebookUrl = input.facebookUrl;
            shouldUpdateProfile = true;
        }
        if (input.contactEmail !== undefined) {
            profilePayload.contactEmail = input.contactEmail;
            shouldUpdateProfile = true;
        }
        if (input.xUrl !== undefined) {
            profilePayload.xUrl = input.xUrl;
            shouldUpdateProfile = true;
        }
        let updated = existing;
        if (shouldUpdateUser) {
            updated = await userRepository_1.userRepository.updateUser(updatePayload);
        }
        if (shouldUpdateProfile) {
            updated = await userRepository_1.userRepository.updateProfile(profilePayload);
        }
        if (input.isActive !== undefined && input.isActive === false && existing.isActive !== false) {
            await sessionRepository_1.sessionRepository.deleteSessionsByUser(updated.id);
        }
        return toPublicProfile(updated);
    },
    async deleteUser(actorId, userId) {
        return await this.updateUser(actorId, { userId, isActive: false });
    },
    async restoreUser(actorId, userId) {
        requireActor(actorId);
        const user = await userRepository_1.userRepository.findById(userId);
        if (!user) {
            throw new appError_1.AppError('Usuario no encontrado', 404);
        }
        if (user.isActive) {
            return toPublicProfile(user);
        }
        const restored = await userRepository_1.userRepository.updateUser({ userId, isActive: true });
        return toPublicProfile(restored);
    }
};
