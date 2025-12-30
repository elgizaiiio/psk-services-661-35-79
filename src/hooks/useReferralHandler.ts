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
      if (!tgUser || isProcessing) return;

      let startParam: string | null = null;
      let paramSource = '';
      
      // Strategy 1: WebApp initData
      if (webApp?.initDataUnsafe?.start_param) {
        startParam = webApp.initDataUnsafe.start_param;
        paramSource = 'webApp.initDataUnsafe.start_param';
        logger.debug('Start param from webApp', startParam);
      }
      
      // Strategy 2: URL query parameters
      if (!startParam) {
        const urlParams = new URLSearchParams(window.location.search);
        const candidates = ['startapp', 'start', 'ref', 'referral'];
        
        for (const param of candidates) {
          const value = urlParams.get(param);
          if (value) {
            startParam = value;
            paramSource = `URL query: ${param}`;
            logger.debug(`Start param from URL (${param})`, startParam);
            break;
          }
        }
      }
      
      // Strategy 3: Hash parameters
      if (!startParam && window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const candidates = ['startapp', 'start', 'ref', 'referral'];
        
        for (const param of candidates) {
          const value = hashParams.get(param);
          if (value) {
            startParam = value;
            paramSource = `URL hash: ${param}`;
            logger.debug(`Start param from hash (${param})`, startParam);
            break;
          }
        }
      }

      // Strategy 4: Telegram WebApp launch params
      if (!startParam && webApp?.initData) {
        try {
          const params = new URLSearchParams(webApp.initData);
          const user = params.get('user');
          if (user) {
            const userData = JSON.parse(decodeURIComponent(user));
            if (userData.start_param) {
              startParam = userData.start_param;
              paramSource = 'webApp.initData.user.start_param';
              logger.debug('Start param from initData user', startParam);
            }
          }
        } catch (e) {
          logger.warn('Could not parse initData for start_param', e);
        }
      }

      if (!startParam) {
        logger.debug('No referral parameter found');
        return;
      }

      logger.info(`Referral param detected: "${startParam}" from ${paramSource}`);
      setIsProcessing(true);

      try {
        const { data, error } = await supabase.functions.invoke('process-referral', {
          body: {
            telegram_id: tgUser.id,
            telegram_username: tgUser.username,
            first_name: tgUser.first_name,
            last_name: tgUser.last_name,
            photo_url: tgUser.photo_url,
            referral_param: startParam,
            initData: {
              source: paramSource,
              webApp: webApp?.initDataUnsafe,
              userAgent: navigator.userAgent,
              timestamp: new Date().toISOString()
            }
          }
        });

        if (error) {
          logger.error('Edge function error', error);
          toast({
            title: "Processing Error",
            description: "An error occurred while processing the referral.",
            variant: "destructive"
          });
          return;
        }

        logger.info('Referral processing result', data);

        if (data.success) {
          toast({
            title: "🎉 Welcome!",
            description: "Successfully registered via referral link",
          });
        } else {
          if (data.message?.includes('already exists')) {
            logger.debug('User or referral already exists');
          } else if (data.message?.includes('not found')) {
            toast({
              title: "⏳ Processing",
              description: "Referrer not found. Referral will be processed when they register.",
            });
          } else {
            logger.warn('Referral processing issue', data.message);
          }
        }

      } catch (error) {
        logger.error('Error calling referral processing', error);
        toast({
          title: "Network Error",
          description: "Unable to connect to server.",
          variant: "destructive"
        });
      } finally {
        setIsProcessing(false);
      }
    };

    handleReferral();
  }, [tgUser, webApp, isProcessing, toast]);

  return { isProcessing };
};
