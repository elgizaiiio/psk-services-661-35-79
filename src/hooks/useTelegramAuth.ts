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
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const initTelegramUser = () => {
      logger.debug('Initializing Telegram user...');
      
      if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
        logger.debug('Telegram WebApp detected');
        const tg = window.Telegram.WebApp;
        setWebApp(tg);
        
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
        
        const getUserData = () => {
          const telegramUser = tg.initDataUnsafe?.user;
          
          if (telegramUser && telegramUser.id) {
            logger.info('Valid Telegram user found', { id: telegramUser.id });
            
            if (telegramUser.photo_url && !telegramUser.photo_url.startsWith('http')) {
              telegramUser.photo_url = `https://t.me/i/userpic/320/${telegramUser.photo_url}`;
            }
            
            setUser(telegramUser);
          } else {
            if (tg.initData) {
              try {
                const urlParams = new URLSearchParams(tg.initData);
                const userParam = urlParams.get('user');
                
                if (userParam) {
                  const parsedUser = JSON.parse(decodeURIComponent(userParam));
                  logger.info('User parsed from initData', { id: parsedUser.id });
                  setUser(parsedUser);
                  return;
                }
              } catch (error) {
                logger.error('Error parsing initData', error);
              }
            }
            
            logger.warn('No user data found');
          }
        };
        
        getUserData();
        
        if (!tg.initDataUnsafe?.user) {
          const retryIntervals = [500, 1000, 2000];
          retryIntervals.forEach((delay) => {
            setTimeout(getUserData, delay);
          });
        }
        
        setIsLoading(false);
      } else {
        logger.debug('No Telegram WebApp found - browser mode');
        setUser(null);
        setIsLoading(false);
      }
    };

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      initTelegramUser();
      return;
    }

    const onLoad = () => initTelegramUser();
    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
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
