import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');

async function sendTelegramMessage(chatId: number, text: string): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN) return false;
  
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
            { text: '💰 Withdraw Now', url: 'https://elh.elgiza.site/' }
          ]]
        }
      }),
    });
    
    return response.ok;
  } catch (error) {
    console.error('Error sending message:', error);
    return false;
  }
}

async function processAllUsers(supabase: any, campaignType: string) {
  console.log(`Starting background processing for campaign: ${campaignType}`);
  
  let offset = 0;
  const batchSize = 500;
  let totalSent = 0;
  let totalFailed = 0;
  let totalUpdated = 0;

  while (true) {
    const { data: users, error } = await supabase
      .from('bolt_users')
      .select('id, telegram_id, first_name, usdt_balance')
      .not('telegram_id', 'is', null)
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
      if (campaignType === 'withdraw_5_usdt') {
        // Give $5 USDT to users who have less than $5
        if ((user.usdt_balance || 0) < 5) {
          await supabase
            .from('bolt_users')
            .update({ usdt_balance: 5 })
            .eq('id', user.id);
          totalUpdated++;
        }

        const greeting = user.first_name ? `Hey ${user.first_name}!` : 'Hey!';
        const message = `${greeting} 🎉

<b>Congratulations!</b> You've been specially selected!

You're one of our premium users, and we've added <b>$5 USDT</b> to your account as a thank you for being with us!

💰 Your current balance: <b>$5+ USDT</b>

Withdraw your earnings now and enjoy your rewards!

⏰ Don't wait - claim your money today!`;

        const sent = await sendTelegramMessage(user.telegram_id, message);
        if (sent) totalSent++;
        else totalFailed++;
      } else if (campaignType === 'servers_spin_promo') {
        const greeting = user.first_name ? `${user.first_name}` : 'Friend';
        const message = `Hey ${greeting}! 🚀

<b>Maximize Your Earnings!</b>

💎 <b>Mining Servers</b>
Get passive income 24/7! Our servers mine BOLT, USDT & TON for you automatically.

🎰 <b>Lucky Spin</b>
Spin daily for a chance to win real crypto rewards!

• Free daily spins
• Win up to 100 USDT
• VIP multipliers available

⚡ Start earning now - every second counts!`;

        const sent = await sendTelegramMessage(user.telegram_id, message);
        if (sent) totalSent++;
        else totalFailed++;
      }

      // Small delay to avoid rate limits
      await new Promise(r => setTimeout(r, 25));
    }

    offset += batchSize;
    
    // Log progress
    console.log(`Progress: sent=${totalSent}, failed=${totalFailed}, updated=${totalUpdated}`);
  }

  console.log(`Campaign complete! Total sent: ${totalSent}, failed: ${totalFailed}, updated: ${totalUpdated}`);
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

    const { campaign_type } = await req.json();
    console.log(`Received campaign request: ${campaign_type}`);

    if (!campaign_type) {
      return new Response(
        JSON.stringify({ success: false, error: 'campaign_type is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Start background processing
    EdgeRuntime.waitUntil(processAllUsers(supabase, campaign_type));

    // Return immediately
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Campaign "${campaign_type}" started in background. Check logs for progress.`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Campaign error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
