'use client';

import { useState, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import { updateUserProfile } from '@/lib/auth';
import { uploadProfilePicture } from '@/lib/storage';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { X, Camera, Edit2, Save } from 'lucide-react';
import toast from 'react-hot-toast';

interface ProfileModalProps {
  onClose: () => void;
}

export function ProfileModal({ onClose }: ProfileModalProps) {
  const { user } = useAppStore();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    displayName: user?.displayName || '',
    bio: user?.bio || '',
    phoneNumber: user?.phoneNumber || '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    try {
      await updateUserProfile({
        displayName: formData.displayName,
        bio: formData.bio,
        phoneNumber: formData.phoneNumber,
      });
      
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
      console.error('Profile update error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (file: File) => {
    if (!user) return;

    setLoading(true);
    try {
      const photoURL = await uploadProfilePicture(file, user.uid);
      await updateUserProfile({ photoURL });
      toast.success('Profile picture updated');
    } catch (error) {
      toast.error('Failed to update profile picture');
      console.error('Photo upload error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handlePhotoUpload(file);
    }
  };

  if (!user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Profile
          </h2>
          <div className="flex items-center space-x-2">
            {!isEditing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit2 size={16} />
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X size={20} />
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Profile Picture */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <Avatar
                src={user.photoURL}
                alt={user.displayName}
                size="xl"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 bg-whatsapp-500 text-white p-2 rounded-full hover:bg-whatsapp-600 transition-colors"
                disabled={loading}
              >
                <Camera size={16} />
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Profile Information */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Display Name
              </label>
              {isEditing ? (
                <Input
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  placeholder="Enter your display name"
                />
              ) : (
                <p className="text-gray-900 dark:text-gray-100">{user.displayName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone Number
              </label>
              {isEditing ? (
                <Input
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  placeholder="Enter your phone number"
                />
              ) : (
                <p className="text-gray-900 dark:text-gray-100">
                  {user.phoneNumber || 'Not provided'}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Bio
              </label>
              {isEditing ? (
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Tell us about yourself"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none bg-white dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                  rows={3}
                />
              ) : (
                <p className="text-gray-900 dark:text-gray-100">
                  {user.bio || 'Hey there! I am using WhatsApp.'}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          {isEditing && (
            <div className="flex space-x-3">
              <Button
                onClick={handleSave}
                loading={loading}
                disabled={loading}
                className="flex-1"
              >
                <Save size={16} className="mr-2" />
                Save Changes
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setIsEditing(false);
                  setFormData({
                    displayName: user.displayName || '',
                    bio: user.bio || '',
                    phoneNumber: user.phoneNumber || '',
                  });
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}