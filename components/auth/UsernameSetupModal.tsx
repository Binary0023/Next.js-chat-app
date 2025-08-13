'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { updateUserProfile } from '@/lib/auth';
import { ref, get, set } from 'firebase/database';
import { database } from '@/lib/firebase';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';

interface UsernameSetupModalProps {
  user: any;
  onComplete: () => void;
}

export function UsernameSetupModal({ user, onComplete }: UsernameSetupModalProps) {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

  const checkUsernameAvailability = async (usernameToCheck: string) => {
    if (!usernameToCheck || usernameToCheck.length < 3) {
      setIsAvailable(null);
      return;
    }

    setChecking(true);
    try {
      const usernamesRef = ref(database, 'usernames');
      const snapshot = await get(usernamesRef);

      if (snapshot.exists()) {
        const usernames = snapshot.val();
        const taken = Object.values(usernames).includes(usernameToCheck.toLowerCase());
        setIsAvailable(!taken);
      } else {
        setIsAvailable(true);
      }
    } catch (error) {
      console.error('Error checking username:', error);
      setIsAvailable(null);
    } finally {
      setChecking(false);
    }
  };

  const handleUsernameChange = (value: string) => {
    // Only allow alphanumeric and underscore
    const cleanValue = value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setUsername(cleanValue);

    if (cleanValue.length >= 3) {
      checkUsernameAvailability(cleanValue);
    } else {
      setIsAvailable(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || username.length < 3 || !isAvailable) {
      toast.error('Please choose a valid username');
      return;
    }

    setLoading(true);
    try {
      // Reserve username
      await updateUserProfile({
        username,
      });

      // Add to usernames index
      const usernameRef = ref(database, `usernames/${user.uid}`);
      await set(usernameRef, username.toLowerCase());

      toast.success('Username set successfully!');
      onComplete();
    } catch (error) {
      toast.error('Failed to set username');
      console.error('Username setup error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Choose Your Username
          </h2>
        </div>

        <div className="mb-4">
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            Your username will help others find and message you easily.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              label="Username"
              value={username}
              onChange={(e) => handleUsernameChange(e.target.value)}
              placeholder="Enter username (min 3 characters)"
              className={`${isAvailable === true ? 'border-green-500' :
                isAvailable === false ? 'border-red-500' : ''
                }`}
            />

            {checking && (
              <p className="text-sm text-gray-500 mt-1">Checking availability...</p>
            )}

            {isAvailable === true && (
              <p className="text-sm text-green-600 mt-1">✓ Username is available!</p>
            )}

            {isAvailable === false && (
              <p className="text-sm text-red-600 mt-1">✗ Username is already taken</p>
            )}

            {username.length > 0 && username.length < 3 && (
              <p className="text-sm text-gray-500 mt-1">Username must be at least 3 characters</p>
            )}
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              type="submit"
              loading={loading}
              disabled={loading || !isAvailable || username.length < 3}
              className="flex-1"
            >
              Continue
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}