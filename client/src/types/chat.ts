/** Otro usuario en un chat directo (viene del API con datos de perfil). */
export interface ChatPeerPreview {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
}

export interface Chat {
  id: string;
  name?: string | null;
  isGroup: boolean;
  createdBy: string;
  createdAt: string;
  lastMessageAt?: string | null;
  lastMessage?: string | null;
  /** Solo chats 1 a 1: interlocutor con foto real desde el servidor. */
  peer?: ChatPeerPreview | null;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  attachmentUrl?: string | null;
  sharedPostId?: string | null;
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
  sharedPostId?: string | null;
}
