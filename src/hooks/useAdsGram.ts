import { useCallback, useEffect, useState } from 'react';
import { 
  BLOCK_IDS, 
  getController, 
  isTelegramEnvironment,
  showAd as showAdFromManager 
} from '@/lib/adsgram';

interface UseAdsGramReturn {
  showAd: () => Promise<boolean>;
  isReady: boolean;
  isLoading: boolean;
  error: string | null;
  isTelegram: boolean;
}

export const useAdsGram = (): UseAdsGramReturn => {
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
      const controller = await getController(BLOCK_IDS.REWARDED);
      if (mounted) {
        if (controller) {
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
      const result = await showAdFromManager(BLOCK_IDS.REWARDED);
      
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
