export interface Story {
  id: string;
  userId: string;
  mediaUrl: string;
  createdAt: Date;
}

export interface StoryWithUser extends Story {
  userName: string;
  userAvatarUrl: string | null;
}
