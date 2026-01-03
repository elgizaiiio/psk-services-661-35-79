import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

// Rate limiting settings - IMPORTANT for avoiding Telegram ban
const MIN_DELAY_MS = 1000; // Minimum 1 second between messages
const MAX_DELAY_MS = 2000; // Maximum 2 seconds between messages
const BATCH_SIZE = 25; // Smaller batches
const BATCH_DELAY_MS = 5000; // 5 seconds between batches
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 3000;

// Get random delay between min and max
function getRandomDelay(): number {
  return Math.floor(Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS + 1)) + MIN_DELAY_MS;
}

interface SendResult {
  success: boolean;
  blocked?: boolean;
  rateLimited?: boolean;
}

async function sendTelegramMessage(chatId: number, text: string, retryCount = 0): Promise<SendResult> {
  if (!TELEGRAM_BOT_TOKEN) {
    console.error('TELEGRAM_BOT_TOKEN not configured');
    return { success: false };
  }

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
    
    if (!result.ok) {
      const errorCode = result.error_code;
      const description = result.description || '';
      
      // User blocked the bot
      if (errorCode === 403 || description.includes('blocked') || description.includes('deactivated')) {
        console.log(`User ${chatId} blocked bot or deactivated`);
        return { success: false, blocked: true };
      }
      
      // Rate limited - wait and retry
      if (errorCode === 429) {
        console.warn(`Rate limited for ${chatId}, retry after ${result.parameters?.retry_after || 30}s`);
        if (retryCount < MAX_RETRIES) {
          const retryAfter = (result.parameters?.retry_after || 30) * 1000;
          await new Promise(resolve => setTimeout(resolve, retryAfter));
          return sendTelegramMessage(chatId, text, retryCount + 1);
        }
        return { success: false, rateLimited: true };
      }
      
      console.error(`Failed to send to ${chatId}:`, description);
      return { success: false };
    }
    
    return { success: true };
  } catch (error) {
    console.error(`Error sending to ${chatId}:`, error);
    
    // Retry on network errors
    if (retryCount < MAX_RETRIES) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      return sendTelegramMessage(chatId, text, retryCount + 1);
    }
    
    return { success: false };
  }
}

async function generatePersonalizedMessage(
  template: { theme: string; prompt_context: string; time_slot: string }, 
  dayOfYear: number,
  userName?: string
): Promise<string> {
  if (!LOVABLE_API_KEY) {
    console.error('LOVABLE_API_KEY not configured');
    return getDefaultMessage(template.time_slot, template.theme, dayOfYear, userName);
  }

  try {
    // Add randomization to make messages unique
    const randomSeed = Math.floor(Math.random() * 1000);
    const greeting = userName ? `Hey ${userName}! ` : '';
    
    const systemPrompt = `You are a master persuasion copywriter for BOLT - a crypto mining and gambling app.

🎯 YOUR MISSION: Create a TELEGRAM notification that users CAN'T IGNORE and MUST tap.

⚡ DARK PSYCHOLOGY TACTICS TO USE:
1. FOMO (Fear of Missing Out) - "Others are winning RIGHT NOW"
2. Scarcity - "Only 2 hours left", "Limited spins remaining"
3. Social Proof - "10,000 users already claimed today"
4. Loss Aversion - "Don't lose your streak", "You're leaving money on the table"
5. Urgency - "Expires at midnight", "Your bonus is waiting"
6. Curiosity Gap - "Your reward is ready... (tap to see)"
7. Personalization - "Your lucky hour is NOW"

📝 CRITICAL FORMAT RULES:
- ${greeting ? `Start with greeting: "${greeting}"` : 'Start with 2-3 powerful emojis (💰⚡🚨🔥🎰💎🍀)'}
- For BOLD text, use HTML <b>tags</b> NOT markdown **asterisks**
- Example: <b>3 hours</b> left! NOT **3 hours** left!
- NEVER use markdown formatting (**, __, etc.) - Telegram uses HTML!
- Create URGENCY without being spammy
- Max 3 short sentences (~150 chars)
- End with a HOOK that demands action
- Make this message UNIQUE - variation seed: ${randomSeed}

🎰 APP FEATURES: Lucky Spin (free daily), Mining Servers (earn BOLT/USDT), Referral (earn TON), VIP Rewards

⏰ Time: ${template.time_slot}
📌 Theme: ${template.theme}
💡 Focus: ${template.prompt_context}
🔢 Day variation seed: ${dayOfYear}

NEVER repeat the same message structure. Be creative and use different angles each time.
REMEMBER: Use HTML tags like <b>bold</b> and <i>italic</i>, NOT markdown!`;

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
          { role: 'user', content: `Generate a ${template.time_slot} notification about "${template.theme}" using dark psychology. Make it irresistible and UNIQUE. Use HTML <b>tags</b> for bold, NOT markdown asterisks. Variation: ${randomSeed}` }
        ],
        max_tokens: 200,
        temperature: 0.95, // Higher temperature for more variety
      }),
    });

    if (!response.ok) {
      console.error('AI API error:', response.status);
      return getDefaultMessage(template.time_slot, template.theme, dayOfYear, userName);
    }

    const data = await response.json();
    const message = data.choices?.[0]?.message?.content?.trim();
    
    if (message) {
      console.log('AI generated message:', message.substring(0, 50) + '...');
      return message;
    }
    
    return getDefaultMessage(template.time_slot, template.theme, dayOfYear, userName);
  } catch (error) {
    console.error('AI generation error:', error);
    return getDefaultMessage(template.time_slot, template.theme, dayOfYear, userName);
  }
}

function getDefaultMessage(timeSlot: string, theme: string, dayOfYear: number, userName?: string): string {
  const greeting = userName ? `Hey ${userName}! ` : '';
  
  const spinMessages = [
    `${greeting}🎰🔥 <b>JACKPOT ALERT!</b> Someone just won 500 USDT! Your turn is next... Spin NOW before midnight! ⏰`,
    `${greeting}💎😱 You're missing out! <b>3,847 users</b> already spun today. Your FREE spin expires in hours!`,
    `${greeting}🍀⚡ Your lucky window is OPEN! <b>Last chance</b> for today's free spin. Don't regret it tomorrow!`,
    `${greeting}🎲🤑 WARNING: Unclaimed reward detected! <b>Spin now</b> or lose it forever at midnight!`,
    `${greeting}🌟💰 TOP SECRET: Lucky hour activated! <b>2x rewards</b> for the next 60 minutes. GO GO GO!`,
    `${greeting}🎯🔥 Your streak is at risk! <b>Don't break it now</b>. One spin keeps your rewards alive!`,
    `${greeting}⭐😮 BREAKING: Spin rewards <b>doubled</b> for early birds! Limited to first 1000 spins today!`
  ];
  
  const miningMessages = [
    `${greeting}⛏️💎 While you slept, your miners earned <b>+247 BOLT</b>! Claim before it resets! 🚨`,
    `${greeting}🔥⚡ URGENT: Mining session ending! <b>Claim NOW</b> or lose 8 hours of earnings! 💸`,
    `${greeting}💰🏆 Top miners are pulling <b>10x your rate</b>. Upgrade power and catch up! Time's ticking!`,
    `${greeting}⏰😤 Your mining is at <b>32%</b> capacity! Max it out NOW before others take your spot!`,
    `${greeting}🚀💎 SECRET: <b>Bonus mining hour</b> active! Start session NOW for extra rewards! ⚡`,
    `${greeting}📈🔥 Your competitors upgraded! You're falling behind. <b>Boost your power</b> TODAY!`,
    `${greeting}⛏️💸 <b>8 hours of BOLT</b> waiting for you! Don't let them expire. CLAIM NOW!`
  ];
  
  const referralMessages = [
    `${greeting}👥💰 Your friend just earned <b>0.5 TON</b> from referrals! Where's YOUR share? Share link NOW!`,
    `${greeting}🤑🔥 LEAK: Top referrer earned <b>$500 this week</b>! Your link = passive income. Share it!`,
    `${greeting}💎👀 <b>5 friends = 0.5 TON</b> FREE! You're leaving real money on the table. ACT NOW!`,
    `${greeting}🚀💸 While you wait, others are earning <b>TON daily</b>! Share your link, retire early! 🏖️`,
    `${greeting}⚡🤝 SECRET BONUS: Next 3 referrals get <b>DOUBLE rewards</b>! Limited time only!`,
    `${greeting}💰😱 You could've earned <b>$50 today</b> from referrals! Don't miss tomorrow. SHARE NOW!`,
    `${greeting}🎁🔥 Your referral earnings: <b>$0</b>. Fix that TODAY! One share = passive income!`
  ];
  
  const generalMessages = [
    `${greeting}🚨💰 ALERT: <b>Unclaimed rewards</b> detected in your account! Expires at MIDNIGHT! 🕛`,
    `${greeting}🔥😱 You're in the top 20%! But <b>3 daily tasks</b> away from VIP rewards. Complete NOW!`,
    `${greeting}💎⚡ BREAKING: <b>Flash bonus</b> activated! Log in next 2 hours for surprise reward!`,
    `${greeting}🎯🏆 <b>Your rank is dropping!</b> Complete tasks NOW to stay in the prize pool!`,
    `${greeting}✨🤑 SECRET: <b>Hidden achievements</b> unlocked today! Check app for free rewards!`,
    `${greeting}⏰💸 <b>Daily reset in 3 hours!</b> You still haven't claimed all your rewards! HURRY!`,
    `${greeting}🚀🔥 VIP users earned <b>5x more</b> today! Upgrade now before prices increase!`
  ];

  const messages: Record<string, string[]> = {
    spin: spinMessages,
    mining: miningMessages,
    referral: referralMessages,
    general: generalMessages
  };

  const themeMessages = messages[theme] || messages.general;
  // Add some randomness to message selection
  const randomOffset = Math.floor(Math.random() * 3);
  const messageIndex = (dayOfYear + randomOffset) % themeMessages.length;
  
  return themeMessages[messageIndex];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { time_slot } = await req.json();
    const today = new Date().toISOString().split('T')[0];

    console.log(`Processing ${time_slot} notifications for ${today}`);

    // Check if already sent for this time slot today
    const { data: existingNotification } = await supabase
      .from('ai_scheduled_notifications')
      .select('id')
      .eq('notification_date', today)
      .eq('time_slot', time_slot)
      .eq('sent', true)
      .limit(1);

    if (existingNotification && existingNotification.length > 0) {
      console.log(`Already sent ${time_slot} notification for ${today}`);
      return new Response(
        JSON.stringify({ success: true, message: 'Already sent for this time slot' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get a random template for this time slot
    const { data: templates, error: templateError } = await supabase
      .from('notification_templates')
      .select('*')
      .eq('time_slot', time_slot)
      .eq('is_active', true);

    if (templateError || !templates || templates.length === 0) {
      console.error('No templates found:', templateError);
      return new Response(
        JSON.stringify({ success: false, error: 'No templates available' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Select random template based on day
    const now = new Date();
    const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
    const templateIndex = dayOfYear % templates.length;
    const template = templates[templateIndex];
    console.log('Selected template:', template.theme, template.prompt_context, 'dayOfYear:', dayOfYear);

    // Get all users with telegram_id who have notifications enabled and haven't blocked the bot
    const { data: users, error: usersError } = await supabase
      .from('bolt_users')
      .select('telegram_id, first_name')
      .not('telegram_id', 'is', null)
      .neq('notifications_enabled', false)
      .neq('bot_blocked', true);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch users' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Sending to ${users?.length || 0} eligible users (notifications enabled, not blocked)`);

    // Send to all users with proper rate limiting
    let successCount = 0;
    let failCount = 0;
    let blockedCount = 0;
    let rateLimitHits = 0;
    const blockedUsers: number[] = [];

    for (let i = 0; i < (users?.length || 0); i++) {
      const user = users![i];
      
      // Batch delay - longer pause between batches
      if (i > 0 && i % BATCH_SIZE === 0) {
        console.log(`Batch ${Math.floor(i / BATCH_SIZE)} complete (${successCount} success, ${failCount} fail). Waiting ${BATCH_DELAY_MS/1000}s...`);
        await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
      }

      // Generate personalized message for each user (or every 10 users to balance performance)
      let message: string;
      if (i % 10 === 0) {
        message = await generatePersonalizedMessage(
          { theme: template.theme, prompt_context: template.prompt_context, time_slot },
          dayOfYear,
          user.first_name || undefined
        );
      } else {
        message = getDefaultMessage(time_slot, template.theme, dayOfYear + i, user.first_name || undefined);
      }

      const result = await sendTelegramMessage(user.telegram_id, message);
      
      if (result.success) {
        successCount++;
      } else {
        failCount++;
        if (result.blocked) {
          blockedCount++;
          blockedUsers.push(user.telegram_id);
        }
        if (result.rateLimited) {
          rateLimitHits++;
          // If we hit rate limit, wait longer
          console.warn('Rate limit hit, extending delay...');
          await new Promise(resolve => setTimeout(resolve, 30000)); // 30 second pause
        }
      }

      // Random delay between messages to avoid pattern detection
      await new Promise(resolve => setTimeout(resolve, getRandomDelay()));
    }

    // Update blocked users in database
    if (blockedUsers.length > 0) {
      console.log(`Marking ${blockedUsers.length} users as bot_blocked`);
      await supabase
        .from('bolt_users')
        .update({ bot_blocked: true })
        .in('telegram_id', blockedUsers);
    }

    console.log(`Final: ${successCount} success, ${failCount} failed, ${blockedCount} blocked, ${rateLimitHits} rate limits`);

    // Record the notification
    await supabase
      .from('ai_scheduled_notifications')
      .insert({
        message_text: 'Personalized messages sent',
        notification_type: template.theme,
        target_all_users: true,
        sent: true,
        sent_at: new Date().toISOString(),
        notification_date: today,
        time_slot: time_slot
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Sent to ${successCount} users`,
        stats: { 
          success: successCount, 
          failed: failCount, 
          blocked: blockedCount,
          rateLimitHits,
          totalEligible: users?.length || 0
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Daily notifications error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
