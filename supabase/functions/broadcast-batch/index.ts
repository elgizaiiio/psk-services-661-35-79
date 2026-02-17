import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SECRET_KEY = 'BATCH_BROADCAST_2024';
const CAMPAIGN_ID = 'prize_cancelled_final_2026';

declare const EdgeRuntime: { waitUntil: (promise: Promise<unknown>) => void };

async function sendBatchInBackground(offset: number, batchSize: number) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const message = `Important Update, {firstName}.

Your account has been updated with the following changes:

- Your balance has been set to $5 USDT
- Withdrawal fee: 0.5 TON
- You can now purchase any mining server with no minimum requirement

This is a one-time update for all users. Start earning more by purchasing a server and mining today.

If you need help, contact our support: @Boltsupportio`;

  // Get list of telegram_ids already sent in this campaign
  const { data: alreadySent } = await supabase
    .from('broadcast_log')
    .select('telegram_id')
    .eq('campaign_id', CAMPAIGN_ID);
  
  const sentSet = new Set((alreadySent || []).map(r => r.telegram_id));

  let currentOffset = offset;
  let totalSent = 0;
  let totalBlocked = 0;
  let totalFailed = 0;
  let totalSkipped = 0;
  let hasMore = true;

  console.log(`[broadcast-batch] Campaign: ${CAMPAIGN_ID}, starting from offset ${offset}, already sent to ${sentSet.size} users`);

  while (hasMore) {
    const { data: users, error } = await supabase
      .from('bolt_users')
      .select('telegram_id, first_name')
      .not('telegram_id', 'is', null)
      .eq('bot_blocked', false)
      .range(currentOffset, currentOffset + batchSize - 1);

    if (error || !users || users.length === 0) {
      console.log(`[broadcast-batch] No more users at offset ${currentOffset}`);
      hasMore = false;
      break;
    }

    for (const user of users) {
      // Skip if already sent in this campaign
      if (sentSet.has(user.telegram_id)) {
        totalSkipped++;
        continue;
      }

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
          totalSent++;
          // Log successful send to prevent duplicates
          await supabase.from('broadcast_log').insert({
            campaign_id: CAMPAIGN_ID,
            telegram_id: user.telegram_id
          });
          sentSet.add(user.telegram_id);
        } else {
          if (result.error_code === 403) {
            totalBlocked++;
            await supabase
              .from('bolt_users')
              .update({ bot_blocked: true })
              .eq('telegram_id', user.telegram_id);
          } else if (result.error_code === 429) {
            const retryAfter = result.parameters?.retry_after || 5;
            console.log(`[broadcast-batch] Rate limited, waiting ${retryAfter}s`);
            await new Promise(r => setTimeout(r, retryAfter * 1000));
          } else {
            totalFailed++;
          }
        }
      } catch (e) {
        totalFailed++;
      }

      await new Promise(r => setTimeout(r, 35));
    }

    currentOffset += batchSize;
    console.log(`[broadcast-batch] Progress: offset=${currentOffset}, sent=${totalSent}, skipped=${totalSkipped}, blocked=${totalBlocked}, failed=${totalFailed}`);

    if (users.length < batchSize) {
      hasMore = false;
    }
  }

  console.log(`[broadcast-batch] COMPLETE! sent=${totalSent}, skipped=${totalSkipped}, blocked=${totalBlocked}, failed=${totalFailed}`);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { secretKey, offset = 0, batchSize = 500 } = await req.json();

    if (secretKey !== SECRET_KEY) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    if (!botToken) {
      return new Response(
        JSON.stringify({ error: 'Bot token not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    EdgeRuntime.waitUntil(sendBatchInBackground(offset, batchSize));

    return new Response(
      JSON.stringify({
        success: true,
        message: `Broadcast started from offset ${offset}. Duplicates will be skipped.`
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
