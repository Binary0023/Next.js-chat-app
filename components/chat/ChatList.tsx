'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Chat } from '@/lib/types';
import { Avatar } from '@/components/ui/Avatar';
import { ref, get } from 'firebase/database';
import { database } from '@/lib/firebase';
import { formatDistanceToNow } from 'date-fns';
import { Check, CheckCheck } from 'lucide-react';

interface ChatListProps {
  chats: Chat[];
}

export function ChatList({ chats }: ChatListProps) {
  const { user, activeChat, setActiveChat, onlineUsers } = useAppStore();
  const [userNames, setUserNames] = useState<{[key: string]: string}>({});

  useEffect(() => {
    // Fetch user names for private chats
    const fetchUserNames = async () => {
      const names: {[key: string]: string} = {};
      
      for (const chat of chats) {
        if (chat.type === 'private') {
          const otherParticipant = chat.participants.find(id => id !== user?.uid);
          if (otherParticipant && !names[otherParticipant]) {
            try {
              const userRef = ref(database, `users/${otherParticipant}`);
              const snapshot = await get(userRef);
              if (snapshot.exists()) {
                const userData = snapshot.val();
                names[otherParticipant] = userData.displayName || userData.username || 'Unknown User';
              }
            } catch (error) {
              console.error('Error fetching user name:', error);
              names[otherParticipant] = 'Unknown User';
            }
          }
        }
      }
      
      setUserNames(names);
    };

    if (chats.length > 0) {
      fetchUserNames();
    }
  }, [chats, user?.uid]);

  const getChatName = (chat: Chat) => {
    if (chat.type === 'group') {
      return chat.groupName || 'Group Chat';
    }
    
    // For private chats, get the other participant's name
    const otherParticipant = chat.participants.find(id => id !== user?.uid);
    return otherParticipant ? (userNames[otherParticipant] || 'Loading...') : 'Unknown User';
  };

  const getChatAvatar = (chat: Chat) => {
    if (chat.type === 'group') {
      return chat.groupPhoto;
    }
    
    // For private chats, we'd need to get the other participant's avatar
    return undefined;
  };

  const isUserOnline = (chat: Chat) => {
    if (chat.type === 'group') return false;
    
    const otherParticipant = chat.participants.find(id => id !== user?.uid);
    return otherParticipant ? onlineUsers.has(otherParticipant) : false;
  };

  const getUnreadCount = (chat: Chat) => {
    return user ? chat.unreadCount[user.uid] || 0 : 0;
  };

  const getMessageStatus = (chat: Chat) => {
    if (!chat.lastMessage || !user) return null;
    
    if (chat.lastMessage.senderId !== user.uid) return null;
    
    const readByCount = Object.keys(chat.lastMessage.readBy || {}).length;
    const totalParticipants = chat.participants.length;
    
    if (readByCount === 1) {
      return <Check size={16} className="text-gray-400" />;
    } else if (readByCount === totalParticipants) {
      return <CheckCheck size={16} className="text-blue-500" />;
    } else {
      return <CheckCheck size={16} className="text-gray-400" />;
    }
  };

  if (chats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <p className="text-lg font-medium">No chats yet</p>
          <p className="text-sm">Start a new conversation</p>
        </div>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      {chats.map((chat) => {
        const unreadCount = getUnreadCount(chat);
        const isActive = activeChat?.id === chat.id;
        
        return (
          <div
            key={chat.id}
            onClick={() => setActiveChat(chat)}
            className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
              isActive ? 'bg-whatsapp-50 dark:bg-whatsapp-900/20' : ''
            }`}
          >
            <div className="flex items-center space-x-3">
              <Avatar
                src={getChatAvatar(chat)}
                alt={getChatName(chat)}
                size="md"
                online={isUserOnline(chat)}
              />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {getChatName(chat)}
                  </h3>
                  <div className="flex items-center space-x-1">
                    {getMessageStatus(chat)}
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {chat.lastMessage && formatDistanceToNow(chat.lastMessage.timestamp, { addSuffix: true })}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-1">
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {chat.lastMessage ? (
                      chat.lastMessage.type === 'text' 
                        ? chat.lastMessage.content 
                        : chat.lastMessage.type === 'image' 
                          ? '📷 Photo' 
                          : chat.lastMessage.type === 'video' 
                            ? '🎥 Video' 
                            : chat.lastMessage.type === 'audio' 
                              ? '🎵 Audio' 
                              : '📎 Document'
                    ) : 'No messages yet'}
                  </p>
                  
                  {unreadCount > 0 && (
                    <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-whatsapp-500 rounded-full">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}