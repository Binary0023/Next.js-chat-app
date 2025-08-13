'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { signOutUser } from '@/lib/auth';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ChatList } from './ChatList';
import { NewChatModal } from './NewChatModal';
import { ProfileModal } from './ProfileModal';
import { SettingsModal } from './SettingsModal';
import { StatusModal } from '../status/StatusModal';
import { StatusView } from '../status/StatusView';
import { 
  Search, 
  MoreVertical, 
  Settings, 
  User, 
  LogOut,
  Plus,
  Moon,
  Sun
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

export function ChatSidebar() {
  const { user, chats, theme, setTheme } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState<'chats' | 'status'>('chats');
  const [showNewChat, setShowNewChat] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showStatus, setShowStatus] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOutUser();
      toast.success('Signed out successfully');
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const filteredChats = chats.filter(chat => {
    if (chat.type === 'group') {
      return chat.groupName?.toLowerCase().includes(searchQuery.toLowerCase());
    }
    // For private chats, we'd need to get the other participant's name
    return true;
  });

  if (!user) return null;

  return (
    <div className="w-full md:w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div onClick={() => setShowProfile(true)} className="cursor-pointer">
              <Avatar
                src={user.photoURL}
                alt={user.displayName}
                size="md"
                online={user.isOnline}
              />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">
                {user.displayName}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {user.isOnline ? 'Online' : user.lastSeen ? `Last seen ${formatDistanceToNow(new Date(user.lastSeen))} ago` : 'Last seen recently'}
              </p>
            </div>
          </div>
          
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <MoreVertical size={20} />
            </Button>
            
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg z-10 border border-gray-200 dark:border-gray-600">
                <div className="py-1">
                  <button
                    onClick={() => {
                      setShowProfile(true);
                      setShowDropdown(false);
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    <User size={16} className="mr-3" />
                    Profile
                  </button>
                  <button
                    onClick={() => {
                      setShowSettings(true);
                      setShowDropdown(false);
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    <Settings size={16} className="mr-3" />
                    Settings
                  </button>
                  <button
                    onClick={() => {
                      toggleTheme();
                      setShowDropdown(false);
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    {theme === 'light' ? <Moon size={16} className="mr-3" /> : <Sun size={16} className="mr-3" />}
                    {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                  </button>
                  <hr className="my-1 border-gray-200 dark:border-gray-600" />
                  <button
                    onClick={() => {
                      handleSignOut();
                      setShowDropdown(false);
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    <LogOut size={16} className="mr-3" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <Input
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('chats')}
          className={`flex-1 px-4 py-3 text-sm font-medium ${
            activeTab === 'chats'
              ? 'text-whatsapp-600 border-b-2 border-whatsapp-600'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          Chats
        </button>
        <button
          onClick={() => setActiveTab('status')}
          className={`flex-1 px-4 py-3 text-sm font-medium ${
            activeTab === 'status'
              ? 'text-whatsapp-600 border-b-2 border-whatsapp-600'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          Status
        </button>
      </div>

      {/* Action Buttons */}
      {activeTab === 'chats' && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <Button
            onClick={() => setShowNewChat(true)}
            className="w-full"
            variant="primary"
          >
            <Plus size={20} className="mr-2" />
            New Chat
          </Button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'chats' ? (
          <ChatList chats={filteredChats} />
        ) : (
          <StatusView onAddStatus={() => setShowStatus(true)} />
        )}
      </div>

      {/* Modals */}
      {showNewChat && (
        <NewChatModal onClose={() => setShowNewChat(false)} />
      )}
      {showProfile && (
        <ProfileModal onClose={() => setShowProfile(false)} />
      )}
      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}
      {showStatus && (
        <StatusModal onClose={() => setShowStatus(false)} />
      )}
    </div>
  );
}