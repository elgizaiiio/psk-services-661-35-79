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
            { text: '💰 Withdraw Now', url: 'https://t.me/Boltminingbot/app' }
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
    console.log(`Starting campaign: ${campaign_type}`);

    let sentCount = 0;
    let updatedCount = 0;

    if (campaign_type === 'withdraw_5_usdt') {
      // Get all users
      const { data: users, error } = await supabase
        .from('bolt_users')
        .select('id, telegram_id, first_name, usdt_balance')
        .not('telegram_id', 'is', null)
        .neq('bot_blocked', true);

      if (error) throw error;

      for (const user of users || []) {
        // Give $5 USDT to users who have less than $5
        if ((user.usdt_balance || 0) < 5) {
          await supabase
            .from('bolt_users')
            .update({ usdt_balance: 5 })
            .eq('id', user.id);
          updatedCount++;
        }

        // Send promotional message
        const greeting = user.first_name ? `Hey ${user.first_name}!` : 'Hey!';
        const message = `${greeting} 🎉

<b>Congratulations!</b> You've been specially selected!

You're one of our premium users, and we've added <b>$5 USDT</b> to your account as a thank you for being with us!

💰 Your current balance: <b>$5+ USDT</b>

Withdraw your earnings now and enjoy your rewards!

⏰ Don't wait - claim your money today!`;

        const sent = await sendTelegramMessage(user.telegram_id, message);
        if (sent) sentCount++;

        // Small delay to avoid rate limits
        await new Promise(r => setTimeout(r, 50));
      }

    } else if (campaign_type === 'servers_spin_promo') {
      // Get all users for servers and spin promotion
      const { data: users, error } = await supabase
        .from('bolt_users')
        .select('id, telegram_id, first_name')
        .not('telegram_id', 'is', null)
        .neq('bot_blocked', true);

      if (error) throw error;

      for (const user of users || []) {
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
        if (sent) sentCount++;

        await new Promise(r => setTimeout(r, 50));
      }
    }

    console.log(`Campaign complete: ${sentCount} messages sent, ${updatedCount} balances updated`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: sentCount,
        updated: updatedCount
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
