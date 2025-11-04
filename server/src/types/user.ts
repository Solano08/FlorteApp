export type UserRole = 'admin' | 'instructor' | 'apprentice';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  avatarUrl?: string | null;
  coverImageUrl?: string | null;
  headline?: string | null;
  bio?: string | null;
  instagramUrl?: string | null;
  githubUrl?: string | null;
  facebookUrl?: string | null;
  contactEmail?: string | null;
  xUrl?: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface UpdateProfileInput {
  userId: string;
  firstName?: string;
  lastName?: string;
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

export interface PublicProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string | null;
  coverImageUrl?: string | null;
  headline?: string | null;
  bio?: string | null;
  instagramUrl?: string | null;
  githubUrl?: string | null;
  facebookUrl?: string | null;
  contactEmail?: string | null;
  xUrl?: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateUserRoleInput {
  userId: string;
  role: UserRole;
}

export interface UpdateUserStatusInput {
  userId: string;
  isActive: boolean;
}

export interface UpdateUserInput {
  userId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  passwordHash?: string;
  role?: UserRole;
  isActive?: boolean;
  coverImageUrl?: string | null;
}

