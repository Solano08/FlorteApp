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
  coverImageUrl?: string | null;
  instagramUrl?: string | null;
  githubUrl?: string | null;
  facebookUrl?: string | null;
  contactEmail?: string | null;
  xUrl?: string | null;
}
