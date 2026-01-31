import { useCallback, useEffect, useState } from 'react';
import { 
  isTelegramEnvironment,
  loadMonetagSDK,
  showRewardedInterstitial 
} from '@/lib/monetag';

interface UseMonetagRewardedReturn {
  showAd: () => Promise<boolean>;
  isReady: boolean;
  isLoading: boolean;
  error: string | null;
  isTelegram: boolean;
}

export const useMonetagRewarded = (): UseMonetagRewardedReturn => {
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

    const init = async () => {
      const ready = await loadMonetagSDK();
      if (mounted) {
        if (ready) {
          setIsReady(true);
          setError(null);
        } else {
          setError('الإعلانات غير متاحة حالياً');
        }
      }
    };

    init();

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
      const result = await showRewardedInterstitial();
      
      if (result.success) {
        return true;
      } else {
        setError(result.error || 'فشل في عرض الإعلان');
        return false;
      }
    } catch (err) {
      console.error('Error showing rewarded ad:', err);
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
