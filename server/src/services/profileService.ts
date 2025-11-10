import { userRepository } from '../repositories/userRepository';
import { AppError } from '../utils/appError';
import { PublicProfile, UpdateProfileInput, User } from '../types/user';

const toPublicProfile = (user: User): PublicProfile => ({
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

export const profileService = {
  async getProfile(userId: string): Promise<PublicProfile> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError('Usuario no encontrado', 404);
    }
    return toPublicProfile(user);
  },

  async updateProfile(input: UpdateProfileInput): Promise<PublicProfile> {
    const updated = await userRepository.updateProfile(input);
    return toPublicProfile(updated);
  },

  async updateAvatar(userId: string, avatarUrl: string | null): Promise<PublicProfile> {
    const updated = await userRepository.updateProfile({ userId, avatarUrl });
    return toPublicProfile(updated);
  },

  async updateCover(userId: string, coverImageUrl: string | null): Promise<PublicProfile> {
    const updated = await userRepository.updateProfile({ userId, coverImageUrl });
    return toPublicProfile(updated);
  }
};
