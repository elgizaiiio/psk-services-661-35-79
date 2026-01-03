import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    
    // Extract AdsGram parameters
    const campaignId = url.searchParams.get('cid') || url.searchParams.get('campaign_id');
    const bannerId = url.searchParams.get('bid') || url.searchParams.get('banner_id');
    const publisherId = url.searchParams.get('pid') || url.searchParams.get('publisher_id');
    const clickId = url.searchParams.get('click_id');
    const recordData = url.searchParams.get('record_data');
    
    console.log('AdsGram tracking received:', {
      campaignId,
      bannerId,
      publisherId,
      clickId,
      recordData
    });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Store the click data
    if (clickId) {
      const { error } = await supabase
        .from('ad_clicks')
        .upsert({
          campaign_id: campaignId,
          banner_id: bannerId,
          publisher_id: publisherId,
          click_id: clickId,
        }, {
          onConflict: 'click_id'
        });

      if (error) {
        console.error('Error storing ad click:', error);
      } else {
        console.log('Ad click stored successfully');
      }
    }

    // Get the bot username from environment or use default
    const botUsername = Deno.env.get('TELEGRAM_BOT_USERNAME') || 'BoltMiningBot';
    
    // Redirect to Telegram bot
    const redirectUrl = `https://t.me/${botUsername}`;
    
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': redirectUrl,
      },
    });

  } catch (error) {
    console.error('Error in adsgram-tracking:', error);
    
    // Even on error, redirect to bot
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': 'https://t.me/BoltMiningBot',
      },
    });
  }
});
