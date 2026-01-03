import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');

// Admin Telegram ID to receive withdrawal notifications
const ADMIN_CHAT_IDS = [6657246146];

async function sendTelegramMessage(chatId: number, text: string) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML',
      }),
    });

    const result = await response.json();
    console.log(`Message sent to ${chatId}:`, result.ok);
    return result.ok;
  } catch (error) {
    console.error(`Failed to send message to ${chatId}:`, error);
    return false;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, username, telegramId, currency, amount, walletAddress } = await req.json();

    console.log('Received withdrawal notification request:', { userId, username, currency, amount });

    if (!userId || !currency || !amount) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format the notification message
    const message = `
🔔 <b>New Withdrawal Request</b>

👤 User: ${username || 'Unknown'}
🆔 Telegram ID: ${telegramId || 'N/A'}
💰 Amount: <b>${amount} ${currency}</b>
${walletAddress ? `📬 Wallet: <code>${walletAddress}</code>` : ''}
📅 Time: ${new Date().toISOString()}

⚠️ Please process this withdrawal request.
    `.trim();

    // Send notification to all admins
    const results = await Promise.allSettled(
      ADMIN_CHAT_IDS.map(chatId => sendTelegramMessage(chatId, message))
    );

    const successCount = results.filter(r => r.status === 'fulfilled' && r.value).length;
    console.log(`Notified ${successCount}/${ADMIN_CHAT_IDS.length} admins`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        notified: successCount,
        total: ADMIN_CHAT_IDS.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing notification:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to send notifications' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
