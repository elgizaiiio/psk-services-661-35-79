import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PromoSettings {
  id: string;
  promo_key: string;
  start_time: string;
  duration_hours: number;
  is_active: boolean;
}

// Cache for promo settings to avoid repeated queries
let cachedSettings: PromoSettings | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 60000; // 1 minute cache

export const usePromoSettings = (promoKey = 'monthly_winner_48h') => {
  const [promoSettings, setPromoSettings] = useState<PromoSettings | null>(cachedSettings);
  const [loading, setLoading] = useState(!cachedSettings);
  const [timeRemaining, setTimeRemaining] = useState(0);

  const fetchPromoSettings = useCallback(async () => {
    // Use cache if fresh
    if (cachedSettings && Date.now() - cacheTimestamp < CACHE_DURATION) {
      setPromoSettings(cachedSettings);
      setLoading(false);
      return cachedSettings;
    }

    try {
      const { data, error } = await supabase
        .from('promo_settings')
        .select('*')
        .eq('promo_key', promoKey)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('Error fetching promo settings:', error);
        return null;
      }

      if (data) {
        cachedSettings = data as unknown as PromoSettings;
        cacheTimestamp = Date.now();
        setPromoSettings(cachedSettings);
      }
      
      return data as unknown as PromoSettings | null;
    } catch (err) {
      console.error('Error in fetchPromoSettings:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [promoKey]);

  // Calculate time remaining based on server time
  const calculateTimeRemaining = useCallback(() => {
    if (!promoSettings) return 0;

    const startTime = new Date(promoSettings.start_time).getTime();
    const durationMs = promoSettings.duration_hours * 60 * 60 * 1000;
    const endTime = startTime + durationMs;
    const now = Date.now();
    
    return Math.max(0, endTime - now);
  }, [promoSettings]);

  // Check if promo is active
  const isPromoActive = useCallback(() => {
    if (!promoSettings || !promoSettings.is_active) return false;
    return calculateTimeRemaining() > 0;
  }, [promoSettings, calculateTimeRemaining]);

  // Initial fetch
  useEffect(() => {
    fetchPromoSettings();
  }, [fetchPromoSettings]);

  // Update timer every second
  useEffect(() => {
    const updateTimer = () => {
      setTimeRemaining(calculateTimeRemaining());
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [calculateTimeRemaining]);

  return {
    promoSettings,
    loading,
    timeRemaining,
    isPromoActive: isPromoActive(),
    refetch: fetchPromoSettings,
  };
};

// Utility functions for use outside of hooks
export const getPromoSettingsSync = () => cachedSettings;

export const isPromoActiveSync = () => {
  if (!cachedSettings || !cachedSettings.is_active) return false;
  
  const startTime = new Date(cachedSettings.start_time).getTime();
  const durationMs = cachedSettings.duration_hours * 60 * 60 * 1000;
  const endTime = startTime + durationMs;
  
  return Date.now() < endTime;
};

export const getPromoTimeRemainingSync = () => {
  if (!cachedSettings) return 0;
  
  const startTime = new Date(cachedSettings.start_time).getTime();
  const durationMs = cachedSettings.duration_hours * 60 * 60 * 1000;
  const endTime = startTime + durationMs;
  
  return Math.max(0, endTime - Date.now());
};
