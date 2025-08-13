'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { getChatMessages, markMessagesAsRead } from '@/lib/chat';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { ChatHeader } from './ChatHeader';
import { TypingIndicator } from './TypingIndicator';
import { MessageCircle } from 'lucide-react';

export function ChatWindow() {
  const { user, activeChat, messages, setMessages, chatWallpaper } = useAppStore();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!activeChat || !user) return;

    setLoading(true);
    
    const unsubscribe = getChatMessages(activeChat.id, (chatMessages) => {
      setMessages(activeChat.id, chatMessages);
      setLoading(false);
      
      // Mark messages as read
      markMessagesAsRead(activeChat.id, user.uid);
    });

    return () => unsubscribe();
  }, [activeChat, user, setMessages]);

  if (!activeChat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="bg-whatsapp-100 dark:bg-whatsapp-900/20 p-6 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-4">
            <MessageCircle size={48} className="text-whatsapp-500" />
          </div>
          <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">
            Welcome to WhatsApp Clone
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Select a chat to start messaging
          </p>
        </div>
      </div>
    );
  }

  const chatMessages = messages[activeChat.id] || [];

  const getWallpaperClass = (wallpaper: string) => {
    switch (wallpaper) {
      case 'pattern1': return 'bg-gradient-to-br from-blue-400/10 to-purple-600/10';
      case 'pattern2': return 'bg-gradient-to-br from-green-400/10 to-blue-600/10';
      case 'pattern3': return 'bg-gradient-to-br from-orange-400/10 to-pink-600/10';
      case 'pattern4': return 'bg-gradient-to-br from-green-600/10 to-teal-600/10';
      case 'pattern5': return 'bg-gradient-to-br from-blue-600/10 to-cyan-600/10';
      default: return '';
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900 h-full">
      <ChatHeader chat={activeChat} />
      
      <div className={`flex-1 flex flex-col min-h-0 relative ${getWallpaperClass(chatWallpaper)}`}>
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-whatsapp-500 mx-auto mb-2"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading messages...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-hidden">
              <MessageList messages={chatMessages} />
            </div>
            <div className="flex-shrink-0">
              <TypingIndicator chatId={activeChat.id} />
              <MessageInput chatId={activeChat.id} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}