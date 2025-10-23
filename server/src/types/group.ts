export interface StudyGroup {
  id: string;
  name: string;
  description?: string | null;
  coverImage?: string | null;
  createdBy: string;
  createdAt: Date;
}

export interface CreateGroupInput {
  name: string;
  description?: string;
  coverImage?: string;
  createdBy: string;
}

export interface GroupMember {
  groupId: string;
  userId: string;
  role: 'member' | 'mentor' | 'admin';
  joinedAt: Date;
}
