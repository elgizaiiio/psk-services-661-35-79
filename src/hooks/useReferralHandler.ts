import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTelegramAuth } from './useTelegramAuth';
import { useToast } from '@/hooks/use-toast';

export const useReferralHandler = () => {
  const { user: tgUser, webApp } = useTelegramAuth();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const handleReferral = async () => {
      if (!tgUser || isProcessing) return;

      // Enhanced start parameter extraction with better logging
      let startParam = null;
      let paramSource = '';
      
      // Strategy 1: WebApp initData (most reliable for Telegram)
      if (webApp?.initDataUnsafe?.start_param) {
        startParam = webApp.initDataUnsafe.start_param;
        paramSource = 'webApp.initDataUnsafe.start_param';
        console.log('🔗 Start param from webApp:', startParam);
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
            console.log(`🔗 Start param from URL (${param}):`, startParam);
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
            console.log(`🔗 Start param from hash (${param}):`, startParam);
            break;
          }
        }
      }

      // Strategy 4: Telegram WebApp launch params
      if (!startParam && webApp?.initData) {
        try {
          // Parse the init data string for start_param
          const params = new URLSearchParams(webApp.initData);
          const user = params.get('user');
          if (user) {
            const userData = JSON.parse(decodeURIComponent(user));
            if (userData.start_param) {
              startParam = userData.start_param;
              paramSource = 'webApp.initData.user.start_param';
              console.log('🔗 Start param from initData user:', startParam);
            }
          }
        } catch (e) {
          console.log('⚠️ Could not parse initData for start_param:', e);
        }
      }

      if (!startParam) {
        console.log('❌ No referral parameter found in any source');
        console.log('🔍 Debug info:', {
          webApp_available: !!webApp,
          initDataUnsafe: webApp?.initDataUnsafe,
          search: window.location.search,
          hash: window.location.hash,
          userAgent: navigator.userAgent
        });
        return;
      }

      console.log(`🔗 Referral param detected: "${startParam}" from ${paramSource}`);
      setIsProcessing(true);

      try {
        // Use the new Edge Function for processing
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
          console.error('❌ Edge function error:', error);
          toast({
            title: "Processing Error",
            description: "An error occurred while processing the referral. Will try again later.",
            variant: "destructive"
          });
          return;
        }

        console.log('📊 Referral processing result:', data);

        if (data.success) {
          toast({
            title: "🎉 Welcome!",
            description: "Successfully registered via referral link",
          });
        } else {
          // Handle different failure scenarios
          if (data.message.includes('already exists')) {
            console.log('👤 User or referral already exists');
          } else if (data.message.includes('not found')) {
            toast({
              title: "⏳ الإحالة قيد المعالجة",
              description: "Referrer not found currently. Referral will be processed when they register.",
            });
          } else {
            console.log('⚠️ Referral processing issue:', data.message);
          }
        }

      } catch (error) {
        console.error('❌ Error calling referral processing:', error);
        toast({
          title: "Network Error",
          description: "Unable to connect to server. Will try again later.",
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