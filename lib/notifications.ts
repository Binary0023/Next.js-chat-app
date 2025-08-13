'use client';

export class NotificationService {
  private static instance: NotificationService;
  private permission: NotificationPermission = 'default';

  private constructor() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }

    if (this.permission === 'granted') {
      return true;
    }

    const permission = await Notification.requestPermission();
    this.permission = permission;
    return permission === 'granted';
  }

  showNotification(title: string, options?: NotificationOptions): Notification | null {
    if (this.permission !== 'granted' || typeof window === 'undefined') {
      return null;
    }

    const notification = new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options,
    });

    // Auto-close after 5 seconds
    setTimeout(() => {
      notification.close();
    }, 5000);

    return notification;
  }

  showIncomingCallNotification(callerName: string, callType: 'audio' | 'video'): Notification | null {
    return this.showNotification(`Incoming ${callType} call`, {
      body: `${callerName} is calling you`,
      tag: 'incoming-call',
      requireInteraction: true,
    });
  }

  showMessageNotification(senderName: string, message: string): Notification | null {
    return this.showNotification(`New message from ${senderName}`, {
      body: message,
      tag: 'new-message',
    });
  }

  playRingtone(): HTMLAudioElement | null {
    if (typeof window === 'undefined') return null;

    try {
      const audio = new Audio();
      // Using a simple beep sound data URL
      audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT';
      audio.loop = true;
      audio.volume = 0.5;
      audio.play().catch(console.error);
      return audio;
    } catch (error) {
      console.error('Failed to play ringtone:', error);
      return null;
    }
  }
}

export const notificationService = NotificationService.getInstance();