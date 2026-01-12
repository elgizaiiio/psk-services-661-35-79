import { useCallback, useEffect, useState } from 'react';
import { isTelegramEnvironment, isRichAdsReady, showRichAd } from '@/lib/richads';

interface UseRichAdsReturn {
  showAd: () => Promise<boolean>;
  isReady: boolean;
  isLoading: boolean;
  error: string | null;
  isTelegram: boolean;
}

export const useRichAds = (): UseRichAdsReturn => {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTelegram] = useState(() => isTelegramEnvironment());

  useEffect(() => {
    if (!isTelegram) {
      setError('افتح التطبيق من تيليجرام');
      return;
    }

    let mounted = true;
    let retries = 0;
    const maxRetries = 20;

    const checkReady = () => {
      if (!mounted) return;
      
      if (isRichAdsReady()) {
        setIsReady(true);
        setError(null);
        console.log('[RichAds] Controller ready');
      } else if (retries < maxRetries) {
        retries++;
        console.log(`[RichAds] Waiting for controller... attempt ${retries}/${maxRetries}`);
        setTimeout(checkReady, 300);
      } else {
        setError('الإعلانات غير متاحة حالياً');
        console.error('[RichAds] Controller not available after retries');
      }
    };

    checkReady();

    return () => {
      mounted = false;
    };
  }, [isTelegram]);

  const showAd = useCallback(async (): Promise<boolean> => {
    if (!isTelegram) {
      setError('افتح التطبيق من تيليجرام');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await showRichAd();
      
      if (result.success) {
        return true;
      } else {
        setError(result.error || 'فشل في عرض الإعلان');
        return false;
      }
    } catch (err) {
      console.error('Error showing ad:', err);
      setError('فشل في عرض الإعلان');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isTelegram]);

  return {
    showAd,
    isReady,
    isLoading,
    error,
    isTelegram,
  };
};
