import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
const WEBAPP_URL = 'https://bolts.elgiza.site';

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

async function getContestInfo(userId?: string) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Get active contest
  const { data: contest } = await supabase
    .from('referral_contests')
    .select('*')
    .eq('status', 'active')
    .eq('is_active', true)
    .single();

  if (!contest) return null;

  // Get top 3 participants
  const { data: top3 } = await supabase
    .from('contest_participants')
    .select('user_id, referral_count')
    .eq('contest_id', contest.id)
    .order('referral_count', { ascending: false })
    .limit(3);

  // Get usernames for top 3
  let top3WithNames: any[] = [];
  if (top3 && top3.length > 0) {
    const userIds = top3.map((p: any) => p.user_id);
    const { data: users } = await supabase
      .from('bolt_users')
      .select('id, telegram_username, first_name')
      .in('id', userIds);

    const usersMap: Record<string, any> = {};
    (users || []).forEach((u: any) => { usersMap[u.id] = u; });

    top3WithNames = top3.map((p: any, i: number) => ({
      rank: i + 1,
      username: usersMap[p.user_id]?.telegram_username || usersMap[p.user_id]?.first_name || 'Anonymous',
      count: p.referral_count
    }));
  }

  // Get user's rank if userId provided
  let userRank = null;
  if (userId) {
    const { data: userPart } = await supabase
      .from('contest_participants')
      .select('referral_count')
      .eq('contest_id', contest.id)
      .eq('user_id', userId)
      .single();

    if (userPart) {
      const { count } = await supabase
        .from('contest_participants')
        .select('*', { count: 'exact', head: true })
        .eq('contest_id', contest.id)
        .gt('referral_count', userPart.referral_count);

      userRank = {
        rank: (count || 0) + 1,
        referrals: userPart.referral_count
      };
    }
  }

  // Calculate time remaining
  const endDate = new Date(contest.end_date);
  const now = new Date();
  const diff = endDate.getTime() - now.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  return {
    name: contest.name,
    prizePool: contest.prize_pool_usd,
    timeRemaining: `${days}d ${hours}h`,
    top3: top3WithNames,
    userRank
  };
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

🏆 <b>$10,000 Referral Contest Active!</b>
Invite friends to compete for amazing prizes!

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
              text: '🏆 View Contest',
              web_app: { url: `${WEBAPP_URL}/contest` }
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

🏆 <b>Contest Active!</b>
Compete for $10,000 in TON prizes!

Share now and earn! 🚀`;

        const keyboard = {
          inline_keyboard: [
            [
              {
                text: '🏆 View Contest Leaderboard',
                web_app: { url: `${WEBAPP_URL}/contest` }
              }
            ]
          ]
        };

        await sendTelegramMessage(chatId, referralMessage, keyboard);
      }
    }

    // Handle /contest command
    else if (messageText === '/contest') {
      const user = await getUserStats(telegramId!);
      const contestInfo = await getContestInfo(user?.id);

      if (!contestInfo) {
        const noContestMessage = `🏆 <b>No Active Contest</b>

There's no referral contest active right now.
Check back later for upcoming contests!`;
        await sendTelegramMessage(chatId, noContestMessage);
      } else {
        let contestMessage = `🏆 <b>${contestInfo.name}</b>

💰 Prize Pool: <b>$${contestInfo.prizePool.toLocaleString()} in TON</b>
⏳ Time Remaining: <b>${contestInfo.timeRemaining}</b>

🥇 1st Place: <b>$3,000</b>
🥈 2nd Place: <b>$2,000</b>
🥉 3rd Place: <b>$1,500</b>
4th-10th: <b>$500 each</b>`;

        if (contestInfo.userRank) {
          contestMessage += `

📊 <b>Your Stats:</b>
Rank: <b>#${contestInfo.userRank.rank}</b>
Referrals: <b>${contestInfo.userRank.referrals}</b>`;
          
          if (contestInfo.userRank.rank <= 10) {
            contestMessage += `
🎯 <b>You're in the prize zone!</b>`;
          }
        }

        if (contestInfo.top3.length > 0) {
          contestMessage += `

🏅 <b>Top 3:</b>`;
          contestInfo.top3.forEach((p: any) => {
            const emoji = p.rank === 1 ? '🥇' : p.rank === 2 ? '🥈' : '🥉';
            contestMessage += `
${emoji} @${p.username} - ${p.count} refs`;
          });
        }

        contestMessage += `

Invite friends to climb the leaderboard! 🚀`;

        const keyboard = {
          inline_keyboard: [
            [
              {
                text: '🏆 View Full Leaderboard',
                web_app: { url: `${WEBAPP_URL}/contest` }
              }
            ],
            [
              {
                text: '🔗 Get Referral Link',
                callback_data: 'get_referral'
              }
            ]
          ]
        };

        await sendTelegramMessage(chatId, contestMessage, keyboard);
      }
    }

    // Handle /help command
    else if (messageText === '/help') {
      const helpMessage = `📚 <b>Available Commands</b>

/start - Start the bot & open mining app
/balance - Check your BOLT balance & stats
/referral - Get your referral link
/contest - View contest info & leaderboard
/help - Show this help message

🚀 <b>Quick Actions:</b>
• Tap the button below to start mining
• Invite friends to earn bonus BOLT
• Complete daily tasks for extra rewards
• Compete in the $10,000 referral contest!

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
              text: '🏆 View Contest',
              web_app: { url: `${WEBAPP_URL}/contest` }
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
