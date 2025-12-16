export interface StudyGroup {
  id: string;
  name: string;
  description?: string | null;
  coverImage?: string | null;
  iconUrl?: string | null;
  createdBy: string;
  createdAt: Date;
  memberCount?: number;
}

export interface CreateGroupInput {
  name: string;
  description?: string;
  coverImage?: string;
  iconUrl?: string;
  createdBy: string;
}

export interface GroupMember {
  groupId: string;
  userId: string;
  role: 'member' | 'mentor' | 'admin';
  joinedAt: Date;
}
