'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { updateUserProfile } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { X, Moon, Sun, Bell, Download, Eye, Shield, Palette, Volume2, Vibrate, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface SettingsModalProps {
  onClose: () => void;
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const { user, theme, setTheme, chatWallpaper, setChatWallpaper } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'appearance' | 'privacy' | 'notifications'>('general');
  const [settings, setSettings] = useState({
    notifications: user?.settings?.notifications ?? true,
    autoDownload: user?.settings?.autoDownload ?? true,
    showLastSeen: user?.settings?.showLastSeen ?? true,
    showProfilePicture: user?.settings?.showProfilePicture ?? true,
    showStatus: user?.settings?.showStatus ?? true,
    soundEnabled: user?.settings?.soundEnabled ?? true,
    vibrationEnabled: user?.settings?.vibrationEnabled ?? true,
    readReceipts: user?.settings?.readReceipts ?? true,
    fontSize: user?.settings?.fontSize ?? 'medium',
  });

  const themes = [
    { id: 'light', name: 'Light', color: 'bg-white', icon: Sun },
    { id: 'dark', name: 'Dark', color: 'bg-gray-900', icon: Moon },
    { id: 'blue', name: 'Ocean Blue', color: 'bg-blue-600', icon: Palette },
    { id: 'green', name: 'Forest Green', color: 'bg-green-600', icon: Palette },
    { id: 'purple', name: 'Royal Purple', color: 'bg-purple-600', icon: Palette },
    { id: 'pink', name: 'Rose Pink', color: 'bg-pink-600', icon: Palette },
    { id: 'orange', name: 'Sunset Orange', color: 'bg-orange-600', icon: Palette },
  ];

  const wallpapers = [
    { id: '', name: 'Default', preview: 'bg-gray-100 dark:bg-gray-900' },
    { id: 'pattern1', name: 'Geometric', preview: 'bg-gradient-to-br from-blue-400 to-purple-600' },
    { id: 'pattern2', name: 'Waves', preview: 'bg-gradient-to-br from-green-400 to-blue-600' },
    { id: 'pattern3', name: 'Sunset', preview: 'bg-gradient-to-br from-orange-400 to-pink-600' },
    { id: 'pattern4', name: 'Forest', preview: 'bg-gradient-to-br from-green-600 to-teal-600' },
    { id: 'pattern5', name: 'Ocean', preview: 'bg-gradient-to-br from-blue-600 to-cyan-600' },
  ];

  const handleSaveSettings = async () => {
    if (!user) return;

    setLoading(true);
    try {
      await updateUserProfile({
        settings: {
          ...(user.settings || {}),
          ...settings,
          theme,
          chatWallpaper,
        },
      });

      toast.success('Settings updated successfully');
    } catch (error) {
      toast.error('Failed to update settings');
      console.error('Settings update error:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const SettingItem = ({
    icon: Icon,
    title,
    description,
    checked,
    onChange
  }: {
    icon: any;
    title: string;
    description: string;
    checked: boolean;
    onChange: () => void;
  }) => (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center space-x-3">
        <Icon size={20} className="text-gray-600 dark:text-gray-400" />
        <div>
          <h3 className="font-medium text-gray-900 dark:text-gray-100">{title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
        </div>
      </div>
      <button
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-whatsapp-500' : 'bg-gray-300 dark:bg-gray-600'
          }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'
            }`}
        />
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Settings
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X size={20} />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          {[
            { id: 'general', name: 'General', icon: Shield },
            { id: 'appearance', name: 'Appearance', icon: Palette },
            { id: 'privacy', name: 'Privacy', icon: Eye },
            { id: 'notifications', name: 'Notifications', icon: Bell },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-whatsapp-600 border-b-2 border-whatsapp-600'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <tab.icon size={16} />
              <span>{tab.name}</span>
            </button>
          ))}
        </div>

        <div className="p-4 space-y-6 max-h-96 overflow-y-auto">
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              <SettingItem
                icon={Download}
                title="Auto-download Media"
                description="Automatically download photos and videos"
                checked={settings.autoDownload}
                onChange={() => toggleSetting('autoDownload')}
              />
              <SettingItem
                icon={Volume2}
                title="Sound Effects"
                description="Play sounds for messages and calls"
                checked={settings.soundEnabled}
                onChange={() => toggleSetting('soundEnabled')}
              />
              <SettingItem
                icon={Vibrate}
                title="Vibration"
                description="Vibrate for notifications"
                checked={settings.vibrationEnabled}
                onChange={() => toggleSetting('vibrationEnabled')}
              />
              <SettingItem
                icon={CheckCircle}
                title="Read Receipts"
                description="Send read receipts to others"
                checked={settings.readReceipts}
                onChange={() => toggleSetting('readReceipts')}
              />
              
              {/* Font Size */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Font Size</h4>
                <div className="flex space-x-2">
                  {['small', 'medium', 'large'].map((size) => (
                    <button
                      key={size}
                      onClick={() => setSettings(prev => ({ ...prev, fontSize: size as any }))}
                      className={`px-3 py-2 text-sm rounded-lg capitalize ${
                        settings.fontSize === size
                          ? 'bg-whatsapp-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Appearance Settings */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              {/* Theme Selection */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Theme</h4>
                <div className="grid grid-cols-2 gap-3">
                  {themes.map((themeOption) => (
                    <button
                      key={themeOption.id}
                      onClick={() => setTheme(themeOption.id as any)}
                      className={`flex items-center space-x-3 p-3 rounded-lg border-2 transition-all ${
                        theme === themeOption.id
                          ? 'border-whatsapp-500 bg-whatsapp-50 dark:bg-whatsapp-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full ${themeOption.color}`}></div>
                      <span className="text-sm font-medium">{themeOption.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Wallpaper Selection */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Chat Wallpaper</h4>
                <div className="grid grid-cols-2 gap-3">
                  {wallpapers.map((wallpaper) => (
                    <button
                      key={wallpaper.id}
                      onClick={() => setChatWallpaper(wallpaper.id)}
                      className={`relative p-3 rounded-lg border-2 transition-all ${
                        chatWallpaper === wallpaper.id
                          ? 'border-whatsapp-500'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <div className={`w-full h-16 rounded ${wallpaper.preview} mb-2`}></div>
                      <span className="text-xs font-medium">{wallpaper.name}</span>
                      {chatWallpaper === wallpaper.id && (
                        <div className="absolute top-1 right-1 w-5 h-5 bg-whatsapp-500 rounded-full flex items-center justify-center">
                          <CheckCircle size={12} className="text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Privacy Settings */}
          {activeTab === 'privacy' && (
            <div className="space-y-1">
              <SettingItem
                icon={Eye}
                title="Last Seen"
                description="Show when you were last online"
                checked={settings.showLastSeen}
                onChange={() => toggleSetting('showLastSeen')}
              />
              <SettingItem
                icon={Shield}
                title="Profile Picture"
                description="Show your profile picture to others"
                checked={settings.showProfilePicture}
                onChange={() => toggleSetting('showProfilePicture')}
              />
              <SettingItem
                icon={Eye}
                title="Status"
                description="Show your status to others"
                checked={settings.showStatus}
                onChange={() => toggleSetting('showStatus')}
              />
            </div>
          )}

          {/* Notifications */}
          {activeTab === 'notifications' && (
            <div>
              <SettingItem
                icon={Bell}
                title="Push Notifications"
                description="Receive notifications for new messages"
                checked={settings.notifications}
                onChange={() => toggleSetting('notifications')}
              />
            </div>
          )}


        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            onClick={handleSaveSettings}
            loading={loading}
            disabled={loading}
            className="w-full"
          >
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
}