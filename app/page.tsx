'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function Home() {
  const { user } = useAppStore();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/chat');
    } else {
      router.push('/auth');
    }
  }, [user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  );
}