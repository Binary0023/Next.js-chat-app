'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { ref, onValue, set } from 'firebase/database';
import { database } from '@/lib/firebase';
import { Status } from '@/lib/types';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Plus, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Image from 'next/image';

interface StatusViewProps {
  onAddStatus: () => void;
}

export function StatusView({ onAddStatus }: StatusViewProps) {
  const { user } = useAppStore();
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [myStatuses, setMyStatuses] = useState<Status[]>([]);

  useEffect(() => {
    if (!user) return;

    // Listen for all statuses
    const statusRef = ref(database, 'status');
    const unsubscribe = onValue(statusRef, (snapshot) => {
      if (snapshot.exists()) {
        const statusData = snapshot.val();
        const allStatuses: Status[] = [];
        const userStatuses: Status[] = [];
        const now = Date.now();

        Object.keys(statusData).forEach(userId => {
          const userStatusData = statusData[userId];
          Object.keys(userStatusData).forEach(statusId => {
            const status = { ...userStatusData[statusId], id: statusId };
            
            // Only show non-expired statuses
            if (status.expiresAt > now) {
              if (userId === user.uid) {
                userStatuses.push(status);
              } else {
                allStatuses.push(status);
              }
            }
          });
        });

        setStatuses(allStatuses);
        setMyStatuses(userStatuses);
      }
    });

    return () => unsubscribe();
  }, [user]);

  const viewStatus = async (status: Status) => {
    if (!user || status.userId === user.uid) return;

    // Mark as viewed
    const viewedRef = ref(database, `status/${status.userId}/${status.id}/viewedBy`);
    const currentViewed = status.viewedBy || [];
    if (!currentViewed.includes(user.uid)) {
      await set(viewedRef, [...currentViewed, user.uid]);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {/* My Status */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Avatar
              src={user?.photoURL}
              alt={user?.displayName}
              size="lg"
            />
            <button
              onClick={onAddStatus}
              className="absolute bottom-0 right-0 w-6 h-6 bg-whatsapp-500 rounded-full flex items-center justify-center text-white hover:bg-whatsapp-600 transition-colors"
            >
              <Plus size={12} />
            </button>
          </div>
          
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              My Status
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {myStatuses.length > 0 
                ? `${myStatuses.length} status${myStatuses.length > 1 ? 'es' : ''}`
                : 'Tap to add status update'
              }
            </p>
          </div>
        </div>

        {/* My Status List */}
        {myStatuses.length > 0 && (
          <div className="mt-3 space-y-2">
            {myStatuses.map((status) => (
              <div key={status.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {status.content}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDistanceToNow(new Date(status.timestamp))} ago
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Eye size={14} className="text-gray-400" />
                  <span className="text-xs text-gray-500">{status.viewedBy?.length || 0}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Updates */}
      <div className="p-4">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide">
          Recent Updates
        </h3>
        
        {statuses.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>No status updates</p>
            <p className="text-sm">Status updates from your contacts will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {statuses.map((status) => (
              <div
                key={status.id}
                onClick={() => viewStatus(status)}
                className="flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition-colors"
              >
                <div className="relative">
                  <Avatar size="md" />
                  <div className="absolute -inset-1 rounded-full border-2 border-whatsapp-500"></div>
                </div>
                
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">
                    User {status.userId.slice(0, 8)}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {formatDistanceToNow(new Date(status.timestamp))} ago
                  </p>
                </div>

                {status.type === 'image' && status.mediaUrl && (
                  <div className="w-12 h-12 rounded-lg overflow-hidden">
                    <Image
                      src={status.mediaUrl}
                      alt="Status preview"
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}