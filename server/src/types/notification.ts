export interface Notification {
  id: string;
  userId: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: Date;
}



