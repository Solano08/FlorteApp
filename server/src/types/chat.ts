/** Otro participante en un chat 1 a 1 (desde BD, para foto y nombre). */
export interface ChatPeerPreview {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}

export interface Chat {
  id: string;
  name?: string | null;
  isGroup: boolean;
  createdBy: string;
  createdAt: Date;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  attachmentUrl?: string | null;
  sharedPostId?: string | null;
  createdAt: Date;
}

export interface CreateChatInput {
  name?: string;
  isGroup: boolean;
  createdBy: string;
  memberIds: string[];
}

export interface CreateMessageInput {
  chatId: string;
  senderId: string;
  content: string;
  attachmentUrl?: string;
  sharedPostId?: string | null;
}
