import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SECRET_KEY = 'BATCH_BROADCAST_2024';
const BATCH_SIZE = 500;
const DELAY_MS = 30;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { secretKey, offset = 0, batchSize = BATCH_SIZE } = await req.json();

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

    const message = `{firstName}, we sincerely apologize for the issues you experienced during the withdrawal process.

Everything has been fixed now. You can withdraw your $4,000 USDT prize immediately, and the funds will arrive in your wallet within seconds.

Remember, this prize will disappear once the countdown ends. Do not wait.

Open the app and withdraw your money now before it is too late.

If you need any help, contact our support team: @Boltsupportio`;

    // Fetch batch
    const { data: users, error } = await supabase
      .from('bolt_users')
      .select('telegram_id, first_name')
      .not('telegram_id', 'is', null)
      .eq('bot_blocked', false)
      .range(offset, offset + batchSize - 1);

    if (error || !users || users.length === 0) {
      console.log(`[broadcast-batch] DONE at offset ${offset}. No more users.`);
      return new Response(
        JSON.stringify({ success: true, complete: true, offset }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let sent = 0, blocked = 0, failed = 0;

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
                text: 'Withdraw Now',
                url: 'https://t.me/Boltminingbot/App'
              }]]
            }
          }),
        });

        const result = await response.json();

        if (result.ok) {
          sent++;
        } else if (result.error_code === 403) {
          blocked++;
          await supabase
            .from('bolt_users')
            .update({ bot_blocked: true })
            .eq('telegram_id', user.telegram_id);
        } else if (result.error_code === 429) {
          const retryAfter = result.parameters?.retry_after || 5;
          console.log(`[broadcast-batch] Rate limited, waiting ${retryAfter}s`);
          await new Promise(r => setTimeout(r, retryAfter * 1000));
        } else {
          failed++;
        }
      } catch (_e) {
        failed++;
      }

      await new Promise(r => setTimeout(r, DELAY_MS));
    }

    const newOffset = offset + users.length;
    console.log(`[broadcast-batch] Batch done: offset=${newOffset}, sent=${sent}, blocked=${blocked}, failed=${failed}`);

    // Chain next batch
    if (users.length >= batchSize) {
      try {
        await fetch(`${supabaseUrl}/functions/v1/broadcast-batch`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({
            secretKey: SECRET_KEY,
            offset: newOffset,
            batchSize,
          }),
        });
        console.log(`[broadcast-batch] Chained next batch at offset ${newOffset}`);
      } catch (err) {
        console.error(`[broadcast-batch] Chain failed:`, err);
      }
    } else {
      console.log(`[broadcast-batch] ALL DONE! Last offset=${newOffset}`);
    }

    return new Response(
      JSON.stringify({ success: true, sent, blocked, failed, nextOffset: newOffset }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
