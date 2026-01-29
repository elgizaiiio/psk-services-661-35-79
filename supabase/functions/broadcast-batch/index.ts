import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SECRET_KEY = 'BATCH_BROADCAST_2024';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { secretKey, offset = 0, batchSize = 100 } = await req.json();

    if (secretKey !== SECRET_KEY) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');

    if (!botToken) {
      return new Response(
        JSON.stringify({ error: 'Bot token not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get batch of users
    const { data: users, error } = await supabase
      .from('bolt_users')
      .select('telegram_id, first_name')
      .not('telegram_id', 'is', null)
      .eq('bot_blocked', false)
      .range(offset, offset + batchSize - 1);

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!users || users.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Broadcast complete - no more users',
          sent: 0,
          nextOffset: null
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const message = `Hey {firstName}!

Important Updates

We have added $5 USDT to your balance as a bonus. You can withdraw it now.

New Features:
- Ethereum (ETH) mining now available in all server packages
- Viral token withdrawals are now live and instant
- Referral system upgraded: Earn 50% commission from all payments made by friends you invite
- Lucky Spin win rate increased to 99.9% with major prizes

Start earning now. Open the app and claim your rewards.`;

    let sent = 0;
    let failed = 0;
    let blocked = 0;

    for (const user of users) {
      try {
        const personalizedMessage = message.replace('{firstName}', user.first_name || 'User');

        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: user.telegram_id,
            text: personalizedMessage,
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [[{
                text: 'Open App',
                url: 'https://t.me/Boltminingbot/App'
              }]]
            }
          }),
        });

        const result = await response.json();

        if (result.ok) {
          sent++;
        } else {
          if (result.error_code === 403) {
            blocked++;
            await supabase
              .from('bolt_users')
              .update({ bot_blocked: true })
              .eq('telegram_id', user.telegram_id);
          } else {
            failed++;
          }
        }
      } catch (e) {
        failed++;
      }

      // Small delay to avoid rate limits
      await new Promise(r => setTimeout(r, 30));
    }

    const nextOffset = users.length === batchSize ? offset + batchSize : null;

    return new Response(
      JSON.stringify({
        success: true,
        sent,
        failed,
        blocked,
        processedCount: users.length,
        currentOffset: offset,
        nextOffset,
        message: nextOffset ? `Batch complete. Next offset: ${nextOffset}` : 'All users processed'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
