// RichAds / TelegramAdsController Manager
// Replaces AdsGram with RichAds full-screen native notification ads

interface TelegramAdsControllerType {
  triggerNativeNotification: (enabled: boolean) => Promise<{ clicked: boolean }>;
}

declare global {
  interface Window {
    TelegramAdsController?: TelegramAdsControllerType;
  }
}

/**
 * Check if we're in Telegram environment
 */
export function isTelegramEnvironment(): boolean {
  const telegram = (window as any).Telegram;
  return !!(telegram?.WebApp?.initData || telegram?.WebApp?.initDataUnsafe?.user);
}

/**
 * Check if RichAds controller is ready
 */
export function isRichAdsReady(): boolean {
  return typeof window.TelegramAdsController?.triggerNativeNotification === 'function';
}

/**
 * Show RichAds native notification ad
 */
export async function showRichAd(): Promise<{ success: boolean; error?: string }> {
  if (!isTelegramEnvironment()) {
    return { success: false, error: 'Ads only work in Telegram' };
  }

  if (!isRichAdsReady()) {
    return { success: false, error: 'Ad controller not ready' };
  }

  try {
    const result = await window.TelegramAdsController!.triggerNativeNotification(true);
    // Ad was clicked = success
    console.log('[RichAds] Ad result:', result);
    return { success: true };
  } catch (err) {
    console.error('[RichAds] Error showing ad:', err);
    return { success: false, error: 'No ad available' };
  }
}
