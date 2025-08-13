'use client';

import Image from 'next/image';
import { User } from 'lucide-react';

interface AvatarProps {
  src?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  online?: boolean;
  className?: string;
}

export function Avatar({ src, alt = '', size = 'md', online, className = '' }: AvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
  };

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center`}>
        {src ? (
          <Image
            src={src}
            alt={alt}
            width={iconSizes[size] * 2}
            height={iconSizes[size] * 2}
            className="w-full h-full object-cover"
          />
        ) : (
          <User size={iconSizes[size]} className="text-gray-400" />
        )}
      </div>
      {online && (
        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
      )}
    </div>
  );
}