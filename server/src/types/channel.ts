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

export interface ChannelPollSummary {
  tallies: number[];
  viewerVoteIndex: number | null;
  totalVotes: number;
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
  isPinned?: boolean;
  pinnedAt?: Date | null;
  pinnedBy?: string | null;
  viewerStarred?: boolean;
  threadRootId?: string | null;
  threadTitle?: string | null;
  poll?: ChannelPollSummary;
}

export interface CreateChannelMessageInput {
  channelId: string;
  senderId: string;
  content?: string;
  attachmentUrl?: string | null;
  threadRootId?: string | null;
  threadTitle?: string | null;
}

export interface ChannelMessageReport {
  id: string;
  messageId: string;
  reporterId: string;
  reason: string;
  details?: string | null;
  status: 'pending' | 'reviewed';
  createdAt: Date;
  resolvedAt?: Date | null;
  message?: ChannelMessage;
  reporter?: { id: string; firstName: string; lastName: string; avatarUrl?: string | null };
}

