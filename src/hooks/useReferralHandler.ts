import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTelegramAuth } from './useTelegramAuth';
import { useToast } from '@/hooks/use-toast';
import { createLogger } from '@/lib/logger';

const logger = createLogger('ReferralHandler');

export const useReferralHandler = () => {
  const { user: tgUser, webApp } = useTelegramAuth();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const handleReferral = async () => {
      // DISABLED: Referral processing is now handled exclusively by telegram-webhook 
      // when user clicks /start. This prevents double-counting of referrals.
      // The telegram-webhook already:
      // 1. Registers the user with referred_by field
      // 2. Creates bolt_referrals record
      // 3. Updates referrer's token_balance, total_referrals, referral_bonus
      // 4. Sends Telegram notification to referrer
      
      if (!tgUser) return;
      
      // Just log for debugging - don't process
      let startParam: string | null = null;
      
      if (webApp?.initDataUnsafe?.start_param) {
        startParam = webApp.initDataUnsafe.start_param;
      }
      
      if (startParam) {
        logger.info(`Referral param detected: "${startParam}" - Already processed by telegram-webhook`);
      }
    };

    handleReferral();
  }, [tgUser, webApp]);

  return { isProcessing };
};
