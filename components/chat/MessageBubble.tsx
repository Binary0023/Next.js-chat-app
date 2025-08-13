'use client';

import { useState, useRef, useEffect } from 'react';
import { Message } from '@/lib/types';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { addReaction, removeReaction, starMessage, editMessage, deleteMessage } from '@/lib/chat';
import { useAppStore } from '@/lib/store';
import {
    MoreVertical,
    Star,
    Edit,
    Trash2,
    Copy,
    Download,
    Play,
    Pause
} from 'lucide-react';
import { format } from 'date-fns';
import Image from 'next/image';
import toast from 'react-hot-toast';

interface MessageBubbleProps {
    message: Message;
    isOwn: boolean;
    showAvatar?: boolean;
}

export function MessageBubble({ message, isOwn, showAvatar = false }: MessageBubbleProps) {
    const { user, activeChat } = useAppStore();
    const [showDropdown, setShowDropdown] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(message.content);
    const [showReactions, setShowReactions] = useState(false);

    const reactions = ['❤️', '😂', '😮', '😢', '😡', '👍', '👎'];

    const handleReaction = async (reaction: string) => {
        if (!user || !activeChat) return;

        try {
            const currentReaction = message.reactions?.[user.uid];

            if (currentReaction === reaction) {
                await removeReaction(activeChat.id, message.id, user.uid);
            } else {
                await addReaction(activeChat.id, message.id, user.uid, reaction);
            }

            setShowReactions(false);
        } catch (error) {
            toast.error('Failed to add reaction');
        }
    };

    const handleStar = async () => {
        if (!activeChat) return;

        try {
            await starMessage(activeChat.id, message.id, !message.starred);
            toast.success(message.starred ? 'Message unstarred' : 'Message starred');
            setShowDropdown(false);
        } catch (error) {
            toast.error('Failed to star message');
        }
    };

    const handleEdit = async () => {
        if (!activeChat || editContent.trim() === message.content) {
            setIsEditing(false);
            return;
        }

        try {
            await editMessage(activeChat.id, message.id, editContent.trim());
            setIsEditing(false);
            toast.success('Message edited');
        } catch (error) {
            toast.error('Failed to edit message');
        }
    };

    const handleDelete = async () => {
        if (!activeChat) return;

        try {
            await deleteMessage(activeChat.id, message.id);
            setShowDropdown(false);
            toast.success('Message deleted');
        } catch (error) {
            toast.error('Failed to delete message');
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(message.content);
        toast.success('Message copied');
        setShowDropdown(false);
    };

    const renderMessageContent = () => {
        if (message.deleted) {
            return (
                <div className="italic text-gray-500 dark:text-gray-400">
                    This message was deleted
                </div>
            );
        }

        switch (message.type) {
            case 'image':
                return (
                    <div className="max-w-sm">
                        {message.mediaUrl && (
                            <Image
                                src={message.mediaUrl}
                                alt="Shared image"
                                width={300}
                                height={200}
                                className="rounded-lg object-cover"
                            />
                        )}
                        {message.content && (
                            <p className="mt-2 text-sm">{message.content}</p>
                        )}
                    </div>
                );

            case 'video':
                return (
                    <div className="max-w-sm">
                        {message.mediaUrl && (
                            <video
                                src={message.mediaUrl}
                                controls
                                className="rounded-lg max-w-full"
                                style={{ maxHeight: '300px' }}
                            />
                        )}
                        {message.content && (
                            <p className="mt-2 text-sm">{message.content}</p>
                        )}
                    </div>
                );

            case 'audio':
                return (
                    <AudioPlayer
                        src={message.mediaUrl || ''}
                        isOwn={isOwn}
                    />
                );

            case 'document':
                return (
                    <div className="flex items-center space-x-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <div className="bg-whatsapp-500 p-2 rounded">
                            <Download size={16} className="text-white" />
                        </div>
                        <div className="flex-1">
                            <p className="font-medium text-sm">{message.mediaName}</p>
                            <p className="text-xs text-gray-500">
                                {message.mediaSize ? `${(message.mediaSize / 1024 / 1024).toFixed(1)} MB` : 'Unknown size'}
                            </p>
                        </div>
                    </div>
                );

            default:
                return isEditing ? (
                    <div className="space-y-2">
                        <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full p-2 border rounded resize-none bg-transparent"
                            rows={2}
                            autoFocus
                        />
                        <div className="flex space-x-2">
                            <Button size="sm" onClick={handleEdit}>Save</Button>
                            <Button size="sm" variant="secondary" onClick={() => setIsEditing(false)}>Cancel</Button>
                        </div>
                    </div>
                ) : (
                    <p className="whitespace-pre-wrap break-words">{message.content}</p>
                );
        }
    };

    const messageReactions = message.reactions ? Object.entries(message.reactions) : [];

    return (
        <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}>
            <div className={`flex ${isOwn ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2 max-w-xs lg:max-w-md`}>
                {showAvatar && !isOwn && (
                    <Avatar size="sm" className="mb-1" />
                )}

                <div className="relative">
                    <div
                        className={`
              px-4 py-2 rounded-lg break-words relative
              ${isOwn
                                ? 'bg-whatsapp-500 text-white'
                                : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                            }
            `}
                    >
                        {renderMessageContent()}

                        <div className={`flex items-center justify-between mt-1 space-x-2 ${isOwn ? 'text-whatsapp-100' : 'text-gray-500 dark:text-gray-400'
                            }`}>
                            <span className="text-xs">
                                {format(message.timestamp, 'HH:mm')}
                            </span>

                            {message.edited && (
                                <span className="text-xs italic">edited</span>
                            )}

                            {message.starred && (
                                <Star size={12} className="fill-current" />
                            )}
                        </div>

                        {/* Dropdown Menu */}
                        <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowDropdown(!showDropdown)}
                                className="p-1 h-6 w-6 md:h-6 md:w-6"
                            >
                                <MoreVertical size={12} />
                            </Button>

                            {showDropdown && (
                                <div className={`absolute ${isOwn ? 'right-0' : 'left-0'} mt-1 w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg z-20 border border-gray-200 dark:border-gray-600`}>
                                    <div className="py-1">
                                        <button
                                            onClick={() => setShowReactions(!showReactions)}
                                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                                        >
                                            React
                                        </button>
                                        <button
                                            onClick={handleStar}
                                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                                        >
                                            <Star size={16} className="mr-3" />
                                            {message.starred ? 'Unstar' : 'Star'}
                                        </button>
                                        <button
                                            onClick={handleCopy}
                                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                                        >
                                            <Copy size={16} className="mr-3" />
                                            Copy
                                        </button>
                                        {isOwn && !message.deleted && (
                                            <>
                                                <button
                                                    onClick={() => {
                                                        setIsEditing(true);
                                                        setShowDropdown(false);
                                                    }}
                                                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                                                >
                                                    <Edit size={16} className="mr-3" />
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={handleDelete}
                                                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-600"
                                                >
                                                    <Trash2 size={16} className="mr-3" />
                                                    Delete
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Reactions */}
                    {messageReactions.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                            {messageReactions.map(([userId, reaction]) => (
                                <span
                                    key={userId}
                                    className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full"
                                >
                                    {reaction}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Reaction Picker */}
                    {showReactions && (
                        <div className="absolute bottom-full mb-2 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 p-2 flex space-x-1 z-20">
                            {reactions.map((reaction) => (
                                <button
                                    key={reaction}
                                    onClick={() => handleReaction(reaction)}
                                    className="text-lg hover:bg-gray-100 dark:hover:bg-gray-600 p-1 rounded"
                                >
                                    {reaction}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Audio Player Component
function AudioPlayer({ src, isOwn }: { src: string; isOwn: boolean }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const updateTime = () => setCurrentTime(audio.currentTime);
        const updateDuration = () => setDuration(audio.duration);
        const handleEnded = () => setIsPlaying(false);

        audio.addEventListener('timeupdate', updateTime);
        audio.addEventListener('loadedmetadata', updateDuration);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('timeupdate', updateTime);
            audio.removeEventListener('loadedmetadata', updateDuration);
            audio.removeEventListener('ended', handleEnded);
        };
    }, []);

    const togglePlay = () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying) {
            audio.pause();
        } else {
            audio.play();
        }
        setIsPlaying(!isPlaying);
    };

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <div className="flex items-center space-x-3 min-w-48">
            <audio ref={audioRef} src={src} preload="metadata" />
            <Button
                variant="ghost"
                size="sm"
                className="p-2"
                onClick={togglePlay}
            >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </Button>
            <div className="flex-1">
                <div className="h-1 bg-gray-300 dark:bg-gray-600 rounded-full">
                    <div
                        className={`h-1 rounded-full ${isOwn ? 'bg-white/70' : 'bg-whatsapp-500'}`}
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
            </div>
            <span className="text-xs text-gray-500">
                {formatTime(currentTime)} / {formatTime(duration)}
            </span>
        </div>
    );
}