import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ADMIN_TELEGRAM_IDS = [6657246146];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, adminTelegramId, inlineButton, secretKey } = await req.json();

    // Verify admin - allow either admin telegram ID or secret key
    const isAdmin = ADMIN_TELEGRAM_IDS.includes(Number(adminTelegramId));
    const hasSecretKey = secretKey === 'MASS_BROADCAST_2024_SECURE';
    
    if (!isAdmin && !hasSecretKey) {
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

    // Get ALL users using pagination - no filters
    let allUsers: any[] = [];
    let offset = 0;
    const pageSize = 1000;
    
    while (true) {
      const { data: users, error } = await supabase
        .from('bolt_users')
        .select('telegram_id, first_name')
        .not('telegram_id', 'is', null)
        .range(offset, offset + pageSize - 1);
      
      if (error) {
        console.error('Error fetching users:', error);
        break;
      }
      
      if (!users || users.length === 0) break;
      
      allUsers = allUsers.concat(users);
      offset += pageSize;
      
      if (users.length < pageSize) break;
    }

    if (allUsers.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No users found' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Starting mass broadcast to ALL ${allUsers.length} users`);

    // Start background processing
    const sendBroadcast = async () => {
      let sent = 0;
      let failed = 0;
      let blocked = 0;

      const BATCH_SIZE = 500;
      const DELAY_BETWEEN_MESSAGES = 25; // 25ms = ~40 messages/second

      for (let i = 0; i < allUsers.length; i += BATCH_SIZE) {
        const batch = allUsers.slice(i, i + BATCH_SIZE);
        
        for (const user of batch) {
          try {
            // Personalize message
            const personalizedMessage = message.replace('{firstName}', user.first_name || 'User');

            const body: any = {
              chat_id: user.telegram_id,
              text: personalizedMessage,
              parse_mode: 'HTML',
              disable_web_page_preview: false,
            };

            // Add inline button if provided
            if (inlineButton) {
              body.reply_markup = {
                inline_keyboard: [[inlineButton]]
              };
            }

            const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body),
            });

            const result = await response.json();

            if (result.ok) {
              sent++;
            } else {
              if (result.error_code === 403) {
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

          await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_MESSAGES));
        }

        console.log(`Progress: ${i + batch.length}/${allUsers.length} (sent: ${sent}, failed: ${failed}, blocked: ${blocked})`);
      }

      console.log(`Broadcast complete: sent=${sent}, failed=${failed}, blocked=${blocked}`);

      // Notify admin of completion
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: adminTelegramId,
          text: `Broadcast Complete\n\nTotal: ${allUsers.length}\nSent: ${sent}\nFailed: ${failed}\nBlocked: ${blocked}`,
          parse_mode: 'HTML',
        }),
      });
    };

    // Use EdgeRuntime.waitUntil for background processing
    if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
      EdgeRuntime.waitUntil(sendBroadcast());
    } else {
      // Fallback: run in background without waiting
      sendBroadcast().catch(console.error);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Broadcast started to ${allUsers.length} users. You will be notified when complete.`
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