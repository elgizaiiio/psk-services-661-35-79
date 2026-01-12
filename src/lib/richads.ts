// RichAds / TelegramAdsController Manager
// Full-screen native notification ads ($10-12 RPM)

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
  const hasTelegram = !!(telegram?.WebApp?.initData || telegram?.WebApp?.initDataUnsafe?.user);
  console.log('[RichAds] Telegram environment check:', hasTelegram);
  return hasTelegram;
}

/**
 * Check if RichAds controller is ready
 */
export function isRichAdsReady(): boolean {
  const ready = typeof window.TelegramAdsController?.triggerNativeNotification === 'function';
  console.log('[RichAds] Controller ready:', ready, 'TelegramAdsController:', !!window.TelegramAdsController);
  return ready;
}

/**
 * Show RichAds native notification ad
 */
export async function showRichAd(): Promise<{ success: boolean; error?: string }> {
  console.log('[RichAds] showRichAd called');
  
  if (!isTelegramEnvironment()) {
    console.log('[RichAds] Not in Telegram environment');
    return { success: false, error: 'الإعلانات تعمل فقط داخل تيليجرام' };
  }

  if (!isRichAdsReady()) {
    console.log('[RichAds] Controller not ready');
    return { success: false, error: 'الإعلانات غير متاحة حالياً' };
  }

  try {
    console.log('[RichAds] Triggering native notification...');
    const result = await window.TelegramAdsController!.triggerNativeNotification(true);
    console.log('[RichAds] Ad result:', result);
    return { success: true };
  } catch (err) {
    console.error('[RichAds] Error showing ad:', err);
    return { success: false, error: 'لا يوجد إعلان متاح حالياً' };
  }
}
