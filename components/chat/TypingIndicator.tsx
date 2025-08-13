'use client';

import { useEffect, useState } from 'react';
import { ref, set, onValue } from 'firebase/database';
import { database } from '@/lib/firebase';
import { useAppStore } from '@/lib/store';

interface TypingIndicatorProps {
  chatId: string;
}

export function TypingIndicator({ chatId }: TypingIndicatorProps) {
  const { user } = useAppStore();
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;

    const typingRef = ref(database, `typing/${chatId}`);
    
    const unsubscribe = onValue(typingRef, (snapshot) => {
      if (snapshot.exists()) {
        const typingData = snapshot.val();
        const now = Date.now();
        const activeTypers: string[] = [];
        
        Object.keys(typingData).forEach(userId => {
          if (userId !== user.uid && typingData[userId] && (now - typingData[userId]) < 3000) {
            activeTypers.push(userId);
          }
        });
        
        setTypingUsers(activeTypers);
      } else {
        setTypingUsers([]);
      }
    });

    return () => unsubscribe();
  }, [chatId, user]);

  if (typingUsers.length === 0) return null;

  return (
    <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
      <div className="flex items-center space-x-2">
        <div className="typing-indicator flex space-x-1">
          <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
          <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
          <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
        </div>
        <span>
          {typingUsers.length === 1 
            ? 'Someone is typing...' 
            : `${typingUsers.length} people are typing...`
          }
        </span>
      </div>
    </div>
  );
}

export const setTyping = async (chatId: string, userId: string, isTyping: boolean) => {
  const typingRef = ref(database, `typing/${chatId}/${userId}`);
  
  if (isTyping) {
    await set(typingRef, Date.now());
  } else {
    await set(typingRef, null);
  }
};