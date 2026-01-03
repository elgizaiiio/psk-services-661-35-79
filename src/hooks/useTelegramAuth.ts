import { useState, useEffect } from 'react';
import { TelegramUser } from '@/types/telegram';
import { useNavigate, useLocation } from 'react-router-dom';
import { createLogger } from '@/lib/logger';

const logger = createLogger('TelegramAuth');

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string;
        initDataUnsafe: {
          user?: TelegramUser;
          start_param?: string;
        };
        ready: () => void;
        expand: () => void;
        close: () => void;
        MainButton: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isActive: boolean;
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
        };
        BackButton: {
          isVisible: boolean;
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
        };
        HapticFeedback: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
          selectionChanged: () => void;
        };
        themeParams: {
          bg_color?: string;
          text_color?: string;
          hint_color?: string;
          link_color?: string;
          button_color?: string;
          button_text_color?: string;
        };
        viewportHeight?: number;
        viewportStableHeight?: number;
        onEvent?: (eventType: string, callback: () => void) => void;
        offEvent?: (eventType: string, callback: () => void) => void;
      };
    };
  }
}

interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    user?: TelegramUser;
    start_param?: string;
  };
  ready: () => void;
  expand: () => void;
  close: () => void;
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    show: () => void;
    hide: () => void;
    onClick: (callback: () => void) => void;
  };
  BackButton: {
    isVisible: boolean;
    show: () => void;
    hide: () => void;
    onClick: (callback: () => void) => void;
  };
  HapticFeedback: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy') => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
    selectionChanged: () => void;
  };
  themeParams: {
    bg_color?: string;
    text_color?: string;
    hint_color?: string;
    link_color?: string;
    button_color?: string;
    button_text_color?: string;
  };
  viewportHeight?: number;
  viewportStableHeight?: number;
  onEvent?: (eventType: string, callback: () => void) => void;
  offEvent?: (eventType: string, callback: () => void) => void;
}

export const useTelegramAuth = () => {
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
  const [hasWebApp, setHasWebApp] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 6; // 3 seconds total (500ms * 6)
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const getUserData = (tg: TelegramWebApp): TelegramUser | null => {
      const telegramUser = tg.initDataUnsafe?.user;
      
      if (telegramUser && telegramUser.id) {
        logger.info('Valid Telegram user found', { id: telegramUser.id });
        
        if (telegramUser.photo_url && !telegramUser.photo_url.startsWith('http')) {
          telegramUser.photo_url = `https://t.me/i/userpic/320/${telegramUser.photo_url}`;
        }
        
        return telegramUser;
      }
      
      // Try parsing from initData
      if (tg.initData) {
        try {
          const urlParams = new URLSearchParams(tg.initData);
          const userParam = urlParams.get('user');
          
          if (userParam) {
            const parsedUser = JSON.parse(decodeURIComponent(userParam));
            if (parsedUser && parsedUser.id) {
              logger.info('User parsed from initData', { id: parsedUser.id });
              return parsedUser;
            }
          }
        } catch (error) {
          logger.error('Error parsing initData', error);
        }
      }
      
      return null;
    };

    const initTelegramUser = () => {
      logger.debug('Initializing Telegram user...', { retryCount });
      
      if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
        logger.debug('Telegram WebApp detected');
        const tg = window.Telegram.WebApp;
        setWebApp(tg);
        setHasWebApp(true);
        
        tg.ready();
        tg.expand();
        
        if (tg.viewportHeight) {
          document.documentElement.style.setProperty('--tg-viewport-height', `${tg.viewportHeight}px`);
        }
        
        if (tg.viewportStableHeight) {
          document.documentElement.style.setProperty('--tg-viewport-stable-height', `${tg.viewportStableHeight}px`);
        }
        
        if (tg.themeParams) {
          const theme = tg.themeParams;
          if (theme.bg_color) {
            document.documentElement.style.setProperty('--tg-theme-bg-color', theme.bg_color);
          }
          if (theme.text_color) {
            document.documentElement.style.setProperty('--tg-theme-text-color', theme.text_color);
          }
        }
        
        if (tg.BackButton) {
          tg.BackButton.show();
        }
        
        if (tg.onEvent) {
          tg.onEvent('viewportChanged', () => {
            if (tg.viewportHeight) {
              document.documentElement.style.setProperty('--tg-viewport-height', `${tg.viewportHeight}px`);
            }
            if (tg.viewportStableHeight) {
              document.documentElement.style.setProperty('--tg-viewport-stable-height', `${tg.viewportStableHeight}px`);
            }
          });
        }
        
        const foundUser = getUserData(tg);
        
        if (foundUser) {
          setUser(foundUser);
          setIsLoading(false);
        } else if (retryCount < maxRetries) {
          // Retry after delay - user data may arrive late
          retryCount++;
          logger.debug(`User data not found, retry ${retryCount}/${maxRetries}`);
          retryTimer = setTimeout(initTelegramUser, 500);
        } else {
          // Exhausted retries, no user found
          logger.warn('No user data found after all retries');
          setUser(null);
          setIsLoading(false);
        }
      } else {
        logger.debug('No Telegram WebApp found - browser mode');
        setHasWebApp(false);
        setUser(null);
        setIsLoading(false);
      }
    };

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      initTelegramUser();
    } else {
      const onLoad = () => initTelegramUser();
      window.addEventListener('load', onLoad);
      return () => {
        window.removeEventListener('load', onLoad);
        if (retryTimer) clearTimeout(retryTimer);
      };
    }

    return () => {
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, []);

  // BackButton management removed - handled by useTelegramBackButton hook

  const hapticFeedback = {
    impact: (style: 'light' | 'medium' | 'heavy' = 'medium') => {
      if (webApp?.HapticFeedback) {
        webApp.HapticFeedback.impactOccurred(style);
      }
    },
    notification: (type: 'error' | 'success' | 'warning') => {
      if (webApp?.HapticFeedback) {
        webApp.HapticFeedback.notificationOccurred(type);
      }
    },
    selection: () => {
      if (webApp?.HapticFeedback) {
        webApp.HapticFeedback.selectionChanged();
      }
    }
  };

  const showMainButton = (text: string, callback: () => void) => {
    if (webApp?.MainButton) {
      webApp.MainButton.text = text;
      webApp.MainButton.show();
      webApp.MainButton.onClick(callback);
    }
  };

  const hideMainButton = () => {
    if (webApp?.MainButton) {
      webApp.MainButton.hide();
    }
  };

  const showBackButton = () => {
    if (webApp?.BackButton) {
      webApp.BackButton.show();
    }
  };

  const hideBackButton = () => {
    if (webApp?.BackButton) {
      webApp.BackButton.hide();
    }
  };

  return {
    user,
    isLoading,
    webApp,
    hapticFeedback,
    showMainButton,
    hideMainButton,
    showBackButton,
    hideBackButton
  };
};
