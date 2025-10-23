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
  headline?: string | null;
  bio?: string | null;
  role: UserRole;
  isActive: boolean;
}

export interface AuthResponse {
  success: boolean;
  user: AuthUser;
  tokens: AuthTokens;
}
