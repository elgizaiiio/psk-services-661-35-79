import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

async function sendTelegramMessage(chatId: number, text: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
          parse_mode: 'HTML',
        }),
      }
    );
    
    const result = await response.json();
    return result.ok;
  } catch (error) {
    console.error(`Failed to send message to ${chatId}:`, error);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get all users with $5 USDT or more
    const { data: users, error } = await supabase
      .from('bolt_users')
      .select('telegram_id, usdt_balance, first_name')
      .gte('usdt_balance', 5)
      .eq('bot_blocked', false);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    if (!users || users.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No users with $5+ USDT found', sent: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${users.length} users with $5+ USDT balance`);

    // Professional message without emojis, with bold text
    const message = `<b>Important Notice</b>

You have <b>$5 USDT</b> available in your wallet.

Please withdraw your balance before it expires.

Open the app now: https://psk-services-661-35-79.lovable.app/wallet`;

    let successCount = 0;
    let failCount = 0;

    // Send messages with rate limiting (25 per second max for Telegram)
    const batchSize = 25;
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      
      const results = await Promise.all(
        batch.map(user => sendTelegramMessage(user.telegram_id, message))
      );
      
      successCount += results.filter(r => r).length;
      failCount += results.filter(r => !r).length;

      // Wait 1 second between batches to respect rate limits
      if (i + batchSize < users.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      console.log(`Progress: ${i + batch.length}/${users.length} (Success: ${successCount}, Failed: ${failCount})`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Broadcast completed`,
        total_users: users.length,
        sent: successCount,
        failed: failCount
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
