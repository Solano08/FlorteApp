export interface Chat {
  id: string;
  name?: string | null;
  isGroup: boolean;
  createdBy: string;
  createdAt: string;
  lastMessageAt?: string | null;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  attachmentUrl?: string | null;
  createdAt: string;
}

export interface CreateChatPayload {
  name?: string;
  isGroup?: boolean;
  memberIds: string[];
}

export interface SendMessagePayload {
  content?: string;
  attachmentUrl?: string;
}
