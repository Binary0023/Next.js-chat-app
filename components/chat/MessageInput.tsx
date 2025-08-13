'use client';

import { useState, useRef, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { sendMessage } from '@/lib/chat';
import { uploadChatMedia } from '@/lib/storage';
import { setTyping } from './TypingIndicator';
import { Button } from '@/components/ui/Button';
import { 
  Send, 
  Paperclip, 
  Smile, 
  Mic, 
  Image as ImageIcon,
  FileText,
  Video,
  Camera
} from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';

interface MessageInputProps {
  chatId: string;
}

export function MessageInput({ chatId }: MessageInputProps) {
  const { user } = useAppStore();
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFileDrop,
    noClick: true,
    multiple: false,
  });

  async function handleFileDrop(files: File[]) {
    if (files.length === 0 || !user) return;
    
    const file = files[0];
    await handleFileUpload(file);
  }

  const handleFileUpload = async (file: File) => {
    if (!user) return;

    setUploading(true);
    try {
      const messageId = Date.now().toString();
      const mediaUrl = await uploadChatMedia(file, chatId, messageId);
      
      let messageType: 'image' | 'video' | 'audio' | 'document' = 'document';
      
      if (file.type.startsWith('image/')) {
        messageType = 'image';
      } else if (file.type.startsWith('video/')) {
        messageType = 'video';
      } else if (file.type.startsWith('audio/')) {
        messageType = 'audio';
      }

      await sendMessage(
        chatId,
        user.uid,
        message.trim() || file.name,
        messageType,
        mediaUrl,
        file.name,
        file.size
      );

      setMessage('');
      toast.success('File sent successfully');
    } catch (error) {
      toast.error('Failed to upload file');
      console.error('File upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !user) return;

    const messageToSend = message.trim();
    setMessage(''); // Clear immediately for better UX
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      await sendMessage(chatId, user.uid, messageToSend);
      toast.success('Message sent');
    } catch (error: any) {
      console.error('Send message error:', error);
      setMessage(messageToSend); // Restore message on error
      toast.error(error.message || 'Failed to send message');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    
    // Handle typing indicator
    if (user) {
      if (value.trim()) {
        setTyping(chatId, user.uid, true);
      } else {
        setTyping(chatId, user.uid, false);
      }
    }
  }, [chatId, user]);

  const handleEmojiClick = (emojiObject: any) => {
    setMessage(prev => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  const handleFileSelect = (type: string) => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = type;
      fileInputRef.current.click();
    }
    setShowAttachments(false);
  };

  const startRecording = async () => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setIsRecording(true);
      
      // Implement actual audio recording
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const audioChunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });
        await handleFileUpload(audioFile);
        setIsRecording(false);
        
        // Clean up stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        mediaRecorderRef.current = null;
      };
      
      mediaRecorder.start();
      
      // Stop recording after 60 seconds max
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      }, 60000);
      
      toast.success('Recording... Click again to stop');
    } catch (error) {
      toast.error('Failed to access microphone');
      setIsRecording(false);
    }
  };

  return (
    <div {...getRootProps()} className={`border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 ${isDragActive ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
      {isDragActive && (
        <div className="absolute inset-0 bg-blue-500/10 border-2 border-dashed border-blue-500 rounded-lg flex items-center justify-center z-10">
          <p className="text-blue-600 dark:text-blue-400 font-medium">Drop file here to send</p>
        </div>
      )}

      <div className="flex items-end space-x-2">
        {/* Attachment Button */}
        <div className="relative flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAttachments(!showAttachments)}
            className="p-2 min-w-[40px]"
          >
            <Paperclip size={20} />
          </Button>

          {showAttachments && (
            <div className="absolute bottom-full mb-2 left-0 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 p-2 space-y-1 z-20">
              <button
                onClick={() => handleFileSelect('image/*')}
                className="flex items-center w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
              >
                <ImageIcon size={16} className="mr-3" />
                Photo
              </button>
              <button
                onClick={() => handleFileSelect('video/*')}
                className="flex items-center w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
              >
                <Video size={16} className="mr-3" />
                Video
              </button>
              <button
                onClick={() => handleFileSelect('*')}
                className="flex items-center w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
              >
                <FileText size={16} className="mr-3" />
                Document
              </button>
              <button
                onClick={() => handleFileSelect('image/*')}
                className="flex items-center w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
              >
                <Camera size={16} className="mr-3" />
                Camera
              </button>
            </div>
          )}
        </div>

        {/* Message Input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyPress}
            placeholder="Type a message..."
            className="w-full px-4 py-2 pr-12 border border-gray-300 dark:border-gray-600 rounded-full resize-none bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-whatsapp-500 focus:border-transparent"
            rows={1}
            style={{ minHeight: '40px', maxHeight: '120px' }}
          />
          
          {/* Emoji Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1"
          >
            <Smile size={20} />
          </Button>

          {/* Emoji Picker */}
          {showEmojiPicker && (
            <div className="absolute bottom-full right-0 mb-2 z-20">
              <EmojiPicker onEmojiClick={handleEmojiClick} />
            </div>
          )}
        </div>

        {/* Send/Record Button */}
        {message.trim() ? (
          <Button
            onClick={handleSendMessage}
            disabled={uploading}
            className="p-2 rounded-full min-w-[40px] flex-shrink-0"
          >
            <Send size={20} />
          </Button>
        ) : (
          <Button
            variant={isRecording ? "danger" : "ghost"}
            size="sm"
            onClick={startRecording}
            className={`p-2 min-w-[40px] flex-shrink-0 ${isRecording ? 'animate-pulse' : ''}`}
          >
            <Mic size={20} />
          </Button>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            handleFileUpload(file);
          }
        }}
      />
      <input {...getInputProps()} />

      {uploading && (
        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Uploading file...
        </div>
      )}
    </div>
  );
}