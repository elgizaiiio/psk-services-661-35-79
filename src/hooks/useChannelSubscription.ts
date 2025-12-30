import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseChannelSubscriptionReturn {
  isSubscribed: boolean;
  isChecking: boolean;
  error: string | null;
  checkSubscription: (telegramId: number) => Promise<boolean>;
}

export const useChannelSubscription = (channelUsername: string = 'boltcomm'): UseChannelSubscriptionReturn => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkSubscription = useCallback(async (telegramId: number): Promise<boolean> => {
    setIsChecking(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('check-subscription', {
        body: { telegramId, channelUsername }
      });

      if (fnError) {
        console.error('Error checking subscription:', fnError);
        setError('Failed to check subscription');
        setIsSubscribed(false);
        return false;
      }

      const subscribed = data?.isSubscribed || false;
      setIsSubscribed(subscribed);
      return subscribed;

    } catch (err) {
      console.error('Error in checkSubscription:', err);
      setError('Network error');
      setIsSubscribed(false);
      return false;
    } finally {
      setIsChecking(false);
    }
  }, [channelUsername]);

  return {
    isSubscribed,
    isChecking,
    error,
    checkSubscription
  };
};
