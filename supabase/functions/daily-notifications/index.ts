import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

const MAX_DAILY_MESSAGES = 2;

interface RunStats {
  run_type: string;
  time_slot: string | null;
  total_eligible: number;
  sent: number;
  failed: number;
  blocked: number;
  rate_limits: number;
  skipped_daily_limit: number;
  average_delay_ms: number;
  start_time: string;
  end_time: string;
  stopped_early: boolean;
  stop_reason: string | null;
}

async function generatePersonalizedMessage(
  template: { theme: string; prompt_context: string; time_slot: string }, 
  dayOfYear: number,
  userName?: string
): Promise<string> {
  if (!LOVABLE_API_KEY) {
    return getDefaultMessage(template.time_slot, template.theme, dayOfYear, userName);
  }

  try {
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
        temperature: 0.95,
      }),
    });

    if (!response.ok) {
      return getDefaultMessage(template.time_slot, template.theme, dayOfYear, userName);
    }

    const data = await response.json();
    const message = data.choices?.[0]?.message?.content?.trim();
    
    if (message) {
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
  const randomOffset = Math.floor(Math.random() * 3);
  const messageIndex = (dayOfYear + randomOffset) % themeMessages.length;
  
  return themeMessages[messageIndex];
}

function hasReachedDailyLimit(lastMessageDate: string | null, dailyMessageCount: number): boolean {
  const today = new Date().toISOString().split('T')[0];
  if (!lastMessageDate || lastMessageDate !== today) {
    return false;
  }
  return dailyMessageCount >= MAX_DAILY_MESSAGES;
}

async function logRunStats(supabase: ReturnType<typeof createClient>, stats: RunStats) {
  try {
    await supabase.from('notification_run_logs').insert({
      run_type: stats.run_type,
      time_slot: stats.time_slot,
      total_eligible: stats.total_eligible,
      sent: stats.sent,
      failed: stats.failed,
      blocked: stats.blocked,
      rate_limits: stats.rate_limits,
      skipped_daily_limit: stats.skipped_daily_limit,
      average_delay_ms: stats.average_delay_ms,
      start_time: stats.start_time,
      end_time: stats.end_time,
      stopped_early: stats.stopped_early,
      stop_reason: stats.stop_reason,
    });
  } catch (error) {
    console.error('Failed to log run stats:', error);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = new Date();
  let stats: RunStats = {
    run_type: 'daily_queue',
    time_slot: null,
    total_eligible: 0,
    sent: 0,
    failed: 0,
    blocked: 0,
    rate_limits: 0,
    skipped_daily_limit: 0,
    average_delay_ms: 0,
    start_time: startTime.toISOString(),
    end_time: '',
    stopped_early: false,
    stop_reason: null,
  };

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { time_slot } = await req.json();
    const today = new Date().toISOString().split('T')[0];
    stats.time_slot = time_slot;

    console.log(`[QUEUE MODE] Processing ${time_slot} notifications for ${today}`);

    // Check if already queued for this time slot today
    const { data: existingQueue } = await supabase
      .from('notification_queue')
      .select('id')
      .eq('time_slot', time_slot)
      .gte('created_at', `${today}T00:00:00Z`)
      .limit(1);

    if (existingQueue && existingQueue.length > 0) {
      console.log(`Already queued ${time_slot} notifications for ${today}`);
      stats.end_time = new Date().toISOString();
      stats.stop_reason = 'already_queued_today';
      await logRunStats(supabase, stats);
      return new Response(
        JSON.stringify({ success: true, message: 'Already queued for this time slot' }),
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
      stats.end_time = new Date().toISOString();
      stats.stop_reason = 'no_templates';
      await logRunStats(supabase, stats);
      return new Response(
        JSON.stringify({ success: false, error: 'No templates available' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const now = new Date();
    const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
    const templateIndex = dayOfYear % templates.length;
    const template = templates[templateIndex];
    console.log('Selected template:', template.theme);

    // Get all eligible users
    const { data: users, error: usersError } = await supabase
      .from('bolt_users')
      .select('id, telegram_id, first_name, daily_message_count, last_message_date')
      .not('telegram_id', 'is', null)
      .neq('notifications_enabled', false)
      .neq('bot_blocked', true);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      stats.end_time = new Date().toISOString();
      stats.stop_reason = 'fetch_users_error';
      await logRunStats(supabase, stats);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch users' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    stats.total_eligible = users?.length || 0;
    console.log(`Found ${stats.total_eligible} eligible users`);

    // Filter users who haven't reached daily limit
    const eligibleUsers = users?.filter(user => 
      !hasReachedDailyLimit(user.last_message_date, user.daily_message_count || 0)
    ) || [];

    stats.skipped_daily_limit = stats.total_eligible - eligibleUsers.length;
    console.log(`${eligibleUsers.length} users after daily limit filter (${stats.skipped_daily_limit} skipped)`);

    if (eligibleUsers.length === 0) {
      stats.end_time = new Date().toISOString();
      stats.stop_reason = 'no_eligible_users';
      await logRunStats(supabase, stats);
      return new Response(
        JSON.stringify({ success: true, message: 'No eligible users to notify' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate messages and add to queue in batches
    const BATCH_INSERT_SIZE = 100;
    let queuedCount = 0;

    for (let i = 0; i < eligibleUsers.length; i += BATCH_INSERT_SIZE) {
      const batch = eligibleUsers.slice(i, i + BATCH_INSERT_SIZE);
      
      const queueItems = await Promise.all(batch.map(async (user, idx) => {
        // Generate personalized message for every 10th user, default for others
        let message: string;
        if ((i + idx) % 10 === 0) {
          message = await generatePersonalizedMessage(
            { theme: template.theme, prompt_context: template.prompt_context, time_slot },
            dayOfYear,
            user.first_name || undefined
          );
        } else {
          message = getDefaultMessage(time_slot, template.theme, dayOfYear + i + idx, user.first_name || undefined);
        }

        return {
          user_id: user.id,
          telegram_id: user.telegram_id,
          message: message,
          time_slot: time_slot,
          status: 'pending',
          scheduled_for: new Date().toISOString(),
        };
      }));

      const { error: insertError } = await supabase
        .from('notification_queue')
        .insert(queueItems);

      if (insertError) {
        console.error('Error inserting queue batch:', insertError);
      } else {
        queuedCount += batch.length;
        console.log(`Queued batch ${Math.floor(i / BATCH_INSERT_SIZE) + 1}: ${queuedCount} total`);
      }
    }

    stats.sent = queuedCount;
    stats.end_time = new Date().toISOString();

    await logRunStats(supabase, stats);

    // Record the notification
    await supabase
      .from('ai_scheduled_notifications')
      .insert({
        message_text: 'Personalized messages queued',
        notification_type: template.theme,
        target_all_users: true,
        sent: false,
        notification_date: today,
        time_slot: time_slot
      });

    const duration = Date.now() - startTime.getTime();
    console.log(`✅ Queued ${queuedCount} notifications in ${duration}ms`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Queued ${queuedCount} notifications`,
        stats: { 
          queued: queuedCount,
          skippedDailyLimit: stats.skipped_daily_limit,
          totalEligible: stats.total_eligible,
          duration_ms: duration
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Daily notifications error:', error);
    stats.end_time = new Date().toISOString();
    stats.stop_reason = `error: ${error instanceof Error ? error.message : 'Unknown'}`;
    
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      await logRunStats(supabase, stats);
    } catch (logError) {
      console.error('Failed to log error stats:', logError);
    }

    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
