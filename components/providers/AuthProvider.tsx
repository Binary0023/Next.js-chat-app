'use client';

import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, onValue, set, serverTimestamp } from 'firebase/database';
import { auth, database } from '@/lib/firebase';
import { useAppStore } from '@/lib/store';
import { User } from '@/lib/types';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setOnlineUsers } = useAppStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Get user data from database
        const userRef = ref(database, `users/${firebaseUser.uid}`);
        onValue(userRef, (snapshot) => {
          if (snapshot.exists()) {
            const userData = snapshot.val();
            const user: User = {
              uid: firebaseUser.uid,
              ...userData,
              settings: {
                theme: 'light',
                chatWallpaper: '',
                fontSize: 'medium',
                notifications: true,
                autoDownload: true,
                showLastSeen: true,
                showProfilePicture: true,
                showStatus: true,
                soundEnabled: true,
                vibrationEnabled: true,
                readReceipts: true,
                ...userData.settings,
              },
            };
            setUser(user);
          }
        });

        // Set user online
        await set(ref(database, `users/${firebaseUser.uid}/isOnline`), true);
        await set(ref(database, `users/${firebaseUser.uid}/lastSeen`), serverTimestamp());

        // Listen for online users
        const onlineUsersRef = ref(database, 'users');
        onValue(onlineUsersRef, (snapshot) => {
          if (snapshot.exists()) {
            const users = snapshot.val();
            const onlineUserIds = new Set<string>();
            
            Object.keys(users).forEach(userId => {
              if (users[userId].isOnline) {
                onlineUserIds.add(userId);
              }
            });
            
            setOnlineUsers(onlineUserIds);
          }
        });

        // Handle page unload
        const handleBeforeUnload = async () => {
          await set(ref(database, `users/${firebaseUser.uid}/isOnline`), false);
          await set(ref(database, `users/${firebaseUser.uid}/lastSeen`), serverTimestamp());
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
          window.removeEventListener('beforeunload', handleBeforeUnload);
        };
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, [setUser, setOnlineUsers]);

  return <>{children}</>;
}