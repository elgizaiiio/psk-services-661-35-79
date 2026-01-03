import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

async function sendTelegramMessage(chatId: number, text: string): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN) {
    console.error('TELEGRAM_BOT_TOKEN not configured');
    return false;
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
      console.error(`Failed to send to ${chatId}:`, result.description);
      return false;
    }
    return true;
  } catch (error) {
    console.error(`Error sending to ${chatId}:`, error);
    return false;
  }
}

async function generateAIMessage(template: { theme: string; prompt_context: string; time_slot: string }, dayOfYear: number): Promise<string> {
  if (!LOVABLE_API_KEY) {
    console.error('LOVABLE_API_KEY not configured');
    return getDefaultMessage(template.time_slot, template.theme, dayOfYear);
  }

  try {
    const systemPrompt = `You are a master persuasion copywriter for BOLT - a crypto mining and gambling app.

🎯 YOUR MISSION: Create a notification that users CAN'T IGNORE and MUST tap.

⚡ DARK PSYCHOLOGY TACTICS TO USE:
1. FOMO (Fear of Missing Out) - "Others are winning RIGHT NOW"
2. Scarcity - "Only 2 hours left", "Limited spins remaining"
3. Social Proof - "10,000 users already claimed today"
4. Loss Aversion - "Don't lose your streak", "You're leaving money on the table"
5. Urgency - "Expires at midnight", "Your bonus is waiting"
6. Curiosity Gap - "Your reward is ready... (tap to see)"
7. Personalization - "Your lucky hour is NOW"

📝 FORMAT:
- Start with 2-3 powerful emojis
- Use BOLD text with <b>tags</b> for key numbers and actions
- Create URGENCY without being spammy
- Max 3 short sentences (~150 chars)
- End with a HOOK that demands action

🎰 APP FEATURES: Lucky Spin (free daily), Mining Servers (earn BOLT/USDT), Referral (earn TON), VIP Rewards

⏰ Time: ${template.time_slot}
📌 Theme: ${template.theme}
💡 Focus: ${template.prompt_context}
🔢 Day variation seed: ${dayOfYear} (use this to make message unique)

NEVER repeat the same message structure. Be creative and use different angles each time.`;

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
          { role: 'user', content: `Generate a ${template.time_slot} notification about "${template.theme}" using dark psychology. Make it irresistible. Day variation: ${dayOfYear}` }
        ],
        max_tokens: 200,
        temperature: 0.9,
      }),
    });

    if (!response.ok) {
      console.error('AI API error:', response.status);
      return getDefaultMessage(template.time_slot, template.theme, dayOfYear);
    }

    const data = await response.json();
    const message = data.choices?.[0]?.message?.content?.trim();
    
    if (message) {
      console.log('AI generated message:', message);
      return message;
    }
    
    return getDefaultMessage(template.time_slot, template.theme, dayOfYear);
  } catch (error) {
    console.error('AI generation error:', error);
    return getDefaultMessage(template.time_slot, template.theme, dayOfYear);
  }
}

function getDefaultMessage(timeSlot: string, theme: string, dayOfYear: number): string {
  const spinMessages = [
    "🎰🔥 <b>JACKPOT ALERT!</b> Someone just won 500 USDT! Your turn is next... Spin NOW before midnight! ⏰",
    "💎😱 You're missing out! <b>3,847 users</b> already spun today. Your FREE spin expires in hours!",
    "🍀⚡ Your lucky window is OPEN! <b>Last chance</b> for today's free spin. Don't regret it tomorrow!",
    "🎲🤑 WARNING: Unclaimed reward detected! <b>Spin now</b> or lose it forever at midnight!",
    "🌟💰 TOP SECRET: Lucky hour activated! <b>2x rewards</b> for the next 60 minutes. GO GO GO!",
    "🎯🔥 Your streak is at risk! <b>Don't break it now</b>. One spin keeps your rewards alive!",
    "⭐😮 BREAKING: Spin rewards <b>doubled</b> for early birds! Limited to first 1000 spins today!"
  ];
  
  const miningMessages = [
    "⛏️💎 While you slept, your miners earned <b>+247 BOLT</b>! Claim before it resets! 🚨",
    "🔥⚡ URGENT: Mining session ending! <b>Claim NOW</b> or lose 8 hours of earnings! 💸",
    "💰🏆 Top miners are pulling <b>10x your rate</b>. Upgrade power and catch up! Time's ticking!",
    "⏰😤 Your mining is at <b>32%</b> capacity! Max it out NOW before others take your spot!",
    "🚀💎 SECRET: <b>Bonus mining hour</b> active! Start session NOW for extra rewards! ⚡",
    "📈🔥 Your competitors upgraded! You're falling behind. <b>Boost your power</b> TODAY!",
    "⛏️💸 <b>8 hours of BOLT</b> waiting for you! Don't let them expire. CLAIM NOW!"
  ];
  
  const referralMessages = [
    "👥💰 Your friend just earned <b>0.5 TON</b> from referrals! Where's YOUR share? Share link NOW!",
    "🤑🔥 LEAK: Top referrer earned <b>$500 this week</b>! Your link = passive income. Share it!",
    "💎👀 <b>5 friends = 0.5 TON</b> FREE! You're leaving real money on the table. ACT NOW!",
    "🚀💸 While you wait, others are earning <b>TON daily</b>! Share your link, retire early! 🏖️",
    "⚡🤝 SECRET BONUS: Next 3 referrals get <b>DOUBLE rewards</b>! Limited time only!",
    "💰😱 You could've earned <b>$50 today</b> from referrals! Don't miss tomorrow. SHARE NOW!",
    "🎁🔥 Your referral earnings: <b>$0</b>. Fix that TODAY! One share = passive income!"
  ];
  
  const generalMessages = [
    "🚨💰 ALERT: <b>Unclaimed rewards</b> detected in your account! Expires at MIDNIGHT! 🕛",
    "🔥😱 You're in the top 20%! But <b>3 daily tasks</b> away from VIP rewards. Complete NOW!",
    "💎⚡ BREAKING: <b>Flash bonus</b> activated! Log in next 2 hours for surprise reward!",
    "🎯🏆 <b>Your rank is dropping!</b> Complete tasks NOW to stay in the prize pool!",
    "✨🤑 SECRET: <b>Hidden achievements</b> unlocked today! Check app for free rewards!",
    "⏰💸 <b>Daily reset in 3 hours!</b> You still haven't claimed all your rewards! HURRY!",
    "🚀🔥 VIP users earned <b>5x more</b> today! Upgrade now before prices increase!"
  ];

  const messages: Record<string, string[]> = {
    spin: spinMessages,
    mining: miningMessages,
    referral: referralMessages,
    general: generalMessages
  };

  const themeMessages = messages[theme] || messages.general;
  const messageIndex = dayOfYear % themeMessages.length;
  
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

    // Generate AI message with day variation
    const message = await generateAIMessage({
      theme: template.theme,
      prompt_context: template.prompt_context,
      time_slot: time_slot
    }, dayOfYear);

    console.log('Generated message:', message);

    // Get all users with telegram_id
    const { data: users, error: usersError } = await supabase
      .from('bolt_users')
      .select('telegram_id')
      .not('telegram_id', 'is', null);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch users' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Sending to ${users?.length || 0} users`);

    // Send to all users with rate limiting
    let successCount = 0;
    let failCount = 0;
    const BATCH_SIZE = 200;
    const DELAY_MS = 50;

    for (let i = 0; i < (users?.length || 0); i++) {
      const user = users![i];
      
      // Rate limiting delay
      if (i > 0 && i % BATCH_SIZE === 0) {
        console.log(`Batch ${Math.floor(i / BATCH_SIZE)} complete, waiting...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const success = await sendTelegramMessage(user.telegram_id, message);
      if (success) {
        successCount++;
      } else {
        failCount++;
      }

      // Small delay between messages
      await new Promise(resolve => setTimeout(resolve, DELAY_MS));
    }

    console.log(`Sent: ${successCount} success, ${failCount} failed`);

    // Record the notification
    await supabase
      .from('ai_scheduled_notifications')
      .insert({
        message_text: message,
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
        stats: { success: successCount, failed: failCount }
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
