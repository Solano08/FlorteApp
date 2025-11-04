export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export type UserRole = 'admin' | 'instructor' | 'apprentice';

export interface AuthUser {
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
}

export interface AuthResponse {
  success: boolean;
  user: AuthUser;
  tokens: AuthTokens;
}
