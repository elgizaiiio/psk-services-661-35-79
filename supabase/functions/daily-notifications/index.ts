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
    
    const systemPrompt = `You are a marketing copywriter for BOLT - a crypto mining app.

🎯 CREATE: Professional Telegram notification in OFFER style.

📝 FORMAT (follow this structure):
${greeting ? `${greeting}` : ''}[Emoji] <b>Catchy Title!</b>

[Short compelling description - 1-2 sentences]

• Includes:
- Benefit 1
- Benefit 2  
- Benefit 3

⏰ [Urgency message - e.g. "Limited time!" or "Don't miss out!"]

📌 RULES:
- Use HTML <b>tags</b> for bold, NOT markdown
- Keep under 300 characters total
- Create urgency without spam
- Make message UNIQUE - seed: ${randomSeed}
- Theme: ${template.theme}
- Time: ${template.time_slot}

🎰 APP FEATURES: Lucky Spin, Mining Servers, Referral Rewards, VIP Benefits`;

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
    `${greeting}🎰 <b>Lucky Spin Bonus!</b>\n\nHigh win rate active now!\n\n• Includes:\n- Real USDT chances\n- TON rewards\n- Free bonus\n\n⏰ Spin now!`,
    `${greeting}🎲 <b>Spin & Win!</b>\n\nYour free daily spin is ready!\n\n• Includes:\n- USDT prizes\n- BOLT tokens\n- Bonus rewards\n\n⏰ Don't miss out!`,
    `${greeting}🍀 <b>Lucky Hour Active!</b>\n\nBoosted rewards for limited time!\n\n• Includes:\n- Higher win rates\n- Extra bonuses\n- Free spins\n\n⏰ Play now!`
  ];
  
  const miningMessages = [
    `${greeting}⛏️ <b>Mining Rewards Ready!</b>\n\nYour BOLT is waiting to be claimed!\n\n• Includes:\n- 8 hours of mining\n- Bonus tokens\n- Power upgrades\n\n⏰ Claim now!`,
    `${greeting}💎 <b>Mining Boost Active!</b>\n\nEarn more BOLT per hour!\n\n• Includes:\n- Increased rate\n- Extra rewards\n- VIP bonuses\n\n⏰ Start mining!`,
    `${greeting}🚀 <b>Power Up Your Mining!</b>\n\nMaximize your earnings today!\n\n• Includes:\n- Higher power\n- More tokens\n- Daily bonuses\n\n⏰ Upgrade now!`
  ];
  
  const referralMessages = [
    `${greeting}👥 <b>Referral Rewards!</b>\n\nEarn TON for every friend!\n\n• Includes:\n- 0.1 TON per referral\n- Bonus tokens\n- Contest entries\n\n⏰ Share now!`,
    `${greeting}💰 <b>Invite & Earn!</b>\n\nPassive income awaits!\n\n• Includes:\n- Real TON rewards\n- BOLT bonuses\n- VIP perks\n\n⏰ Start inviting!`,
    `${greeting}🎁 <b>Friend Bonus Active!</b>\n\nDouble referral rewards today!\n\n• Includes:\n- 2x TON rewards\n- Extra tokens\n- Special prizes\n\n⏰ Limited time!`
  ];
  
  const generalMessages = [
    `${greeting}🎯 <b>Daily Rewards!</b>\n\nComplete tasks for free BOLT!\n\n• Includes:\n- Free tokens\n- Bonus spins\n- VIP points\n\n⏰ Claim now!`,
    `${greeting}🏆 <b>Contest Update!</b>\n\n$10,000 prize pool LIVE!\n\n• Includes:\n- TON prizes\n- USDT rewards\n- Leaderboard bonus\n\n⏰ Join now!`,
    `${greeting}⚡ <b>Flash Bonus!</b>\n\nLimited time rewards active!\n\n• Includes:\n- Extra BOLT\n- Free spins\n- VIP upgrades\n\n⏰ Don't miss out!`
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
