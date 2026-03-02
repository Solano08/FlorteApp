export interface Channel {
  id: string;
  communityId: string;
  name: string;
  description?: string | null;
  type: 'text' | 'voice';
  position: number;
  createdBy: string;
  createdAt: string;
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
  createdAt: string;
}

export interface CreateChannelPayload {
  communityId: string;
  name: string;
  description?: string;
  type?: 'text' | 'voice';
  position?: number;
}

export interface CreateChannelMessagePayload {
  content?: string;
  attachmentUrl?: string;
}

