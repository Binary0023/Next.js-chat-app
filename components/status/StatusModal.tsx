'use client';

import { useState, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import { uploadStatus } from '@/lib/storage';
import { ref, push, set } from 'firebase/database';
import { database } from '@/lib/firebase';
import { Button } from '@/components/ui/Button';

import { X, Camera, Type, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';

interface StatusModalProps {
  onClose: () => void;
}

export function StatusModal({ onClose }: StatusModalProps) {
  const { user } = useAppStore();
  const [statusType, setStatusType] = useState<'text' | 'image' | 'video'>('text');
  const [content, setContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (file.type.startsWith('image/')) {
        setStatusType('image');
      } else if (file.type.startsWith('video/')) {
        setStatusType('video');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || (!content.trim() && !selectedFile)) {
      toast.error('Please add content to your status');
      return;
    }

    setLoading(true);
    try {
      const statusRef = push(ref(database, `status/${user.uid}`));
      const statusId = statusRef.key!;
      
      let mediaUrl = '';
      if (selectedFile) {
        mediaUrl = await uploadStatus(selectedFile, user.uid, statusId);
      }

      const statusData = {
        id: statusId,
        userId: user.uid,
        content: content.trim(),
        type: statusType,
        mediaUrl,
        timestamp: Date.now(),
        expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
        viewedBy: [],
      };

      await set(statusRef, statusData);
      
      toast.success('Status posted successfully!');
      onClose();
    } catch (error) {
      toast.error('Failed to post status');
      console.error('Status post error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Add Status
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X size={20} />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Status Type Selector */}
          <div className="flex space-x-2">
            <Button
              type="button"
              variant={statusType === 'text' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setStatusType('text')}
              className="flex-1"
            >
              <Type size={16} className="mr-2" />
              Text
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1"
            >
              <ImageIcon size={16} className="mr-2" />
              Photo
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1"
            >
              <Camera size={16} className="mr-2" />
              Video
            </Button>
          </div>

          {/* Content Input */}
          <div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind?"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-whatsapp-500"
              rows={4}
            />
          </div>

          {/* File Preview */}
          {selectedFile && (
            <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-3">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Selected: {selectedFile.name}
              </p>
              {selectedFile.type.startsWith('image/') && (
                <img
                  src={URL.createObjectURL(selectedFile)}
                  alt="Preview"
                  className="w-full h-32 object-cover rounded"
                />
              )}
            </div>
          )}

          <div className="flex space-x-3">
            <Button
              type="submit"
              loading={loading}
              disabled={loading || (!content.trim() && !selectedFile)}
              className="flex-1"
            >
              Post Status
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </div>
  );
}