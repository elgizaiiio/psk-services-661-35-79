// Monetag SDK Manager for Telegram Mini Apps
// Using official NPM package: monetag-tg-sdk
// Zone ID: 10545446

import createAdHandler from 'monetag-tg-sdk';

const ZONE_ID = 10545446;

// Create ad handler instance
let adHandler: ReturnType<typeof createAdHandler> | null = null;
let initPromise: Promise<boolean> | null = null;

/**
 * Check if we're in Telegram environment
 */
export function isTelegramEnvironment(): boolean {
  const telegram = (window as any).Telegram;
  return !!(telegram?.WebApp?.initData || telegram?.WebApp?.initDataUnsafe?.user);
}

/**
 * Initialize Monetag SDK
 */
export function initMonetagSDK(): Promise<boolean> {
  if (initPromise) return initPromise;

  initPromise = new Promise((resolve) => {
    try {
      if (!isTelegramEnvironment()) {
        console.log('[Monetag] Not in Telegram environment');
        resolve(false);
        return;
      }

      adHandler = createAdHandler(ZONE_ID);
      console.log('[Monetag] SDK initialized with zone:', ZONE_ID);
      resolve(true);
    } catch (err) {
      console.error('[Monetag] Failed to initialize:', err);
      resolve(false);
    }
  });

  return initPromise;
}

/**
 * Check if Monetag SDK is ready
 */
export async function isMonetagReady(): Promise<boolean> {
  if (!isTelegramEnvironment()) return false;
  return await initMonetagSDK();
}

/**
 * Show Rewarded Interstitial Ad
 * Native ad with reward for viewing
 */
export async function showRewardedInterstitial(): Promise<{ success: boolean; error?: string }> {
  if (!isTelegramEnvironment()) {
    return { success: false, error: 'Ads only work in Telegram' };
  }

  const isReady = await initMonetagSDK();
  
  if (!isReady || !adHandler) {
    return { success: false, error: 'Ad service unavailable' };
  }

  try {
    console.log('[Monetag] Showing rewarded interstitial...');
    await adHandler();
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

  const isReady = await initMonetagSDK();
  
  if (!isReady || !adHandler) {
    return { success: false, error: 'Ad service unavailable' };
  }

  try {
    console.log('[Monetag] Showing rewarded popup...');
    await adHandler({ type: 'pop' });
    console.log('[Monetag] Popup ad completed');
    return { success: true };
  } catch (err) {
    console.error('[Monetag] Popup ad error:', err);
    return { success: false, error: 'Failed to show ad' };
  }
}

// Export default ad show function (uses interstitial)
export const showAd = showRewardedInterstitial;
