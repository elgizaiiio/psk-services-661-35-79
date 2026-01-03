import { useCallback, useEffect, useRef, useState } from 'react';

// AdsGram Block ID for Rewarded Ads (Watch Ad for rewards, Spin double)
const ADSGRAM_REWARDED_BLOCK_ID = '20517';

declare global {
  interface Window {
    Adsgram?: {
      init: (config: { blockId: string; debug?: boolean }) => AdController;
    };
  }
}

interface AdController {
  show: () => Promise<{ done: boolean; description: string; state: string; error?: boolean }>;
  destroy: () => void;
}

interface UseAdsGramRewardedReturn {
  showAd: () => Promise<boolean>;
  isReady: boolean;
  isLoading: boolean;
  error: string | null;
}

export const useAdsGramRewarded = (): UseAdsGramRewardedReturn => {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AdController | null>(null);

  useEffect(() => {
    const checkAdsGram = () => {
      if (window.Adsgram) {
        try {
          controllerRef.current = window.Adsgram.init({
            blockId: ADSGRAM_REWARDED_BLOCK_ID,
            debug: false,
          });
          setIsReady(true);
          console.log('AdsGram Rewarded initialized successfully');
        } catch (err) {
          console.error('Failed to initialize AdsGram Rewarded:', err);
          setError('Failed to initialize ads');
        }
      }
    };

    checkAdsGram();
    const timeout = setTimeout(checkAdsGram, 2000);

    return () => {
      clearTimeout(timeout);
      if (controllerRef.current) {
        controllerRef.current.destroy();
      }
    };
  }, []);

  const showAd = useCallback(async (): Promise<boolean> => {
    if (!controllerRef.current) {
      console.warn('AdsGram Rewarded not initialized');
      setError('Ads not available');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await controllerRef.current.show();
      console.log('Rewarded Ad result:', result);
      
      if (result.done) {
        return true;
      } else {
        if (result.error) {
          setError(result.description || 'Ad failed to load');
        }
        return false;
      }
    } catch (err) {
      console.error('Error showing rewarded ad:', err);
      setError('Failed to show ad');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    showAd,
    isReady,
    isLoading,
    error,
  };
};
