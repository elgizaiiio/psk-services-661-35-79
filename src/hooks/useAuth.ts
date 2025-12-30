import { useState, useEffect } from 'react';
import { useTelegramAuth } from './useTelegramAuth';

export interface AuthUser {
  id: string;
  telegramId?: number;
  firstName?: string;
  lastName?: string;
  username?: string;
  photoUrl?: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user: telegramUser, isLoading: isTelegramLoading, webApp } = useTelegramAuth();

  // Check if running in Telegram Mini App (must have a real Telegram user)
  const isTelegramApp = !!webApp && !!telegramUser?.id;

  // Handle Telegram auth
  useEffect(() => {
    if (isTelegramLoading) return;

    if (isTelegramApp && telegramUser) {
      console.log('🔐 Telegram user detected, setting auth user');
      setUser({
        id: telegramUser.id.toString(),
        telegramId: telegramUser.id,
        firstName: telegramUser.first_name,
        lastName: telegramUser.last_name,
        username: telegramUser.username,
        photoUrl: telegramUser.photo_url,
      });
    } else {
      setUser(null);
    }
    setIsLoading(false);
  }, [isTelegramApp, telegramUser, isTelegramLoading]);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isTelegramApp,
  };
};
