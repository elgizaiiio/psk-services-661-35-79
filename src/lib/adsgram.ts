// AdsGram Singleton Manager
// Ensures SDK loads once and controllers are shared across components

interface AdController {
  show: () => Promise<{ done: boolean; description: string; state: string; error?: boolean }>;
  destroy: () => void;
}

interface AdsGramSDK {
  init: (config: { blockId: string; debug?: boolean }) => AdController;
}

declare global {
  interface Window {
    Adsgram?: AdsGramSDK;
  }
}

const ADSGRAM_SCRIPT_URL = 'https://sad.adsgram.ai/js/sad.min.js';
const MAX_RETRIES = 15;
const RETRY_DELAY = 400;

// Singleton state
let sdkLoadPromise: Promise<boolean> | null = null;
const controllerCache = new Map<string, AdController>();
const controllerPromises = new Map<string, Promise<AdController | null>>();

/**
 * Check if we're in Telegram environment
 */
export function isTelegramEnvironment(): boolean {
  const telegram = (window as any).Telegram;
  return !!(telegram?.WebApp?.initData || telegram?.WebApp?.initDataUnsafe?.user);
}

/**
 * Load AdsGram SDK with retries
 */
export function loadAdsGramSDK(): Promise<boolean> {
  if (sdkLoadPromise) return sdkLoadPromise;

  sdkLoadPromise = new Promise((resolve) => {
    // Check if already loaded
    if (window.Adsgram) {
      console.log('[AdsGram] SDK already available');
      resolve(true);
      return;
    }

    let retryCount = 0;

    const checkSDK = () => {
      if (window.Adsgram) {
        console.log('[AdsGram] SDK loaded successfully');
        resolve(true);
        return;
      }

      if (retryCount >= MAX_RETRIES) {
        console.error('[AdsGram] SDK failed to load after', MAX_RETRIES, 'retries');
        resolve(false);
        return;
      }

      retryCount++;
      console.log(`[AdsGram] Waiting for SDK... attempt ${retryCount}/${MAX_RETRIES}`);
      setTimeout(checkSDK, RETRY_DELAY);
    };

    // Try to inject script if not present
    const existingScript = document.querySelector(`script[src*="sad.min.js"]`);
    if (!existingScript) {
      console.log('[AdsGram] Injecting SDK script');
      const script = document.createElement('script');
      script.src = ADSGRAM_SCRIPT_URL;
      script.async = true;
      script.onload = () => {
        console.log('[AdsGram] Script onload fired');
        checkSDK();
      };
      script.onerror = () => {
        console.error('[AdsGram] Script failed to load');
        resolve(false);
      };
      document.head.appendChild(script);
    } else {
      // Script exists, just wait for SDK
      checkSDK();
    }
  });

  return sdkLoadPromise;
}

/**
 * Get or create controller for a block ID (singleton per blockId)
 */
export function getController(blockId: string): Promise<AdController | null> {
  // Return cached controller if exists
  const cached = controllerCache.get(blockId);
  if (cached) {
    return Promise.resolve(cached);
  }

  // Return existing promise if initialization in progress
  const existingPromise = controllerPromises.get(blockId);
  if (existingPromise) {
    return existingPromise;
  }

  // Create new initialization promise
  const promise = (async () => {
    const sdkLoaded = await loadAdsGramSDK();
    
    if (!sdkLoaded || !window.Adsgram) {
      console.error('[AdsGram] Cannot create controller - SDK not available');
      return null;
    }

    try {
      const controller = window.Adsgram.init({
        blockId,
        debug: false,
      });
      
      controllerCache.set(blockId, controller);
      console.log('[AdsGram] Controller created for blockId:', blockId);
      return controller;
    } catch (err) {
      console.error('[AdsGram] Failed to init controller:', err);
      return null;
    }
  })();

  controllerPromises.set(blockId, promise);
  return promise;
}

/**
 * Show ad for a specific block ID
 */
export async function showAd(blockId: string): Promise<{ success: boolean; error?: string }> {
  if (!isTelegramEnvironment()) {
    return { success: false, error: 'Ads only work in Telegram' };
  }

  const controller = await getController(blockId);
  
  if (!controller) {
    return { success: false, error: 'Ad service unavailable' };
  }

  try {
    const result = await controller.show();
    console.log('[AdsGram] Show result:', result);
    
    if (result.done) {
      return { success: true };
    } else {
      return { 
        success: false, 
        error: result.description || 'No ad available' 
      };
    }
  } catch (err) {
    console.error('[AdsGram] Show error:', err);
    return { success: false, error: 'Failed to show ad' };
  }
}

/**
 * Check if ads are ready for a block ID
 */
export async function isAdReady(blockId: string): Promise<boolean> {
  if (!isTelegramEnvironment()) return false;
  const controller = await getController(blockId);
  return controller !== null;
}

// Block IDs
export const BLOCK_IDS = {
  REWARDED: '20527',
  TASKS: '20526',
} as const;
