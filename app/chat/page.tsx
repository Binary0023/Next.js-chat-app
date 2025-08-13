'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { getUserChats } from '@/lib/chat';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { CallModal } from '@/components/call/CallModal';
import { IncomingCallModal } from '@/components/call/IncomingCallModal';
import { listenForIncomingCalls } from '@/lib/webrtc';
import { Call } from '@/lib/types';

export default function ChatPage() {
  const { user, setChats, activeCall, activeChat } = useAppStore();
  const [incomingCall, setIncomingCall] = useState<Call | null>(null);

  useEffect(() => {
    if (!user) return;

    // Listen for user's chats
    const unsubscribeChats = getUserChats(user.uid, (chats) => {
      setChats(chats);
    });

    // Listen for incoming calls
    const unsubscribeCalls = listenForIncomingCalls(user.uid, (call) => {
      setIncomingCall(call);
    });

    return () => {
      unsubscribeChats();
      unsubscribeCalls();
    };
  }, [user, setChats]);

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="h-screen flex bg-gray-100 dark:bg-gray-900">
      {/* Mobile: Show sidebar or chat window based on activeChat */}
      <div className="md:hidden w-full">
        {!activeChat ? <ChatSidebar /> : <ChatWindow />}
      </div>
      
      {/* Desktop: Show both sidebar and chat window */}
      <div className="hidden md:flex w-full">
        <ChatSidebar />
        <ChatWindow />
      </div>
      
      {activeCall && <CallModal />}
      {incomingCall && (
        <IncomingCallModal
          call={incomingCall}
          onClose={() => setIncomingCall(null)}
        />
      )}
    </div>
  );
}