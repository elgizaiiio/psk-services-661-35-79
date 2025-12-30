import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');

async function checkChannelSubscription(userId: number, channelUsername: string): Promise<boolean> {
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getChatMember?chat_id=@${channelUsername}&user_id=${userId}`;
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('Channel subscription check:', { userId, channelUsername, response: data });
    
    if (data.ok) {
      const status = data.result.status;
      // member, administrator, creator are valid subscription statuses
      // left, kicked, restricted (without is_member) are not subscribed
      return ['member', 'administrator', 'creator'].includes(status);
    }
    return false;
  } catch (error) {
    console.error('Error checking channel subscription:', error);
    return false;
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { telegramId, channelUsername } = await req.json();

    if (!telegramId || !channelUsername) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Missing telegramId or channelUsername' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const isSubscribed = await checkChannelSubscription(telegramId, channelUsername);

    return new Response(
      JSON.stringify({ ok: true, isSubscribed }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in check-subscription:', error);
    return new Response(
      JSON.stringify({ ok: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
