import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ADMIN_TELEGRAM_IDS = [6657246146];

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, adminTelegramId, sendToAll } = await req.json();

    // Verify admin
    if (!adminTelegramId || !ADMIN_TELEGRAM_IDS.includes(Number(adminTelegramId))) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Admin only' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');

    if (!botToken) {
      return new Response(
        JSON.stringify({ error: 'Bot token not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get users based on sendToAll flag
    let query = supabase
      .from('bolt_users')
      .select('telegram_id, first_name')
      .not('telegram_id', 'is', null);

    // If sendToAll is true, skip notifications_enabled and bot_blocked filters
    if (!sendToAll) {
      query = query
        .eq('notifications_enabled', true)
        .eq('bot_blocked', false);
    }

    const { data: users, error: usersError } = await query;

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch users' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Starting broadcast to ${users?.length || 0} users (sendToAll: ${sendToAll})`);

    let sent = 0;
    let failed = 0;
    let blocked = 0;

    // Send messages in batches with delays to avoid rate limiting
    const BATCH_SIZE = 25;
    const DELAY_BETWEEN_BATCHES = 1000; // 1 second
    const DELAY_BETWEEN_MESSAGES = 40; // 40ms = ~25 messages/second

    for (let i = 0; i < (users?.length || 0); i += BATCH_SIZE) {
      const batch = users!.slice(i, i + BATCH_SIZE);
      
      for (const user of batch) {
        try {
          const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: user.telegram_id,
              text: message,
              parse_mode: 'HTML',
              disable_web_page_preview: false,
            }),
          });

          const result = await response.json();

          if (result.ok) {
            sent++;
          } else {
            if (result.error_code === 403) {
              // User blocked the bot
              blocked++;
              await supabase
                .from('bolt_users')
                .update({ bot_blocked: true })
                .eq('telegram_id', user.telegram_id);
            } else {
              failed++;
              console.error(`Failed to send to ${user.telegram_id}:`, result.description);
            }
          }
        } catch (error) {
          failed++;
          console.error(`Error sending to ${user.telegram_id}:`, error);
        }

        // Small delay between messages
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_MESSAGES));
      }

      // Longer delay between batches
      if (i + BATCH_SIZE < (users?.length || 0)) {
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
      }
    }

    console.log(`Broadcast complete: sent=${sent}, failed=${failed}, blocked=${blocked}`);

    return new Response(
      JSON.stringify({
        success: true,
        stats: {
          total: users?.length || 0,
          sent,
          failed,
          blocked
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Broadcast error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});