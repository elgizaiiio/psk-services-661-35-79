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

async function generateAIMessage(template: { theme: string; prompt_context: string; time_slot: string }): Promise<string> {
  if (!LOVABLE_API_KEY) {
    console.error('LOVABLE_API_KEY not configured');
    return getDefaultMessage(template.time_slot, template.theme);
  }

  try {
    const systemPrompt = `You are a friendly notification bot for a crypto mining and gaming app called BOLT.
Generate a SHORT, engaging notification message (max 2 sentences, ~100 characters).
Use 1-2 relevant emojis. Be enthusiastic but not spammy.
The app has: spin/slots games, mining rewards, referral program (earn TON/USDT).
Time of day: ${template.time_slot}
Theme: ${template.theme}
Context: ${template.prompt_context}`;

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
          { role: 'user', content: `Generate a ${template.time_slot} notification about ${template.theme}. Keep it under 100 characters.` }
        ],
        max_tokens: 100,
      }),
    });

    if (!response.ok) {
      console.error('AI API error:', response.status);
      return getDefaultMessage(template.time_slot, template.theme);
    }

    const data = await response.json();
    const message = data.choices?.[0]?.message?.content?.trim();
    
    if (message) {
      console.log('AI generated message:', message);
      return message;
    }
    
    return getDefaultMessage(template.time_slot, template.theme);
  } catch (error) {
    console.error('AI generation error:', error);
    return getDefaultMessage(template.time_slot, template.theme);
  }
}

function getDefaultMessage(timeSlot: string, theme: string): string {
  const defaults: Record<string, Record<string, string>> = {
    morning: {
      spin: "🌅 Good morning! Start your day with a lucky spin! 🎰",
      mining: "☀️ Rise and shine! Check your mining rewards! ⛏️",
      referral: "🌞 Morning! Invite friends today and earn TON! 💎",
      general: "🌤️ Good morning! Your BOLT rewards await! 🚀"
    },
    afternoon: {
      spin: "🎯 Afternoon break? Perfect time for a spin! 🎰",
      mining: "⚡ Afternoon check! Your miners are working hard! ⛏️",
      referral: "🤝 Invite a friend this afternoon, earn 0.1 TON! 💰",
      general: "🔥 Don't forget your daily tasks! Rewards waiting! 🎁"
    },
    evening: {
      spin: "🌙 End your day with one more lucky spin! 🍀",
      mining: "🌃 Evening check! Claim your mining rewards! 💎",
      referral: "✨ Share your link tonight, earn while you sleep! 💤",
      general: "🌟 Before you rest, grab your rewards! 🎁"
    }
  };

  return defaults[timeSlot]?.[theme] || defaults[timeSlot]?.general || "🎮 Check out BOLT for exciting rewards! 🚀";
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

    // Select random template
    const template = templates[Math.floor(Math.random() * templates.length)];
    console.log('Selected template:', template.theme, template.prompt_context);

    // Generate AI message
    const message = await generateAIMessage({
      theme: template.theme,
      prompt_context: template.prompt_context,
      time_slot: time_slot
    });

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
