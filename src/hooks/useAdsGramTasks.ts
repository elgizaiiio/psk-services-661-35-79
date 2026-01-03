import { useCallback, useEffect, useRef, useState } from 'react';

// AdsGram Block ID for Tasks Ads
const ADSGRAM_TASKS_BLOCK_ID = '20526';

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

interface UseAdsGramTasksReturn {
  showAd: () => Promise<boolean>;
  isReady: boolean;
  isLoading: boolean;
  error: string | null;
}

export const useAdsGramTasks = (): UseAdsGramTasksReturn => {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AdController | null>(null);
  const initAttempted = useRef(false);

  useEffect(() => {
    if (initAttempted.current) return;
    
    const checkAdsGram = () => {
      if (initAttempted.current) return;
      
      try {
        if (window.Adsgram) {
          initAttempted.current = true;
          controllerRef.current = window.Adsgram.init({
            blockId: ADSGRAM_TASKS_BLOCK_ID,
            debug: false,
          });
          setIsReady(true);
          console.log('AdsGram Tasks initialized successfully with block ID:', ADSGRAM_TASKS_BLOCK_ID);
        }
      } catch (err) {
        console.error('Failed to initialize AdsGram Tasks:', err);
        setError('Failed to initialize ads');
        initAttempted.current = true;
      }
    };

    // Check immediately
    checkAdsGram();
    
    // Also check after a delay in case SDK loads late
    const timeout = setTimeout(checkAdsGram, 2000);

    return () => {
      clearTimeout(timeout);
      try {
        if (controllerRef.current) {
          controllerRef.current.destroy();
        }
      } catch (e) {
        // Ignore destroy errors
      }
    };
  }, []);

  const showAd = useCallback(async (): Promise<boolean> => {
    if (!controllerRef.current) {
      console.warn('AdsGram Tasks not initialized');
      setError('Ads not available');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await controllerRef.current.show();
      console.log('Tasks Ad result:', result);
      
      if (result.done) {
        return true;
      } else {
        if (result.error) {
          setError(result.description || 'Ad failed to load');
        }
        return false;
      }
    } catch (err) {
      console.error('Error showing tasks ad:', err);
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
