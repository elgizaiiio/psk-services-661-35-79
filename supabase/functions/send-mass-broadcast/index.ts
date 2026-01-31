import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ADMIN_TELEGRAM_IDS = [6657246146];
const BATCH_SIZE = 50; // Very small batch to avoid CPU timeout
const DELAY_BETWEEN_MESSAGES = 25; // 25ms delay

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      message, 
      adminTelegramId, 
      inlineButton, 
      secretKey,
      // For chained calls
      offset = 0,
      totalSent = 0,
      totalFailed = 0,
      totalBlocked = 0,
      isChainedCall = false
    } = await req.json();

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

    // Get users for this batch only
    const { data: users, error: fetchError } = await supabase
      .from('bolt_users')
      .select('telegram_id, first_name')
      .not('telegram_id', 'is', null)
      .eq('bot_blocked', false)
      .range(offset, offset + BATCH_SIZE - 1);

    if (fetchError) {
      console.error('Error fetching users:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch users' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get total count for progress tracking (only on first call)
    let totalUsers = 0;
    if (!isChainedCall) {
      const { count } = await supabase
        .from('bolt_users')
        .select('*', { count: 'exact', head: true })
        .not('telegram_id', 'is', null)
        .eq('bot_blocked', false);
      totalUsers = count || 0;
      console.log(`Starting mass broadcast to ${totalUsers} users`);
    }

    if (!users || users.length === 0) {
      // No more users, broadcast complete
      const finalMessage = `✅ Broadcast Complete!\n\nTotal Sent: ${totalSent}\nFailed: ${totalFailed}\nBlocked: ${totalBlocked}`;
      
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: adminTelegramId || ADMIN_TELEGRAM_IDS[0],
          text: finalMessage,
          parse_mode: 'HTML',
        }),
      });

      console.log(`Broadcast complete: sent=${totalSent}, failed=${totalFailed}, blocked=${totalBlocked}`);

      return new Response(
        JSON.stringify({
          success: true,
          complete: true,
          sent: totalSent,
          failed: totalFailed,
          blocked: totalBlocked
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process this batch
    let sent = 0;
    let failed = 0;
    let blocked = 0;

    for (const user of users) {
      try {
        const personalizedMessage = message.replace('{firstName}', user.first_name || 'User');

        const body: any = {
          chat_id: user.telegram_id,
          text: personalizedMessage,
          parse_mode: 'HTML',
          disable_web_page_preview: false,
        };

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
          }
        }
      } catch (error) {
        failed++;
      }

      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_MESSAGES));
    }

    const newTotalSent = totalSent + sent;
    const newTotalFailed = totalFailed + failed;
    const newTotalBlocked = totalBlocked + blocked;
    const newOffset = offset + users.length;

    console.log(`Progress: ${newOffset} processed (sent: ${newTotalSent}, failed: ${newTotalFailed}, blocked: ${newTotalBlocked})`);

    // Chain to next batch using EdgeRuntime.waitUntil
    const chainNextBatch = async () => {
      try {
        await fetch(`${supabaseUrl}/functions/v1/send-mass-broadcast`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({
            message,
            adminTelegramId,
            inlineButton,
            secretKey,
            offset: newOffset,
            totalSent: newTotalSent,
            totalFailed: newTotalFailed,
            totalBlocked: newTotalBlocked,
            isChainedCall: true
          }),
        });
      } catch (err) {
        console.error('Failed to chain next batch:', err);
      }
    };

    // Use EdgeRuntime.waitUntil for chaining
    if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
      EdgeRuntime.waitUntil(chainNextBatch());
    } else {
      chainNextBatch().catch(console.error);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: isChainedCall 
          ? `Batch processed: ${newOffset} users (${newTotalSent} sent)`
          : `Broadcast started. Processing in batches of ${BATCH_SIZE}. You will be notified when complete.`,
        progress: {
          processed: newOffset,
          sent: newTotalSent,
          failed: newTotalFailed,
          blocked: newTotalBlocked
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
