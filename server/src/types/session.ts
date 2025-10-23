export interface Session {
  id: string;
  userId: string;
  refreshTokenHash: string;
  device?: string | null;
  ipAddress?: string | null;
  expiresAt: Date;
  createdAt: Date;
}

export interface CreateSessionInput {
  userId: string;
  refreshTokenHash: string;
  device?: string;
  ipAddress?: string;
  expiresAt: Date;
}
