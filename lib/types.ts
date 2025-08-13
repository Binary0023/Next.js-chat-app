export interface User {
  uid: string;
  email: string;
  displayName: string;
  username: string;
  photoURL?: string;
  phoneNumber?: string;
  bio?: string;
  isOnline: boolean;
  lastSeen: number;
  settings: {
    theme: 'light' | 'dark' | 'blue' | 'green' | 'purple' | 'pink' | 'orange';
    chatWallpaper: string;
    fontSize: 'small' | 'medium' | 'large';
    notifications: boolean;
    autoDownload: boolean;
    showLastSeen: boolean;
    showProfilePicture: boolean;
    showStatus: boolean;
    soundEnabled: boolean;
    vibrationEnabled: boolean;
    readReceipts: boolean;
  };
}

export interface Message {
  id: string;
  senderId: string;
  receiverId?: string;
  groupId?: string;
  content: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'document';
  timestamp: number;
  edited?: boolean;
  editedAt?: number;
  deleted?: boolean;
  deletedAt?: number;
  reactions?: { [userId: string]: string };
  readBy?: { [userId: string]: number };
  starred?: boolean;
  mediaUrl?: string;
  mediaName?: string;
  mediaSize?: number;
}

export interface Chat {
  id: string;
  type: 'private' | 'group';
  participants: string[];
  lastMessage?: Message;
  lastActivity: number;
  unreadCount: { [userId: string]: number };
  groupName?: string;
  groupDescription?: string;
  groupPhoto?: string;
  adminIds?: string[];
  createdBy?: string;
  createdAt?: number;
}

export interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'declined';
  timestamp: number;
}

export interface Call {
  id: string;
  callerId: string;
  receiverId: string;
  type: 'audio' | 'video';
  status: 'ringing' | 'accepted' | 'declined' | 'ended' | 'missed' | 'connected';
  startTime: number;
  endTime?: number;
  duration?: number;
}

export interface Status {
  id: string;
  userId: string;
  content: string;
  type: 'text' | 'image' | 'video';
  mediaUrl?: string;
  timestamp: number;
  expiresAt: number;
  viewedBy: string[];
}