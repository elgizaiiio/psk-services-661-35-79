import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SECRET_KEY = 'BATCH_BROADCAST_2024';
const CAMPAIGN_ID = 'extended_24h_prize_feb20';
const BATCH_SIZE = 200;

const MESSAGE = `🎉 Good news, {firstName}!

We have extended the deadline for your $4,000 USDT prize by 24 MORE HOURS!

💰 Your Balance: $4,000 USDT
⏳ New Deadline: 24 Hours remaining — This is truly your LAST chance!

We added extra time just for you. Do not let this opportunity slip away!

👉 Open the app now and withdraw your prize!`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { secretKey, offset = 0 } = await req.json();

    if (secretKey !== SECRET_KEY) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get already-sent telegram_ids for this campaign
    const { data: alreadySent } = await supabase
      .from('broadcast_log')
      .select('telegram_id')
      .eq('campaign_id', CAMPAIGN_ID);
    const sentSet = new Set((alreadySent || []).map(r => r.telegram_id));

    // Get batch of users
    const { data: users, error } = await supabase
      .from('bolt_users')
      .select('telegram_id, first_name')
      .not('telegram_id', 'is', null)
      .eq('bot_blocked', false)
      .range(offset, offset + BATCH_SIZE - 1);

    if (error || !users || users.length === 0) {
      return new Response(JSON.stringify({
        success: true, complete: true,
        message: `No more users at offset ${offset}. Already sent: ${sentSet.size}`,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    let sent = 0, skipped = 0, blocked = 0, failed = 0;

    for (const user of users) {
      if (sentSet.has(user.telegram_id)) { skipped++; continue; }

      try {
        const text = MESSAGE.replace('{firstName}', user.first_name || 'User');
        const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: user.telegram_id, text, parse_mode: 'HTML',
            reply_markup: { inline_keyboard: [[{ text: 'Open App', url: 'https://t.me/Boltminingbot/App' }]] },
          }),
        });
        const result = await res.json();

        if (result.ok) {
          sent++;
          await supabase.from('broadcast_log').insert({ campaign_id: CAMPAIGN_ID, telegram_id: user.telegram_id });
        } else if (result.error_code === 403) {
          blocked++;
          await supabase.from('bolt_users').update({ bot_blocked: true }).eq('telegram_id', user.telegram_id);
        } else if (result.error_code === 429) {
          const wait = result.parameters?.retry_after || 5;
          await new Promise(r => setTimeout(r, wait * 1000));
        } else {
          failed++;
        }
      } catch { failed++; }

      await new Promise(r => setTimeout(r, 35));
    }

    const newOffset = offset + users.length;
    console.log(`[broadcast] offset=${newOffset}, sent=${sent}, skipped=${skipped}, blocked=${blocked}, failed=${failed}, totalLogged=${sentSet.size + sent}`);

    // Self-chain to next batch
    if (users.length >= BATCH_SIZE) {
      fetch(`${supabaseUrl}/functions/v1/broadcast-batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseKey}` },
        body: JSON.stringify({ secretKey: SECRET_KEY, offset: newOffset }),
      }).catch(e => console.error('Chain error:', e));
    }

    return new Response(JSON.stringify({
      success: true, sent, skipped, blocked, failed, nextOffset: newOffset,
      hasMore: users.length >= BATCH_SIZE,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
