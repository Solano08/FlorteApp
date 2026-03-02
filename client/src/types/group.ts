export interface Group {
  id: string;
  name: string;
  description?: string | null;
  coverImage?: string | null;
  iconUrl?: string | null;
  createdBy: string;
  createdAt: string;
  memberCount?: number;
  onlineCount?: number;
}

export interface CreateGroupPayload {
  name: string;
  description?: string;
  coverImage?: string;
  iconUrl?: string;
}
