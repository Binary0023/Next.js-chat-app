'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/lib/store';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useAppStore();

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark', 'blue', 'green', 'purple', 'pink', 'orange');
    root.classList.add(theme);
    
    // Apply theme colors
    const themeColors = {
      light: { primary: '#22c55e', bg: '#ffffff' },
      dark: { primary: '#22c55e', bg: '#111827' },
      blue: { primary: '#3b82f6', bg: '#1e3a8a' },
      green: { primary: '#10b981', bg: '#064e3b' },
      purple: { primary: '#8b5cf6', bg: '#581c87' },
      pink: { primary: '#ec4899', bg: '#831843' },
      orange: { primary: '#f97316', bg: '#9a3412' },
    };
    
    const colors = themeColors[theme] || themeColors.light;
    root.style.setProperty('--primary-color', colors.primary);
    root.style.setProperty('--bg-color', colors.bg);
  }, [theme]);

  return <>{children}</>;
}