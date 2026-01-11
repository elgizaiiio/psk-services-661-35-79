import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

interface UserProfile {
  type: 'whale' | 'active_miner' | 'inactive_rich' | 'new_user' | 'churned' | 'regular';
  context: string;
}

interface UserData {
  id: string;
  telegram_id: number;
  first_name: string | null;
  token_balance: number;
  usdt_balance: number;
  ton_balance: number | null;
  total_referrals: number;
  created_at: string;
  updated_at: string;
}

function getDaysSince(dateStr: string): number {
  const date = new Date(dateStr);
  const now = new Date();
  return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
}

function analyzeUser(user: UserData, serverCount: number): UserProfile {
  const totalBalance = user.token_balance + ((user.usdt_balance || 0) * 1000);
  const daysSinceActive = getDaysSince(user.updated_at);
  const daysSinceCreated = getDaysSince(user.created_at);
  const hasServers = serverCount > 0;

  // Whale: High balance
  if (totalBalance > 10000 || (user.usdt_balance || 0) > 10 || (user.ton_balance || 0) > 5) {
    return {
      type: 'whale',
      context: `High value user with ${totalBalance.toFixed(0)} BOLT, $${(user.usdt_balance || 0).toFixed(2)} USDT. Has ${serverCount} servers.`
    };
  }

  // Active miner: Has servers and recently active
  if (hasServers && daysSinceActive < 2) {
    return {
      type: 'active_miner',
      context: `Active miner with ${serverCount} servers, last active ${daysSinceActive} days ago.`
    };
  }

  // Inactive rich: Has balance but not active
  if (totalBalance > 1000 && daysSinceActive > 3) {
    return {
      type: 'inactive_rich',
      context: `Inactive user with ${totalBalance.toFixed(0)} BOLT, last active ${daysSinceActive} days ago.`
    };
  }

  // New user: Created less than 7 days ago
  if (daysSinceCreated < 7) {
    return {
      type: 'new_user',
      context: `New user, joined ${daysSinceCreated} days ago. Has ${serverCount} servers.`
    };
  }

  // Churned: Not active for more than 7 days
  if (daysSinceActive > 7) {
    return {
      type: 'churned',
      context: `Churned user, last active ${daysSinceActive} days ago.`
    };
  }

  return {
    type: 'regular',
    context: `Regular user with ${totalBalance.toFixed(0)} BOLT, ${serverCount} servers.`
  };
}

async function generateSmartMessage(
  profile: UserProfile,
  userName: string | null
): Promise<string> {
  const greeting = userName ? `Hey ${userName}! ` : '';

  // Default messages per profile type
  const defaultMessages: Record<string, string[]> = {
    whale: [
      `${greeting}<b>VIP Investment Alert!</b>\n\nMaximize your earnings with Elite servers!\n\n• Includes:\n- Highest daily returns\n- Priority support\n- Exclusive bonuses\n\n⏰ Limited spots available!`,
      `${greeting}<b>Premium Opportunity!</b>\n\nYour balance deserves the best!\n\n• Includes:\n- Elite mining servers\n- Maximum ROI\n- VIP perks\n\n⏰ Invest now!`,
    ],
    active_miner: [
      `${greeting}<b>Mining Rewards Ready!</b>\n\nYour servers are earning!\n\n• Includes:\n- BOLT rewards\n- USDT earnings\n- Bonus tokens\n\n⏰ Claim now!`,
      `${greeting}<b>Great Progress!</b>\n\nYour mining is going strong!\n\n• Includes:\n- Daily rewards\n- Power bonuses\n- Free upgrades\n\n⏰ Keep mining!`,
    ],
    inactive_rich: [
      `${greeting}<b>Your Balance Awaits!</b>\n\nInvest your tokens for passive income!\n\n• Includes:\n- Mining servers\n- Daily returns\n- Auto earnings\n\n⏰ Start earning now!`,
      `${greeting}<b>Opportunity Knocking!</b>\n\nPut your tokens to work!\n\n• Includes:\n- Server investments\n- Passive income\n- Growing returns\n\n⏰ Don't miss out!`,
    ],
    new_user: [
      `${greeting}<b>Welcome Bonus!</b>\n\nStart your mining journey!\n\n• Includes:\n- Free starter server\n- Daily rewards\n- Referral bonuses\n\n⏰ Claim your free server!`,
      `${greeting}<b>Get Started!</b>\n\nEverything you need to earn!\n\n• Includes:\n- Free BOLT tokens\n- Lucky spin rewards\n- Mining power\n\n⏰ Start now!`,
    ],
    churned: [
      `${greeting}<b>We Miss You!</b>\n\nCome back and claim your bonus!\n\n• Includes:\n- Welcome back reward\n- Free spins\n- Special offers\n\n⏰ Limited time only!`,
      `${greeting}<b>Special Offer!</b>\n\nExclusive deal just for you!\n\n• Includes:\n- Bonus tokens\n- Free server trial\n- Extra rewards\n\n⏰ Come back now!`,
    ],
    regular: [
      `${greeting}<b>Daily Bonus!</b>\n\nClaim your rewards today!\n\n• Includes:\n- Free spins\n- BOLT tokens\n- Mining boost\n\n⏰ Don't miss out!`,
      `${greeting}<b>Rewards Waiting!</b>\n\nComplete tasks for bonuses!\n\n• Includes:\n- Daily tasks\n- Referral rewards\n- Lucky draws\n\n⏰ Start earning!`,
    ],
  };

  // Try AI generation if API key is available
  if (LOVABLE_API_KEY) {
    try {
      const systemPrompt = `You are a marketing copywriter for BOLT mining app. Generate a personalized Telegram notification.

User Profile: ${profile.type}
Context: ${profile.context}

FORMAT (follow exactly):
${greeting}[Emoji] <b>Catchy Title!</b>

[1-2 sentence compelling description]

• Includes:
- Benefit 1
- Benefit 2
- Benefit 3

⏰ [Urgency message]

RULES:
- Use HTML <b>tags</b> for bold
- Keep under 300 characters
- Make it personal based on user profile
- Create urgency without spam`;

      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Generate a personalized notification for a ${profile.type} user. Be unique and compelling.` }
          ],
          max_tokens: 200,
          temperature: 0.9,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const message = data.choices?.[0]?.message?.content?.trim();
        if (message) return message;
      }
    } catch (error) {
      console.error('AI generation error:', error);
    }
  }

  // Fallback to default messages
  const messages = defaultMessages[profile.type] || defaultMessages.regular;
  return messages[Math.floor(Math.random() * messages.length)];
}

async function sendTelegramMessage(telegramId: number, text: string): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN) {
    console.error('TELEGRAM_BOT_TOKEN not set');
    return false;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: telegramId,
        text: text,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [[
            { text: '🚀 Open App', url: 'https://t.me/Boltminingbot' }
          ]]
        }
      }),
    });

    const result = await response.json();
    return result.ok;
  } catch (error) {
    console.error('Telegram send error:', error);
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

    const { limit = 100, dry_run = false } = await req.json().catch(() => ({}));

    console.log(`[Smart Notifications] Starting${dry_run ? ' (DRY RUN)' : ''}, limit: ${limit}`);

    // Get users who haven't received a message today
    const today = new Date().toISOString().split('T')[0];
    
    const { data: users, error: usersError } = await supabase
      .from('bolt_users')
      .select('id, telegram_id, first_name, token_balance, usdt_balance, ton_balance, total_referrals, created_at, updated_at, last_message_date, daily_message_count')
      .not('telegram_id', 'is', null)
      .neq('notifications_enabled', false)
      .neq('bot_blocked', true)
      .or(`last_message_date.is.null,last_message_date.neq.${today}`)
      .limit(limit);

    if (usersError) {
      throw usersError;
    }

    console.log(`Found ${users?.length || 0} eligible users`);

    const stats = {
      processed: 0,
      sent: 0,
      failed: 0,
      profiles: {} as Record<string, number>,
    };

    for (const user of users || []) {
      try {
        // Get user's server count
        const { count: serverCount } = await supabase
          .from('user_servers')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_active', true);

        // Analyze user profile
        const profile = analyzeUser(user as UserData, serverCount || 0);
        stats.profiles[profile.type] = (stats.profiles[profile.type] || 0) + 1;

        // Generate personalized message
        const message = await generateSmartMessage(profile, user.first_name);

        if (!dry_run) {
          // Send message
          const sent = await sendTelegramMessage(user.telegram_id, message);

          if (sent) {
            // Update user's message tracking
            await supabase
              .from('bolt_users')
              .update({
                last_message_date: today,
                daily_message_count: 1,
              })
              .eq('id', user.id);

            stats.sent++;
          } else {
            stats.failed++;
          }
        } else {
          console.log(`[DRY RUN] Would send to ${user.telegram_id}: ${profile.type}`);
          stats.sent++;
        }

        stats.processed++;

        // Rate limiting: 30 messages per second
        if (!dry_run && stats.processed % 30 === 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`Error processing user ${user.id}:`, error);
        stats.failed++;
      }
    }

    console.log(`[Smart Notifications] Complete:`, stats);

    return new Response(
      JSON.stringify({ success: true, stats }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Smart notifications error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
