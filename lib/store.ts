import { create } from 'zustand';
import { User, Chat, Message, Call } from './types';

interface AppState {
  user: User | null;
  chats: Chat[];
  activeChat: Chat | null;
  messages: { [chatId: string]: Message[] };
  onlineUsers: Set<string>;
  activeCall: Call | null;
  webrtcService: any | null;
  theme: 'light' | 'dark' | 'blue' | 'green' | 'purple' | 'pink' | 'orange';
  chatWallpaper: string;
  
  // Actions
  setUser: (user: User | null) => void;
  setChats: (chats: Chat[]) => void;
  setActiveChat: (chat: Chat | null) => void;
  addMessage: (chatId: string, message: Message) => void;
  updateMessage: (chatId: string, messageId: string, updates: Partial<Message>) => void;
  setMessages: (chatId: string, messages: Message[]) => void;
  setOnlineUsers: (users: Set<string>) => void;
  setActiveCall: (call: Call | null) => void;
  setWebrtcService: (service: any | null) => void;
  setTheme: (theme: 'light' | 'dark' | 'blue' | 'green' | 'purple' | 'pink' | 'orange') => void;
  setChatWallpaper: (wallpaper: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  chats: [],
  activeChat: null,
  messages: {},
  onlineUsers: new Set(),
  activeCall: null,
  webrtcService: null,
  theme: 'light',
  chatWallpaper: '',

  setUser: (user) => set({ user }),
  setChats: (chats) => set({ chats }),
  setActiveChat: (chat) => set({ activeChat: chat }),
  
  addMessage: (chatId, message) => set((state) => ({
    messages: {
      ...state.messages,
      [chatId]: [...(state.messages[chatId] || []), message]
    }
  })),
  
  updateMessage: (chatId, messageId, updates) => set((state) => ({
    messages: {
      ...state.messages,
      [chatId]: state.messages[chatId]?.map(msg => 
        msg.id === messageId ? { ...msg, ...updates } : msg
      ) || []
    }
  })),
  
  setMessages: (chatId, messages) => set((state) => ({
    messages: {
      ...state.messages,
      [chatId]: messages
    }
  })),
  
  setOnlineUsers: (users) => set({ onlineUsers: users }),
  setActiveCall: (call) => set({ activeCall: call }),
  setWebrtcService: (service) => set({ webrtcService: service }),
  setTheme: (theme) => set({ theme }),
  setChatWallpaper: (wallpaper) => set({ chatWallpaper: wallpaper }),
}));