import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');

// Track sent messages to prevent duplicates
const sentUserIds = new Set<number>();

async function sendTelegramMessage(chatId: number, text: string): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN) return false;
  
  // Skip if already sent to this user
  if (sentUserIds.has(chatId)) {
    console.log(`[skip] Already sent to ${chatId}`);
    return true;
  }
  
  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [[
            { text: '💰 Withdraw Now', url: 'https://t.me/Boltminingbot/App' }
          ], [
            { text: '📢 Vote Result', url: 'https://t.me/boltcomm/79' }
          ]]
        }
      }),
    });
    
    const result = await response.json();
    if (result.ok) {
      sentUserIds.add(chatId);
    }
    return result.ok;
  } catch (error) {
    console.error('Error sending message:', error);
    return false;
  }
}

async function processAllUsers(supabase: ReturnType<typeof createClient>) {
  console.log('[send-final-chance-broadcast] Starting one-time broadcast...');
  
  let offset = 0;
  const batchSize = 500;
  let totalSent = 0;
  let totalFailed = 0;
  let totalSkipped = 0;

  const message = `🎉 <b>FINAL CHANCE - 48 HOURS ONLY!</b>

Based on community vote results, we're giving you ONE LAST opportunity to withdraw your $3,000 prize!

📊 <b>Vote Result:</b> https://t.me/boltcomm/79

⏰ <b>Time Remaining:</b> 48 hours only!

💵 Your prize: <b>$3,000 USDT</b>

⚠️ This is your FINAL chance. After 48 hours, unclaimed prizes will be forfeited.

Don't miss out - withdraw NOW!`;

  while (true) {
    const { data: users, error } = await supabase
      .from('bolt_users')
      .select('id, telegram_id, first_name, bot_blocked')
      .not('telegram_id', 'is', null)
      .eq('bot_blocked', false)
      .range(offset, offset + batchSize - 1);

    if (error) {
      console.error('Error fetching users:', error);
      break;
    }

    if (!users || users.length === 0) {
      console.log('No more users to process');
      break;
    }

    console.log(`Processing batch at offset ${offset}, users: ${users.length}`);

    for (const user of users) {
      // Skip if already processed
      if (sentUserIds.has(user.telegram_id)) {
        totalSkipped++;
        continue;
      }

      const sent = await sendTelegramMessage(user.telegram_id, message);
      if (sent) {
        totalSent++;
      } else {
        totalFailed++;
        // Mark as blocked if send failed
        if (!sentUserIds.has(user.telegram_id)) {
          await supabase
            .from('bolt_users')
            .update({ bot_blocked: true })
            .eq('id', user.id);
        }
      }

      // Delay between messages to avoid rate limits
      await new Promise(r => setTimeout(r, 35));
    }

    offset += batchSize;
    console.log(`Progress: sent=${totalSent}, failed=${totalFailed}, skipped=${totalSkipped}`);

    // Stop if batch was smaller than expected (end of users)
    if (users.length < batchSize) {
      break;
    }
  }

  console.log(`[send-final-chance-broadcast] COMPLETE! Total sent: ${totalSent}, failed: ${totalFailed}, skipped: ${totalSkipped}`);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Clear the set at the start of each invocation
    sentUserIds.clear();

    // Start background processing
    EdgeRuntime.waitUntil(processAllUsers(supabase));

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Final chance broadcast started. Each user will receive exactly ONE message.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Broadcast error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
