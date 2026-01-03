import { useCallback, useEffect, useRef, useState } from 'react';

// AdsGram Block ID - Replace with your actual Block ID
const ADSGRAM_BLOCK_ID = '7598'; // Default test block ID

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

interface UseAdsGramReturn {
  showAd: () => Promise<boolean>;
  isReady: boolean;
  isLoading: boolean;
  error: string | null;
}

export const useAdsGram = (): UseAdsGramReturn => {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AdController | null>(null);

  useEffect(() => {
    // Check if AdsGram SDK is loaded
    const checkAdsGram = () => {
      if (window.Adsgram) {
        try {
          controllerRef.current = window.Adsgram.init({
            blockId: ADSGRAM_BLOCK_ID,
            debug: false,
          });
          setIsReady(true);
          console.log('AdsGram initialized successfully');
        } catch (err) {
          console.error('Failed to initialize AdsGram:', err);
          setError('Failed to initialize ads');
        }
      }
    };

    // Check immediately
    checkAdsGram();

    // Also check after a delay in case SDK loads late
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
      console.warn('AdsGram not initialized');
      setError('Ads not available');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await controllerRef.current.show();
      console.log('Ad result:', result);
      
      if (result.done) {
        return true;
      } else {
        // User closed ad early or error
        if (result.error) {
          setError(result.description || 'Ad failed to load');
        }
        return false;
      }
    } catch (err) {
      console.error('Error showing ad:', err);
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
