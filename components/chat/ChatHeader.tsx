'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { Chat } from '@/lib/types';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { WebRTCService } from '@/lib/webrtc';
import { ref, get } from 'firebase/database';
import { database } from '@/lib/firebase';
import { Phone, Video, MoreVertical, Search, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

interface ChatHeaderProps {
  chat: Chat;
}

export function ChatHeader({ chat }: ChatHeaderProps) {
  const { user, onlineUsers, setActiveCall, setActiveChat, setWebrtcService } = useAppStore();
  const [showDropdown, setShowDropdown] = useState(false);
  const [chatName, setChatName] = useState('Loading...');

  useEffect(() => {
    const fetchChatName = async () => {
      if (chat.type === 'group') {
        setChatName(chat.groupName || 'Group Chat');
        return;
      }
      
      const otherParticipant = chat.participants.find(id => id !== user?.uid);
      if (otherParticipant) {
        try {
          const userRef = ref(database, `users/${otherParticipant}`);
          const snapshot = await get(userRef);
          if (snapshot.exists()) {
            const userData = snapshot.val();
            setChatName(userData.displayName || userData.username || 'Unknown User');
          } else {
            setChatName('Unknown User');
          }
        } catch (error) {
          console.error('Error fetching user name:', error);
          setChatName('Unknown User');
        }
      } else {
        setChatName('Unknown User');
      }
    };

    fetchChatName();
  }, [chat, user?.uid]);

  const getChatName = () => {
    return chatName;
  };

  const getChatStatus = () => {
    if (chat.type === 'group') {
      return `${chat.participants.length} members`;
    }
    
    const otherParticipant = chat.participants.find(id => id !== user?.uid);
    if (otherParticipant && onlineUsers.has(otherParticipant)) {
      return 'Online';
    }
    
    return 'Last seen recently';
  };

  const isUserOnline = () => {
    if (chat.type === 'group') return false;
    
    const otherParticipant = chat.participants.find(id => id !== user?.uid);
    return otherParticipant ? onlineUsers.has(otherParticipant) : false;
  };

  const handleCall = async (type: 'audio' | 'video') => {
    if (!user || chat.type === 'group') {
      toast.error('Calls are only available for private chats');
      return;
    }

    const otherParticipant = chat.participants.find(id => id !== user.uid);
    if (!otherParticipant) {
      toast.error('Cannot find the other participant');
      return;
    }

    // Check WebRTC support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast.error('Your browser does not support video calls');
      return;
    }

    try {
      // Request media permissions first
      await navigator.mediaDevices.getUserMedia({
        video: type === 'video',
        audio: true,
      });

      const webrtc = new WebRTCService(user.uid);
      const callId = await webrtc.initializeCall(otherParticipant, type);
      
      // Store the WebRTC service in the store
      setWebrtcService(webrtc);
      
      setActiveCall({
        id: callId,
        callerId: user.uid,
        receiverId: otherParticipant,
        type,
        status: 'ringing',
        startTime: Date.now(),
      });
      
      toast.success(`${type === 'audio' ? 'Audio' : 'Video'} call started`);
    } catch (error: any) {
      if (error.name === 'NotAllowedError') {
        toast.error('Camera/microphone permission denied');
      } else if (error.name === 'NotFoundError') {
        toast.error('Camera/microphone not found');
      } else {
        toast.error('Failed to start call');
      }
      console.error('Call error:', error);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {/* Mobile back button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveChat(null)}
            className="md:hidden p-2"
          >
            <ArrowLeft size={20} />
          </Button>
          
          <Avatar
            src={chat.groupPhoto}
            alt={getChatName()}
            size="md"
            online={isUserOnline()}
          />
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">
              {getChatName()}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {getChatStatus()}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {chat.type === 'private' && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCall('audio')}
                className="p-2"
              >
                <Phone size={20} />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCall('video')}
                className="p-2"
              >
                <Video size={20} />
              </Button>
            </>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            className="p-2"
          >
            <Search size={20} />
          </Button>

          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDropdown(!showDropdown)}
              className="p-2"
            >
              <MoreVertical size={20} />
            </Button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg z-10 border border-gray-200 dark:border-gray-600">
                <div className="py-1">
                  <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600">
                    View Profile
                  </button>
                  <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600">
                    Clear Chat
                  </button>
                  {chat.type === 'group' && (
                    <button className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-600">
                      Leave Group
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}