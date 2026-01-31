// Monetag SDK Manager for Telegram Mini Apps
// Zone ID: 10545446

declare global {
  interface Window {
    show_10545446?: (type?: 'pop') => Promise<void>;
  }
}

const MAX_RETRIES = 15;
const RETRY_DELAY = 400;

let sdkLoadPromise: Promise<boolean> | null = null;

/**
 * Check if we're in Telegram environment
 */
export function isTelegramEnvironment(): boolean {
  const telegram = (window as any).Telegram;
  return !!(telegram?.WebApp?.initData || telegram?.WebApp?.initDataUnsafe?.user);
}

/**
 * Wait for Monetag SDK to be ready
 */
export function loadMonetagSDK(): Promise<boolean> {
  if (sdkLoadPromise) return sdkLoadPromise;

  sdkLoadPromise = new Promise((resolve) => {
    // Check if already loaded
    if (typeof window.show_10545446 === 'function') {
      console.log('[Monetag] SDK already available');
      resolve(true);
      return;
    }

    let retryCount = 0;

    const checkSDK = () => {
      if (typeof window.show_10545446 === 'function') {
        console.log('[Monetag] SDK loaded successfully');
        resolve(true);
        return;
      }

      if (retryCount >= MAX_RETRIES) {
        console.error('[Monetag] SDK failed to load after', MAX_RETRIES, 'retries');
        resolve(false);
        return;
      }

      retryCount++;
      console.log(`[Monetag] Waiting for SDK... attempt ${retryCount}/${MAX_RETRIES}`);
      setTimeout(checkSDK, RETRY_DELAY);
    };

    checkSDK();
  });

  return sdkLoadPromise;
}

/**
 * Check if Monetag SDK is ready
 */
export async function isMonetagReady(): Promise<boolean> {
  if (!isTelegramEnvironment()) return false;
  return await loadMonetagSDK();
}

/**
 * Show Rewarded Interstitial Ad
 * Native ad with reward for viewing
 */
export async function showRewardedInterstitial(): Promise<{ success: boolean; error?: string }> {
  if (!isTelegramEnvironment()) {
    return { success: false, error: 'Ads only work in Telegram' };
  }

  const isReady = await loadMonetagSDK();
  
  if (!isReady || typeof window.show_10545446 !== 'function') {
    return { success: false, error: 'Ad service unavailable' };
  }

  try {
    console.log('[Monetag] Showing rewarded interstitial...');
    await window.show_10545446();
    console.log('[Monetag] Ad completed successfully');
    return { success: true };
  } catch (err) {
    console.error('[Monetag] Ad error:', err);
    return { success: false, error: 'Failed to show ad' };
  }
}

/**
 * Show Rewarded Popup Ad
 * Direct to offer page, user gets reward after interaction
 */
export async function showRewardedPopup(): Promise<{ success: boolean; error?: string }> {
  if (!isTelegramEnvironment()) {
    return { success: false, error: 'Ads only work in Telegram' };
  }

  const isReady = await loadMonetagSDK();
  
  if (!isReady || typeof window.show_10545446 !== 'function') {
    return { success: false, error: 'Ad service unavailable' };
  }

  try {
    console.log('[Monetag] Showing rewarded popup...');
    await window.show_10545446('pop');
    console.log('[Monetag] Popup ad completed');
    return { success: true };
  } catch (err) {
    console.error('[Monetag] Popup ad error:', err);
    return { success: false, error: 'Failed to show ad' };
  }
}

// Export default ad show function (uses interstitial)
export const showAd = showRewardedInterstitial;
