import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export const useTelegramBackButton = (customBackPath?: string) => {
  const navigate = useNavigate();
  const location = useLocation();
  const handlerRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const webApp = (window as any).Telegram?.WebApp;
    if (!webApp?.BackButton) return;

    const isHomePage = location.pathname === '/' || location.pathname === '/index';

    // Safely show/hide BackButton
    try {
      if (isHomePage) {
        webApp.BackButton.hide();
      } else {
        webApp.BackButton.show();
      }
    } catch (e) {
      // Ignore BackButton visibility errors
    }

    // Create handler and store reference
    const handleBack = () => {
      try {
        if (customBackPath) {
          navigate(customBackPath);
        } else {
          navigate(-1);
        }
      } catch (e) {
        // Fallback to home
        try {
          navigate('/');
        } catch {
          // Ignore navigation errors
        }
      }
    };

    handlerRef.current = handleBack;

    // Safely register click handler
    try {
      webApp.BackButton.onClick(handleBack);
    } catch (e) {
      // Ignore registration errors
    }

    // Cleanup with full error protection
    return () => {
      try {
        if (handlerRef.current && webApp?.BackButton?.offClick) {
          webApp.BackButton.offClick(handlerRef.current);
        }
      } catch (e) {
        // Ignore cleanup errors completely
      }
      handlerRef.current = null;
    };
  }, [navigate, location.pathname, customBackPath]);
};
