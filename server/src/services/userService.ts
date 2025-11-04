import { userRepository } from '../repositories/userRepository';
import { sessionRepository } from '../repositories/sessionRepository';
import { AppError } from '../utils/appError';
import { hashPassword } from '../utils/password';
import { PublicProfile, User, UserRole } from '../types/user';

const toPublicProfile = (user: User): PublicProfile => ({
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

const ensureAtLeastOneAdminRemains = async (excludingUserId?: string): Promise<void> => {
  const users = await userRepository.listUsers();
  const admins = users.filter((user) => user.role === 'admin' && user.isActive && user.id !== excludingUserId);
  if (admins.length === 0) {
    throw new AppError('Debe existir al menos un administrador activo', 400);
  }
};

const ensureEmailIsAvailable = async (email: string, currentUserId?: string): Promise<void> => {
  const existing = await userRepository.findByEmail(email);
  if (existing && existing.id !== currentUserId) {
    throw new AppError('El correo ya esta registrado', 409);
  }
};

const requireActor = (actorId?: string): string => {
  if (!actorId) {
    throw new AppError('Autenticacion requerida', 401);
  }
  return actorId;
};

export const userService = {
  async listUsers(): Promise<PublicProfile[]> {
    const users = await userRepository.listUsers();
    return users.map(toPublicProfile);
  },

  async getUserById(userId: string): Promise<PublicProfile> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError('Usuario no encontrado', 404);
    }
    return toPublicProfile(user);
  },

  async createUser(input: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role?: UserRole;
    isActive?: boolean;
  }): Promise<PublicProfile> {
    await ensureEmailIsAvailable(input.email);
    if (!input.password || input.password.length < 6) {
      throw new AppError('La contrasena debe tener al menos 6 caracteres', 400);
    }

    const passwordHash = await hashPassword(input.password);
    const user = await userRepository.createUser({
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      passwordHash,
      role: input.role,
      isActive: input.isActive
    });

    if (!user.isActive) {
      await sessionRepository.deleteSessionsByUser(user.id);
    }

    return toPublicProfile(user);
  },

  async updateUser(
    actorId: string | undefined,
    input: {
      userId: string;
      firstName?: string;
      lastName?: string;
      email?: string;
      password?: string;
      role?: UserRole;
      isActive?: boolean;
      headline?: string | null;
      bio?: string | null;
      avatarUrl?: string | null;
      coverImageUrl?: string | null;
      instagramUrl?: string | null;
      githubUrl?: string | null;
      facebookUrl?: string | null;
      contactEmail?: string | null;
      xUrl?: string | null;
    }
  ): Promise<PublicProfile> {
    const actor = requireActor(actorId);
    const existing = await userRepository.findById(input.userId);
    if (!existing) {
      throw new AppError('Usuario no encontrado', 404);
    }

    if (input.email && input.email !== existing.email) {
      await ensureEmailIsAvailable(input.email, existing.id);
    }

    if (input.role && input.role !== existing.role) {
      if (existing.role === 'admin' && input.role !== 'admin') {
        await ensureAtLeastOneAdminRemains(existing.id);
      }
      if (actor === existing.id && input.role !== 'admin') {
        throw new AppError('No puedes cambiar tu rol a un nivel inferior mientras estas conectado.', 400);
      }
    }

    if (input.isActive !== undefined && input.isActive !== existing.isActive) {
      if (actor === existing.id) {
        throw new AppError('No puedes cambiar el estado de tu propia cuenta.', 400);
      }
      if (existing.role === 'admin' && input.isActive === false) {
        await ensureAtLeastOneAdminRemains(existing.id);
      }
    }

    const updatePayload: {
      userId: string;
      firstName?: string;
      lastName?: string;
      email?: string;
      passwordHash?: string;
      role?: UserRole;
      isActive?: boolean;
    } = {
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
        throw new AppError('La contrasena debe tener al menos 6 caracteres', 400);
      }
      updatePayload.passwordHash = input.password ? await hashPassword(input.password) : undefined;
      shouldUpdateUser = true;
    }

    const profilePayload: {
      userId: string;
      headline?: string | null;
      bio?: string | null;
      avatarUrl?: string | null;
      coverImageUrl?: string | null;
      instagramUrl?: string | null;
      githubUrl?: string | null;
      facebookUrl?: string | null;
      contactEmail?: string | null;
      xUrl?: string | null;
    } = {
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
      updated = await userRepository.updateUser(updatePayload);
    }

    if (shouldUpdateProfile) {
      updated = await userRepository.updateProfile(profilePayload);
    }

    if (input.isActive !== undefined && input.isActive === false && existing.isActive !== false) {
      await sessionRepository.deleteSessionsByUser(updated.id);
    }

    return toPublicProfile(updated);
  },

  async deleteUser(actorId: string | undefined, userId: string): Promise<PublicProfile> {
    return await this.updateUser(actorId, { userId, isActive: false });
  },

  async restoreUser(actorId: string | undefined, userId: string): Promise<PublicProfile> {
    requireActor(actorId);
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError('Usuario no encontrado', 404);
    }
    if (user.isActive) {
      return toPublicProfile(user);
    }
    const restored = await userRepository.updateUser({ userId, isActive: true });
    return toPublicProfile(restored);
  }
};

