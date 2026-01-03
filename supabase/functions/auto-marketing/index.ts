import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

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
}

async function sendTelegramMessage(chatId: number, text: string): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN) {
    console.error('TELEGRAM_BOT_TOKEN not configured');
    return false;
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
    return result.ok;
  } catch (error) {
    console.error(`Failed to send message to ${chatId}:`, error);
    return false;
  }
}

async function generateAIMessage(context: string, userName: string): Promise<string> {
  if (!LOVABLE_API_KEY) {
    return getDefaultMessage(context);
  }

  try {
    const response = await fetch('https://api.lovable.dev/v1/chat/completions', {
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
Use emojis sparingly. Be friendly but professional.
The user's name is: ${userName || 'Friend'}`
          },
          {
            role: 'user',
            content: context
          }
        ],
        max_tokens: 150,
        temperature: 0.8,
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
  let query = supabase.from('bolt_users').select('*');

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

  // Only get users with telegram_id
  query = query.not('telegram_id', 'is', null);

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

  // Try to update existing record
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
          .single();
        
        if (user) users = [user];
      } else {
        users = await getUsersInSegment(supabase, campaign.target_segment, rules);
      }

      console.log(`Found ${users.length} users in segment ${campaign.target_segment}`);

      // Process each user with rate limiting
      let campaignSent = 0;
      let campaignDelivered = 0;

      for (const user of users) {
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
        const delivered = await sendTelegramMessage(user.telegram_id, message);
        
        // Record event
        await recordMarketingEvent(
          supabase,
          user.id,
          campaign.id,
          event_type || 'scheduled',
          message,
          delivered
        );

        campaignSent++;
        if (delivered) campaignDelivered++;

        // Rate limit: wait 100ms between messages
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Update analytics
      await updateAnalytics(supabase, campaign.id, campaignSent, campaignDelivered);

      totalSent += campaignSent;
      totalDelivered += campaignDelivered;

      console.log(`Campaign ${campaign.name}: Sent ${campaignSent}, Delivered ${campaignDelivered}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        campaigns_processed: campaigns.length,
        total_sent: totalSent,
        total_delivered: totalDelivered,
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
