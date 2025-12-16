import { PublicProfile } from './user';

export type FriendRequestStatus = 'pending' | 'accepted' | 'rejected';

export interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: FriendRequestStatus;
  createdAt: Date;
  updatedAt: Date;
  sender?: PublicProfile;
  receiver?: PublicProfile;
}

export interface Friendship {
  userId: string;
  friendId: string;
  createdAt: Date;
}




