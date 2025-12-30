import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
const WEBAPP_URL = 'https://bolt.elgiza.site';

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
    };
    chat: {
      id: number;
      type: string;
    };
    text?: string;
    date: number;
  };
}

async function sendTelegramMessage(chatId: number, text: string, replyMarkup?: object) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  
  const body: Record<string, unknown> = {
    chat_id: chatId,
    text: text,
    parse_mode: 'HTML',
  };

  if (replyMarkup) {
    body.reply_markup = replyMarkup;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const result = await response.json();
  console.log('Telegram API response:', result);
  return result;
}

async function getUserStats(telegramId: number) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: user, error } = await supabase
    .from('bolt_users')
    .select('*')
    .eq('telegram_id', telegramId)
    .single();

  if (error || !user) {
    return null;
  }

  return user;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!TELEGRAM_BOT_TOKEN) {
      console.error('TELEGRAM_BOT_TOKEN not configured');
      return new Response(JSON.stringify({ error: 'Bot token not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const update: TelegramUpdate = await req.json();
    console.log('Received Telegram update:', JSON.stringify(update));

    const messageText = update.message?.text || '';
    const chatId = update.message?.chat.id;
    const firstName = update.message?.from.first_name || 'User';
    const telegramId = update.message?.from.id;

    if (!chatId) {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle /start command
    if (messageText.startsWith('/start')) {
      const parts = messageText.split(' ');
      const referralParam = parts.length > 1 ? parts.slice(1).join(' ').trim() : null;
      
      console.log('Start command received, referral param:', referralParam);

      let webAppUrl = WEBAPP_URL;
      if (referralParam) {
        webAppUrl = `${WEBAPP_URL}?ref=${encodeURIComponent(referralParam)}`;
      }

      const welcomeMessage = `👋 <b>Welcome ${firstName}!</b>

🚀 Welcome to <b>Bolt Mining</b> - Smart Mining Platform!

⚡ Start now and earn BOLT tokens for FREE
💎 Complete daily tasks to boost your earnings
🎁 Invite friends and get extra rewards

Click the button below to start mining! 👇`;

      const keyboard = {
        inline_keyboard: [
          [
            {
              text: '🚀 Start Mining Now',
              web_app: { url: webAppUrl }
            }
          ],
          [
            {
              text: '📢 Join Our Channel',
              url: 'https://t.me/boltrs'
            }
          ]
        ]
      };

      await sendTelegramMessage(chatId, welcomeMessage, keyboard);
      console.log('Welcome message sent with webAppUrl:', webAppUrl);
    }

    // Handle /balance command
    else if (messageText === '/balance') {
      const user = await getUserStats(telegramId!);
      
      if (!user) {
        const notFoundMessage = `❌ <b>Account Not Found</b>

You haven't started mining yet!
Use /start to begin your journey.`;
        await sendTelegramMessage(chatId, notFoundMessage);
      } else {
        const balanceMessage = `📊 <b>Your BOLT Stats</b>

💰 Balance: <b>${user.token_balance.toLocaleString()} BOLT</b>
⚡ Mining Power: <b>${user.mining_power}x</b>
⏱️ Mining Duration: <b>${user.mining_duration_hours}h</b>
👥 Total Referrals: <b>${user.total_referrals}</b>
🎁 Referral Earnings: <b>${user.referral_bonus.toLocaleString()} BOLT</b>

🚀 Keep mining to earn more!`;

        const keyboard = {
          inline_keyboard: [
            [
              {
                text: '⛏️ Open Mining App',
                web_app: { url: WEBAPP_URL }
              }
            ]
          ]
        };

        await sendTelegramMessage(chatId, balanceMessage, keyboard);
      }
    }

    // Handle /referral command
    else if (messageText === '/referral') {
      const user = await getUserStats(telegramId!);
      
      if (!user) {
        const notFoundMessage = `❌ <b>Account Not Found</b>

You haven't started mining yet!
Use /start to begin your journey.`;
        await sendTelegramMessage(chatId, notFoundMessage);
      } else {
        const referralCode = user.telegram_username || telegramId;
        const referralLink = `https://t.me/boltrsbot?start=${referralCode}`;
        
        const referralMessage = `🎁 <b>Your Referral Link</b>

Share this link with friends:
<code>${referralLink}</code>

📊 <b>Your Stats:</b>
👥 Total Referrals: <b>${user.total_referrals}</b>
💰 Earnings: <b>${user.referral_bonus.toLocaleString()} BOLT</b>

🏆 <b>Rewards:</b>
• +100 BOLT per friend
• +500 BOLT at 5 friends
• +1500 BOLT at 10 friends

Share now and earn! 🚀`;

        await sendTelegramMessage(chatId, referralMessage);
      }
    }

    // Handle /help command
    else if (messageText === '/help') {
      const helpMessage = `📚 <b>Available Commands</b>

/start - Start the bot & open mining app
/balance - Check your BOLT balance & stats
/referral - Get your referral link
/help - Show this help message

🚀 <b>Quick Actions:</b>
• Tap the button below to start mining
• Invite friends to earn bonus BOLT
• Complete daily tasks for extra rewards

💡 <b>Tips:</b>
• Mine daily to maximize earnings
• Upgrade mining power for faster rewards
• Extend mining duration for longer sessions`;

      const keyboard = {
        inline_keyboard: [
          [
            {
              text: '🚀 Start Mining',
              web_app: { url: WEBAPP_URL }
            }
          ],
          [
            {
              text: '📢 Join Channel',
              url: 'https://t.me/boltrs'
            }
          ]
        ]
      };

      await sendTelegramMessage(chatId, helpMessage, keyboard);
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
