export interface Group {
  id: string;
  name: string;
  description?: string | null;
  coverImage?: string | null;
  createdBy: string;
  createdAt: string;
}

export interface CreateGroupPayload {
  name: string;
  description?: string;
  coverImage?: string;
}
