'use client';

import { useEffect, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import { Message } from '@/lib/types';
import { MessageBubble } from './MessageBubble';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';

interface MessageListProps {
  messages: Message[];
}

export function MessageList({ messages }: MessageListProps) {
  const { user } = useAppStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getDateLabel = (timestamp: number) => {
    const date = new Date(timestamp);

    if (isToday(date)) {
      return 'Today';
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'MMM dd, yyyy');
    }
  };

  const shouldShowDateSeparator = (currentMessage: Message, previousMessage?: Message) => {
    if (!previousMessage) return true;

    const currentDate = new Date(currentMessage.timestamp);
    const previousDate = new Date(previousMessage.timestamp);

    return currentDate.toDateString() !== previousDate.toDateString();
  };

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <p className="text-lg font-medium">No messages yet</p>
          <p className="text-sm">Send a message to start the conversation</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-2">
      {messages.map((message, index) => {
        const previousMessage = index > 0 ? messages[index - 1] : undefined;
        const showDateSeparator = shouldShowDateSeparator(message, previousMessage);
        const isOwn = message.senderId === user?.uid;

        return (
          <div key={message.id}>
            {showDateSeparator && (
              <div className="flex justify-center my-4">
                <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs px-3 py-1 rounded-full">
                  {getDateLabel(message.timestamp)}
                </span>
              </div>
            )}

            <MessageBubble
              message={message}
              isOwn={isOwn}
              showAvatar={!isOwn && (
                index === messages.length - 1 ||
                messages[index + 1]?.senderId !== message.senderId
              )}
            />
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
}