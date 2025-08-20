import { useState, useEffect } from 'react';
import { TelegramUser } from '@/types/telegram';
import { useNavigate, useLocation } from 'react-router-dom';

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

export const useTelegramAuth = () => {
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [webApp, setWebApp] = useState<any>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const initTelegramUser = () => {
      console.log('🔍 Initializing Telegram user...');
      console.log('🌐 window.Telegram:', window.Telegram);
      console.log('📱 window.Telegram?.WebApp:', window.Telegram?.WebApp);
      
      // Check if we're in Telegram WebApp environment
      if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
        console.log('✅ Telegram WebApp detected');
        const tg = window.Telegram.WebApp;
        setWebApp(tg);
        
        console.log('🚀 Telegram WebApp object:', tg);
        console.log('📊 initData:', tg.initData);
        console.log('🔓 initDataUnsafe:', tg.initDataUnsafe);
        
        // Initialize the app
        tg.ready();
        
        // Enable full-screen mode and viewport expansion
        tg.expand();
        
        // Set viewport to maximum available height
        if (tg.viewportHeight) {
          tg.expand();
          // Force full viewport expansion
          document.documentElement.style.setProperty('--tg-viewport-height', `${tg.viewportHeight}px`);
        }
        
        if (tg.viewportStableHeight) {
          document.documentElement.style.setProperty('--tg-viewport-stable-height', `${tg.viewportStableHeight}px`);
        }
        
        // Apply Telegram theme colors if available
        if (tg.themeParams) {
          const theme = tg.themeParams;
          if (theme.bg_color) {
            document.documentElement.style.setProperty('--tg-theme-bg-color', theme.bg_color);
          }
          if (theme.text_color) {
            document.documentElement.style.setProperty('--tg-theme-text-color', theme.text_color);
          }
        }
        
        // Configure Back Button to always show
        if (tg.BackButton) {
          tg.BackButton.show();
        }
        
        // Handle viewport changes for responsive behavior
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
        
        // Get user data with multiple attempts
        const getUserData = () => {
          const telegramUser = tg.initDataUnsafe?.user;
          const startParam = tg.initDataUnsafe?.start_param;
          console.log('👤 Raw Telegram user data:', telegramUser);
          console.log('🔗 Start param:', startParam);
          
          if (telegramUser && telegramUser.id) {
            console.log('✅ Valid Telegram user found:', telegramUser);
            
            // Ensure photo_url is properly formatted
            if (telegramUser.photo_url && !telegramUser.photo_url.startsWith('http')) {
              telegramUser.photo_url = `https://t.me/i/userpic/320/${telegramUser.photo_url}`;
              console.log('🖼️ Photo URL formatted:', telegramUser.photo_url);
            }
            
            setUser(telegramUser);
            console.log('🎉 Telegram user loaded successfully:', telegramUser);
          } else {
            console.warn('⚠️ No valid Telegram user data in initDataUnsafe');
            
            // Try to get data from initData string
            if (tg.initData) {
              console.log('🔍 Trying to parse initData string...');
              try {
                const urlParams = new URLSearchParams(tg.initData);
                const userParam = urlParams.get('user');
                console.log('📝 User param from initData:', userParam);
                
                if (userParam) {
                  const parsedUser = JSON.parse(decodeURIComponent(userParam));
                  console.log('✅ User parsed from initData:', parsedUser);
                  setUser(parsedUser);
                  return;
                }
              } catch (error) {
                console.error('❌ Error parsing initData:', error);
              }
            }
            
            console.log('⚠️ No user data found, will use development mock data');
          }
        };
        
        // Try to get user data immediately
        getUserData();
        
        // If no user data, wait and try again
        if (!tg.initDataUnsafe?.user) {
          console.log('⏳ No immediate user data, retrying in 500ms...');
          setTimeout(() => {
            console.log('🔄 Retry attempt 1...');
            getUserData();
          }, 500);
          
          setTimeout(() => {
            console.log('🔄 Retry attempt 2...');
            getUserData();
          }, 1000);
          
          setTimeout(() => {
            console.log('🔄 Final retry attempt...');
            getUserData();
          }, 2000);
        }
        
        setIsLoading(false);
      } else {
        console.log('❌ No Telegram WebApp found - running in development mode');
        console.log('🛠️ User Agent:', navigator.userAgent);
        console.log('🌍 Location:', window.location.href);
        
        // For development, use mock data
        const mockUser = {
          id: 123456789,
          first_name: "Test",
          last_name: "User",
          username: "testuser",
          photo_url: "https://via.placeholder.com/150",
          language_code: "en"
        };
        
        console.log('🧪 Using mock user for development:', mockUser);
        setUser(mockUser);
        setIsLoading(false);
      }
    };

    // Wait for window to be fully loaded
    if (document.readyState === 'complete') {
      initTelegramUser();
    } else {
      window.addEventListener('load', initTelegramUser);
      return () => window.removeEventListener('load', initTelegramUser);
    }
  }, []);

  // Handle Back Button functionality
  useEffect(() => {
    if (webApp?.BackButton) {
      const handleBackButton = () => {
        if (window.history.length > 1) {
          navigate(-1);
        } else {
          // Default action when no history
          navigate('/');
        }
      };

      webApp.BackButton.onClick(handleBackButton);
      webApp.BackButton.show();

      return () => {
        if (webApp.BackButton) {
          webApp.BackButton.hide();
        }
      };
    }
  }, [webApp, navigate, location.pathname]);

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