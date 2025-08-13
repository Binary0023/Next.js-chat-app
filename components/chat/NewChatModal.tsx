'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { createPrivateChat, createGroupChat } from '@/lib/chat';
import { searchUsers } from '@/lib/userSearch';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { X, Search, Users, MessageCircle } from 'lucide-react';
import { User } from '@/lib/types';
import toast from 'react-hot-toast';

interface NewChatModalProps {
    onClose: () => void;
}

export function NewChatModal({ onClose }: NewChatModalProps) {
    const { user } = useAppStore();
    const [activeTab, setActiveTab] = useState<'private' | 'group'>('private');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [groupName, setGroupName] = useState('');
    const [groupDescription, setGroupDescription] = useState('');
    const [loading, setLoading] = useState(false);

    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [searching, setSearching] = useState(false);

    useEffect(() => {
        const searchForUsers = async () => {
            if (searchQuery.length >= 2) {
                setSearching(true);
                try {
                    const results = await searchUsers(searchQuery);
                    setAllUsers(results.filter(u => u.uid !== user?.uid));
                } catch (error) {
                    console.error('Search error:', error);
                    setAllUsers([]);
                } finally {
                    setSearching(false);
                }
            } else {
                setAllUsers([]);
            }
        };

        const debounceTimer = setTimeout(searchForUsers, 300);
        return () => clearTimeout(debounceTimer);
    }, [searchQuery, user?.uid]);

    const filteredUsers = allUsers;

    const handleCreatePrivateChat = async (otherUserId: string) => {
        if (!user) return;

        setLoading(true);
        try {
            const chatId = await createPrivateChat(user.uid, otherUserId);
            toast.success('Chat created successfully');
            onClose();
        } catch (error) {
            toast.error('Failed to create chat');
            console.error('Create chat error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateGroupChat = async () => {
        if (!user || !groupName.trim() || selectedUsers.length === 0) {
            toast.error('Please enter group name and select at least one user');
            return;
        }

        setLoading(true);
        try {
            const chatId = await createGroupChat(
                user.uid,
                selectedUsers,
                groupName.trim(),
                groupDescription.trim() || undefined
            );
            toast.success('Group created successfully');
            onClose();
        } catch (error) {
            toast.error('Failed to create group');
            console.error('Create group error:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleUserSelection = (userId: string) => {
        setSelectedUsers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[80vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        New Chat
                    </h2>
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        <X size={20} />
                    </Button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 dark:border-gray-700">
                    <button
                        onClick={() => setActiveTab('private')}
                        className={`flex-1 px-4 py-3 text-sm font-medium ${activeTab === 'private'
                            ? 'text-whatsapp-600 border-b-2 border-whatsapp-600'
                            : 'text-gray-500 dark:text-gray-400'
                            }`}
                    >
                        <MessageCircle size={16} className="inline mr-2" />
                        Private Chat
                    </button>
                    <button
                        onClick={() => setActiveTab('group')}
                        className={`flex-1 px-4 py-3 text-sm font-medium ${activeTab === 'group'
                            ? 'text-whatsapp-600 border-b-2 border-whatsapp-600'
                            : 'text-gray-500 dark:text-gray-400'
                            }`}
                    >
                        <Users size={16} className="inline mr-2" />
                        Group Chat
                    </button>
                </div>

                <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
                    {activeTab === 'group' && (
                        <div className="space-y-3">
                            <Input
                                label="Group Name"
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                placeholder="Enter group name"
                            />
                            <Input
                                label="Description (Optional)"
                                value={groupDescription}
                                onChange={(e) => setGroupDescription(e.target.value)}
                                placeholder="Enter group description"
                            />
                        </div>
                    )}

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <Input
                            placeholder="Search by username, name, or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                        {searching && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-whatsapp-500"></div>
                            </div>
                        )}
                    </div>

                    {/* User List */}
                    <div className="space-y-2">
                        {searchQuery.length < 2 ? (
                            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                <p>Start typing to search users</p>
                                <p className="text-sm">Search by username, name, or email</p>
                            </div>
                        ) : searching ? (
                            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-whatsapp-500 mx-auto mb-2"></div>
                                <p>Searching users...</p>
                            </div>
                        ) : filteredUsers.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                <p>No users found</p>
                                <p className="text-sm">Try searching with different keywords</p>
                            </div>
                        ) : (
                            filteredUsers.map((user) => (
                                <div
                                    key={user.uid}
                                    onClick={() => {
                                        if (activeTab === 'private') {
                                            handleCreatePrivateChat(user.uid);
                                        } else {
                                            toggleUserSelection(user.uid);
                                        }
                                    }}
                                    className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${activeTab === 'group' && selectedUsers.includes(user.uid)
                                        ? 'bg-whatsapp-50 dark:bg-whatsapp-900/20'
                                        : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    <Avatar
                                        src={user.photoURL}
                                        alt={user.displayName}
                                        size="md"
                                        online={user.isOnline}
                                    />
                                    <div className="flex-1">
                                        <h3 className="font-medium text-gray-900 dark:text-gray-100">
                                            {user.displayName}
                                        </h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            @{user.username}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-500">
                                            {user.email}
                                        </p>
                                    </div>
                                    {activeTab === 'group' && selectedUsers.includes(user.uid) && (
                                        <div className="w-5 h-5 bg-whatsapp-500 rounded-full flex items-center justify-center">
                                            <div className="w-2 h-2 bg-white rounded-full"></div>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Footer */}
                {activeTab === 'group' && (
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                        <Button
                            onClick={handleCreateGroupChat}
                            disabled={loading || !groupName.trim() || selectedUsers.length === 0}
                            loading={loading}
                            className="w-full"
                        >
                            Create Group ({selectedUsers.length} members)
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}