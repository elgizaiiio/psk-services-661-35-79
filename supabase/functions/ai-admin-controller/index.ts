import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

interface AIRequest {
  action: 'generate_offer' | 'generate_notification' | 'analyze_users';
  context?: Record<string, unknown>;
}

async function sendTelegramNotification(chatId: number, text: string) {
  if (!TELEGRAM_BOT_TOKEN) {
    console.log('TELEGRAM_BOT_TOKEN not configured');
    return null;
  }
  
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
    
    return await response.json();
  } catch (error) {
    console.error('Error sending Telegram notification:', error);
    return null;
  }
}

async function callAI(prompt: string, systemPrompt: string): Promise<string> {
  if (!LOVABLE_API_KEY) {
    throw new Error('LOVABLE_API_KEY not configured');
  }

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
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('AI Gateway error:', response.status, error);
    throw new Error(`AI Gateway error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

async function generateDynamicOffer(supabase: any, context: Record<string, unknown>) {
  const systemPrompt = `You are an intelligent assistant specializing in creating promotional offers for a gaming and rewards app.
Important rules:
1. Offers must be attractive and encouraging
2. Users cannot win TON or USDT - only BOLT tokens
3. Offers include discounts on tickets or BOLT multipliers
4. Write in English only

Return JSON in this format:
{
  "title": "English offer title",
  "description": "Short English description",
  "offer_type": "slots_discount" or "spin_bonus" or "token_multiplier",
  "discount_percent": number from 10-50,
  "bonus_multiplier": number from 1.5-3,
  "duration_hours": number from 1-24
}`;

  const prompt = `Create a new promotional offer based on this context:
- Current time: ${new Date().toISOString()}
- Required offer type: ${context?.offerType || 'random'}
- Additional info: ${JSON.stringify(context)}`;

  try {
    const aiResponse = await callAI(prompt, systemPrompt);
    
    // Extract JSON from response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in AI response:', aiResponse);
      return null;
    }

    const offerData = JSON.parse(jsonMatch[0]);
    
    // Calculate expiry time
    const durationHours = offerData.duration_hours || 6;
    const expiresAt = new Date(Date.now() + durationHours * 60 * 60 * 1000);

    // Insert offer into database
    const { data: offer, error } = await supabase
      .from('ai_dynamic_offers')
      .insert({
        offer_type: offerData.offer_type || 'slots_discount',
        title: offerData.title,
        title_ar: offerData.title,
        description: offerData.description,
        description_ar: offerData.description,
        discount_percent: offerData.discount_percent || 0,
        bonus_multiplier: offerData.bonus_multiplier || 1,
        expires_at: expiresAt.toISOString(),
        is_active: true,
        created_by_ai: true,
        metadata: { context, ai_response: offerData },
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting offer:', error);
      return null;
    }

    console.log('🎁 AI created new offer:', offer.id);
    return offer;
  } catch (error) {
    console.error('Error generating offer:', error);
    return null;
  }
}

async function generateNotification(supabase: any, context: Record<string, unknown>) {
  const systemPrompt = `You are an intelligent assistant specializing in creating motivational notification messages for a gaming app.
Rules:
1. Messages must be short and encouraging
2. Use emojis appropriately
3. Write in English only
4. Encourage users to play and participate

Return JSON in format:
{
  "message_text": "English message",
  "notification_type": "offer" or "reminder" or "achievement" or "general"
}`;

  const prompt = `Create a notification message based on:
- Notification type: ${context?.notificationType || 'general'}
- Target: ${context?.targetAll ? 'all users' : 'specific user'}
- Context: ${JSON.stringify(context)}`;

  try {
    const aiResponse = await callAI(prompt, systemPrompt);
    
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in AI response');
      return null;
    }

    const notificationData = JSON.parse(jsonMatch[0]);
    
    // Insert notification
    const { data: notification, error } = await supabase
      .from('ai_scheduled_notifications')
      .insert({
        target_user_id: context?.targetUserId || null,
        target_all_users: context?.targetAll || false,
        message_text: notificationData.message_text,
        message_text_ar: notificationData.message_text,
        notification_type: notificationData.notification_type || 'general',
        scheduled_for: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting notification:', error);
      return null;
    }

    // If target_all_users, send to all users
    if (context?.targetAll) {
      const { data: users } = await supabase
        .from('bolt_users')
        .select('telegram_id')
        .not('telegram_id', 'is', null);

      if (users) {
        for (const user of users.slice(0, 100)) { // Limit to 100 users per batch
          await sendTelegramNotification(user.telegram_id, notificationData.message_text);
          // Add small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        await supabase
          .from('ai_scheduled_notifications')
          .update({ sent: true, sent_at: new Date().toISOString() })
          .eq('id', notification.id);
      }
    }

    console.log('📢 AI created notification:', notification.id);
    return notification;
  } catch (error) {
    console.error('Error generating notification:', error);
    return null;
  }
}

async function analyzeUsers(supabase: any, context: Record<string, unknown>) {
  // Get user statistics for AI analysis
  const { data: stats } = await supabase
    .from('bolt_users')
    .select('id, token_balance, total_referrals, created_at')
    .order('token_balance', { ascending: false })
    .limit(100);

  const systemPrompt = `You are a data analyst specializing in understanding user behavior.
Analyze the provided data and provide useful insights about:
1. Most active users
2. Suggestions for increasing engagement
3. Best time to send notifications
4. Ideas for promotional offers

Return JSON in format:
{
  "insights": ["insight 1", "insight 2"],
  "suggestions": ["suggestion 1", "suggestion 2"],
  "recommended_offer_types": ["type 1", "type 2"]
}`;

  const prompt = `Analyze this data:
- Number of users: ${stats?.length || 0}
- Highest balance: ${stats?.[0]?.token_balance || 0}
- Average referrals: ${stats ? stats.reduce((a: number, b: any) => a + (b.total_referrals || 0), 0) / stats.length : 0}
- Context: ${JSON.stringify(context)}`;

  try {
    const aiResponse = await callAI(prompt, systemPrompt);
    
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return { raw_response: aiResponse };
  } catch (error) {
    console.error('Error analyzing users:', error);
    return null;
  }
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

    const { action, context = {} } = await req.json() as AIRequest;

    console.log(`🤖 AI Admin Controller - Action: ${action}`);

    let result: unknown;

    switch (action) {
      case 'generate_offer':
        result = await generateDynamicOffer(supabase, context);
        break;
      case 'generate_notification':
        result = await generateNotification(supabase, context);
        break;
      case 'analyze_users':
        result = await analyzeUsers(supabase, context);
        break;
      default:
        return new Response(
          JSON.stringify({ error: 'Unknown action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ AI Admin Controller error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
