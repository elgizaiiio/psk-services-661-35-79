import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

// Rate limiting settings - IMPORTANT for avoiding Telegram ban
const MIN_DELAY_MS = 1500; // 1.5 seconds minimum
const MAX_DELAY_MS = 2500; // 2.5 seconds maximum
const BATCH_SIZE = 20; // Smaller batches for marketing
const BATCH_DELAY_MS = 10000; // 10 seconds between batches

interface UserSegmentRules {
  days_since_signup?: { max?: number; min?: number };
  days_inactive?: { min?: number; max?: number };
  min_balance?: number;
  max_balance?: number;
  min_referrals?: number;
  last_mining_hours?: number;
}

interface Campaign {
  id: string;
  name: string;
  campaign_type: string;
  trigger_type: string;
  target_segment: string;
  ai_prompt_context: string;
  message_template: string | null;
  priority: number;
  cooldown_hours: number;
}

interface User {
  id: string;
  telegram_id: number;
  telegram_username: string | null;
  first_name: string | null;
  token_balance: number;
  total_referrals: number;
  created_at: string;
  updated_at: string;
  notifications_enabled?: boolean;
  bot_blocked?: boolean;
}

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
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML',
      }),
    });

    const result = await response.json();
    
    if (!result.ok) {
      const errorCode = result.error_code;
      const description = result.description || '';
      
      // User blocked the bot
      if (errorCode === 403 || description.includes('blocked') || description.includes('deactivated')) {
        console.log(`User ${chatId} blocked bot or deactivated`);
        return { success: false, blocked: true };
      }
      
      // Rate limited
      if (errorCode === 429) {
        console.warn(`Rate limited for ${chatId}`);
        if (retryCount < 2) {
          const retryAfter = (result.parameters?.retry_after || 30) * 1000;
          await new Promise(resolve => setTimeout(resolve, retryAfter));
          return sendTelegramMessage(chatId, text, retryCount + 1);
        }
        return { success: false, rateLimited: true };
      }
      
      console.error(`Failed to send message to ${chatId}:`, description);
      return { success: false };
    }
    
    return { success: true };
  } catch (error) {
    console.error(`Failed to send message to ${chatId}:`, error);
    return { success: false };
  }
}

async function generateAIMessage(context: string, userName: string): Promise<string> {
  if (!LOVABLE_API_KEY) {
    return getDefaultMessage(context);
  }

  try {
    const randomSeed = Math.floor(Math.random() * 1000);
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a friendly marketing assistant for a crypto mining app called BOLT. 
Generate SHORT, engaging Telegram messages (max 200 characters).
Use HTML formatting (<b>bold</b>, NOT markdown **bold**).
Use emojis sparingly. Be friendly but professional.
The user's name is: ${userName || 'Friend'}
Make each message unique - random seed: ${randomSeed}`
          },
          {
            role: 'user',
            content: context
          }
        ],
        max_tokens: 150,
        temperature: 0.9,
      }),
    });

    if (!response.ok) {
      throw new Error('AI API request failed');
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || getDefaultMessage(context);
  } catch (error) {
    console.error('AI generation error:', error);
    return getDefaultMessage(context);
  }
}

function getDefaultMessage(context: string): string {
  if (context.includes('Welcome') || context.includes('onboarding')) {
    return "⚡ Welcome to BOLT Mining! Start mining now and earn rewards daily. Tap to begin your journey! 🚀";
  }
  if (context.includes('inactive') || context.includes('3 days')) {
    return "👋 We miss you! Your mining rewards are waiting. Come back and claim them before they expire! ⏰";
  }
  if (context.includes('7 days') || context.includes('week')) {
    return "🎁 Special comeback bonus waiting for you! We've added extra rewards to your account. Claim now! 💎";
  }
  if (context.includes('referral')) {
    return "🤝 Invite friends & earn 500 BOLT per referral! Share your link now and watch your earnings grow! 💰";
  }
  return "⚡ Don't forget to claim your daily mining rewards! Every hour counts. Start mining now! 🔥";
}

async function getUsersInSegment(
  supabase: ReturnType<typeof createClient>,
  segmentKey: string,
  rules: UserSegmentRules
): Promise<User[]> {
  let query = supabase
    .from('bolt_users')
    .select('*')
    .not('telegram_id', 'is', null)
    .neq('notifications_enabled', false)
    .neq('bot_blocked', true);

  const now = new Date();

  // Apply segment rules
  if (rules.days_since_signup?.max) {
    const minDate = new Date(now.getTime() - rules.days_since_signup.max * 24 * 60 * 60 * 1000);
    query = query.gte('created_at', minDate.toISOString());
  }

  if (rules.days_inactive?.min) {
    const maxDate = new Date(now.getTime() - rules.days_inactive.min * 24 * 60 * 60 * 1000);
    query = query.lte('updated_at', maxDate.toISOString());
  }

  if (rules.min_balance) {
    query = query.gte('token_balance', rules.min_balance);
  }

  if (rules.max_balance !== undefined) {
    query = query.lte('token_balance', rules.max_balance);
  }

  if (rules.min_referrals) {
    query = query.gte('total_referrals', rules.min_referrals);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching users:', error);
    return [];
  }

  return data || [];
}

async function hasRecentMessage(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  campaignId: string,
  cooldownHours: number
): Promise<boolean> {
  const cooldownTime = new Date(Date.now() - cooldownHours * 60 * 60 * 1000);

  const { data } = await supabase
    .from('marketing_events')
    .select('id')
    .eq('user_id', userId)
    .eq('campaign_id', campaignId)
    .gte('created_at', cooldownTime.toISOString())
    .limit(1);

  return (data?.length || 0) > 0;
}

async function recordMarketingEvent(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  campaignId: string,
  eventType: string,
  message: string,
  delivered: boolean
) {
  await supabase.from('marketing_events').insert({
    user_id: userId,
    campaign_id: campaignId,
    event_type: eventType,
    message_sent: message,
    delivery_status: delivered ? 'delivered' : 'failed',
    sent_at: new Date().toISOString(),
  });
}

async function updateAnalytics(
  supabase: ReturnType<typeof createClient>,
  campaignId: string,
  sent: number,
  delivered: number
) {
  const today = new Date().toISOString().split('T')[0];

  const { data: existing } = await supabase
    .from('campaign_analytics')
    .select('*')
    .eq('campaign_id', campaignId)
    .eq('date', today)
    .single();

  if (existing) {
    await supabase
      .from('campaign_analytics')
      .update({
        messages_sent: existing.messages_sent + sent,
        messages_delivered: existing.messages_delivered + delivered,
      })
      .eq('id', existing.id);
  } else {
    await supabase.from('campaign_analytics').insert({
      campaign_id: campaignId,
      date: today,
      messages_sent: sent,
      messages_delivered: delivered,
    });
  }
}

async function markUserAsBlocked(supabase: ReturnType<typeof createClient>, telegramId: number) {
  await supabase
    .from('bolt_users')
    .update({ bot_blocked: true })
    .eq('telegram_id', telegramId);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { campaign_id, event_type, user_id } = await req.json().catch(() => ({}));

    let campaigns: Campaign[] = [];

    // If specific campaign requested
    if (campaign_id) {
      const { data } = await supabase
        .from('marketing_campaigns')
        .select('*')
        .eq('id', campaign_id)
        .eq('is_active', true)
        .single();
      
      if (data) campaigns = [data];
    } 
    // If event-based trigger
    else if (event_type) {
      const { data } = await supabase
        .from('marketing_campaigns')
        .select('*')
        .eq('trigger_type', 'event_based')
        .eq('is_active', true)
        .order('priority', { ascending: false });
      
      campaigns = data || [];
    }
    // Otherwise, get all scheduled campaigns
    else {
      const { data } = await supabase
        .from('marketing_campaigns')
        .select('*')
        .eq('trigger_type', 'scheduled')
        .eq('is_active', true)
        .order('priority', { ascending: false });
      
      campaigns = data || [];
    }

    let totalSent = 0;
    let totalDelivered = 0;
    let totalBlocked = 0;

    for (const campaign of campaigns) {
      console.log(`Processing campaign: ${campaign.name}`);

      // Get segment rules
      const { data: segment } = await supabase
        .from('user_segments')
        .select('rules')
        .eq('segment_key', campaign.target_segment)
        .single();

      const rules = (segment?.rules as UserSegmentRules) || {};

      // Get users in segment (or specific user if provided)
      let users: User[] = [];
      
      if (user_id) {
        const { data: user } = await supabase
          .from('bolt_users')
          .select('*')
          .eq('id', user_id)
          .neq('notifications_enabled', false)
          .neq('bot_blocked', true)
          .single();
        
        if (user) users = [user];
      } else {
        users = await getUsersInSegment(supabase, campaign.target_segment, rules);
      }

      console.log(`Found ${users.length} eligible users in segment ${campaign.target_segment}`);

      // Process each user with rate limiting
      let campaignSent = 0;
      let campaignDelivered = 0;
      let campaignBlocked = 0;

      for (let i = 0; i < users.length; i++) {
        const user = users[i];
        
        // Batch delay
        if (i > 0 && i % BATCH_SIZE === 0) {
          console.log(`Batch ${Math.floor(i / BATCH_SIZE)} complete. Waiting ${BATCH_DELAY_MS/1000}s...`);
          await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
        }

        // Check cooldown
        if (await hasRecentMessage(supabase, user.id, campaign.id, campaign.cooldown_hours)) {
          console.log(`Skipping user ${user.id} - within cooldown period`);
          continue;
        }

        // Generate personalized message
        const message = await generateAIMessage(
          campaign.ai_prompt_context || campaign.message_template || '',
          user.first_name || user.telegram_username || ''
        );

        // Send message
        const result = await sendTelegramMessage(user.telegram_id, message);
        
        // Record event
        await recordMarketingEvent(
          supabase,
          user.id,
          campaign.id,
          event_type || 'scheduled',
          message,
          result.success
        );

        campaignSent++;
        
        if (result.success) {
          campaignDelivered++;
        } else if (result.blocked) {
          campaignBlocked++;
          await markUserAsBlocked(supabase, user.telegram_id);
        } else if (result.rateLimited) {
          // If rate limited, take a longer break
          console.warn('Rate limited, taking extended break...');
          await new Promise(resolve => setTimeout(resolve, 30000));
        }

        // Random delay between messages
        await new Promise(resolve => setTimeout(resolve, getRandomDelay()));
      }

      // Update analytics
      await updateAnalytics(supabase, campaign.id, campaignSent, campaignDelivered);

      totalSent += campaignSent;
      totalDelivered += campaignDelivered;
      totalBlocked += campaignBlocked;

      console.log(`Campaign ${campaign.name}: Sent ${campaignSent}, Delivered ${campaignDelivered}, Blocked ${campaignBlocked}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        campaigns_processed: campaigns.length,
        total_sent: totalSent,
        total_delivered: totalDelivered,
        total_blocked: totalBlocked,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Auto marketing error:', error);
    return new Response(
      JSON.stringify({ error: 'Marketing automation failed', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
