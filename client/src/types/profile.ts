import { AuthUser } from './auth';

export interface Profile extends AuthUser {
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  headline?: string | null;
  bio?: string | null;
}
