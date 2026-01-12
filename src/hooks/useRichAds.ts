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
    console.log('[useRichAds] Initializing, isTelegram:', isTelegram);
    
    if (!isTelegram) {
      setError('افتح التطبيق من تيليجرام');
      return;
    }

    let mounted = true;
    let retries = 0;
    const maxRetries = 30; // Increased retries

    const checkReady = () => {
      if (!mounted) return;
      
      const ready = isRichAdsReady();
      console.log(`[useRichAds] Check ready attempt ${retries + 1}/${maxRetries}:`, ready);
      
      if (ready) {
        setIsReady(true);
        setError(null);
        console.log('[useRichAds] Controller is ready!');
      } else if (retries < maxRetries) {
        retries++;
        setTimeout(checkReady, 300);
      } else {
        setError('الإعلانات غير متاحة حالياً');
        console.error('[useRichAds] Controller not available after', maxRetries, 'retries');
      }
    };

    // Start checking after a small delay to allow script to load
    setTimeout(checkReady, 500);

    return () => {
      mounted = false;
    };
  }, [isTelegram]);

  const showAd = useCallback(async (): Promise<boolean> => {
    console.log('[useRichAds] showAd called, isTelegram:', isTelegram, 'isReady:', isReady);
    
    if (!isTelegram) {
      setError('افتح التطبيق من تيليجرام');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await showRichAd();
      console.log('[useRichAds] showAd result:', result);
      
      if (result.success) {
        return true;
      } else {
        setError(result.error || 'فشل في عرض الإعلان');
        return false;
      }
    } catch (err) {
      console.error('[useRichAds] Error showing ad:', err);
      setError('فشل في عرض الإعلان');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isTelegram, isReady]);

  return {
    showAd,
    isReady,
    isLoading,
    error,
    isTelegram,
  };
};
