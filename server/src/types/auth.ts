import { UserRole } from './user';

export interface TokenPayload {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

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

export interface AuthResult {
  user: AuthUser;
  tokens: AuthTokens;
}
