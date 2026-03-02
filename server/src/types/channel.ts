export interface Channel {
  id: string;
  communityId: string;
  name: string;
  description?: string | null;
  type: 'text' | 'voice';
  position: number;
  createdBy: string;
  createdAt: Date;
}

export interface CreateChannelInput {
  communityId: string;
  name: string;
  description?: string;
  type?: 'text' | 'voice';
  position?: number;
  createdBy: string;
}

export interface ChannelMessage {
  id: string;
  channelId: string;
  senderId: string;
  sender?: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string | null;
  };
  content: string;
  attachmentUrl?: string | null;
  createdAt: Date;
}

export interface CreateChannelMessageInput {
  channelId: string;
  senderId: string;
  content?: string;
  attachmentUrl?: string;
}

