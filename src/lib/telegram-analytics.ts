import telegramAnalytics from '@telegram-apps/analytics';

/**
 * Initialize Telegram Mini Apps Analytics SDK
 * Required for listing on Telegram Apps Center
 * Get token and app name from @DataChief_bot on Telegram
 */
export const initTelegramAnalytics = () => {
  const token = import.meta.env.VITE_TG_ANALYTICS_TOKEN;
  const appName = import.meta.env.VITE_TG_ANALYTICS_APP_NAME;

  // Only initialize if credentials are available
  if (!token || !appName) {
    console.warn('Telegram Analytics: Missing token or app name. Skipping initialization.');
    return false;
  }

  try {
    telegramAnalytics.init({
      token,
      appName,
    });
    console.log('Telegram Analytics initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize Telegram Analytics:', error);
    return false;
  }
};

/**
 * Check if running inside Telegram WebApp
 */
export const isTelegramWebApp = (): boolean => {
  return typeof window !== 'undefined' && 
         window.Telegram?.WebApp !== undefined;
};
