import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export const useTelegramBackButton = (customBackPath?: string) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const webApp = (window as any).Telegram?.WebApp;
    if (!webApp?.BackButton) return;

    const isHomePage = location.pathname === '/' || location.pathname === '/index';

    if (isHomePage) {
      webApp.BackButton.hide();
    } else {
      webApp.BackButton.show();
    }

    const handleBack = () => {
      if (customBackPath) {
        navigate(customBackPath);
      } else {
        navigate(-1);
      }
    };

    webApp.BackButton.onClick(handleBack);

    return () => {
      webApp.BackButton.offClick(handleBack);
    };
  }, [navigate, location.pathname, customBackPath]);
};
