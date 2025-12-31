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

    // Safely register click handler (support multiple Telegram WebApp APIs)
    try {
      const bb = webApp.BackButton;
      if (bb?.onClick) {
        bb.onClick(handleBack);
      } else if (typeof webApp?.onEvent === 'function') {
        webApp.onEvent('backButtonClicked', handleBack);
      }
    } catch (e) {
      // Ignore registration errors
    }

    // Cleanup with full error protection
    return () => {
      try {
        const bb = webApp?.BackButton;
        if (handlerRef.current) {
          if (bb?.offClick) {
            bb.offClick(handlerRef.current);
          } else if (typeof webApp?.offEvent === 'function') {
            webApp.offEvent('backButtonClicked', handlerRef.current);
          }
        }
      } catch (e) {
        // Ignore cleanup errors completely
      }
      handlerRef.current = null;
    };
  }, [navigate, location.pathname, customBackPath]);
};
