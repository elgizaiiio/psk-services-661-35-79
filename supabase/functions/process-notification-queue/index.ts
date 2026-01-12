import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');

// Safety switch: default is DISABLED to prevent accidental spam.
// Set env NOTIFICATION_QUEUE_DISABLED=false to enable processing.
const NOTIFICATION_QUEUE_DISABLED = (Deno.env.get('NOTIFICATION_QUEUE_DISABLED') ?? 'true') !== 'false';

const BATCH_SIZE = 25; // Process 25 messages per run
const MAX_RETRIES = 3;

interface SendResult {
  success: boolean;
  blocked?: boolean;
  rateLimited?: boolean;
  error?: string;
}

async function sendTelegramMessage(chatId: number, text: string, replyMarkup?: object): Promise<SendResult> {
  if (!TELEGRAM_BOT_TOKEN) {
    return { success: false, error: 'Missing bot token' };
  }

  try {
    const body: Record<string, unknown> = {
      chat_id: chatId,
      text: text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    };

    if (replyMarkup) {
      body.reply_markup = replyMarkup;
    }

    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );

    const result = await response.json();

    if (!result.ok) {
      const errorCode = result.error_code;
      const description = result.description || '';

      // User blocked the bot
      if (errorCode === 403 || description.includes('blocked') || description.includes('deactivated')) {
        return { success: false, blocked: true, error: description };
      }

      // Rate limited
      if (errorCode === 429) {
        return { success: false, rateLimited: true, error: description };
      }

      return { success: false, error: description };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  if (NOTIFICATION_QUEUE_DISABLED) {
    console.log('[process-notification-queue] Disabled (NOTIFICATION_QUEUE_DISABLED != false)');
    return new Response(
      JSON.stringify({ success: true, processed: 0, disabled: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch pending notifications from queue
    const { data: pendingNotifications, error: fetchError } = await supabase
      .from('notification_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .lt('attempts', MAX_RETRIES)
      .order('created_at', { ascending: true })
      .limit(BATCH_SIZE);

    if (fetchError) {
      console.error('Error fetching queue:', fetchError);
      return new Response(
        JSON.stringify({ success: false, error: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!pendingNotifications || pendingNotifications.length === 0) {
      return new Response(
        JSON.stringify({ success: true, processed: 0, message: 'No pending notifications' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${pendingNotifications.length} notifications from queue`);

    const stats = {
      processed: 0,
      sent: 0,
      failed: 0,
      blocked: 0,
      rateLimited: 0,
    };

    for (const notification of pendingNotifications) {
      stats.processed++;

      // Add small delay between messages to avoid rate limits
      if (stats.processed > 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Add buttons for broadcast messages
      let replyMarkup: object | undefined = undefined;
      if (notification.time_slot === 'broadcast') {
        replyMarkup = {
          inline_keyboard: [
            [{ text: '🎰 Play & Win Now', url: 'http://t.me/Boltminingbot' }],
            [{ text: '✅ Withdrawal Proofs', url: 'https://t.me/boltwithdrawals' }],
            [{ text: '📢 Join Community', url: 'https://t.me/boltcomm' }]
          ]
        };
      }

      const result = await sendTelegramMessage(notification.telegram_id, notification.message, replyMarkup);

      if (result.success) {
        stats.sent++;
        // Mark as sent
        await supabase
          .from('notification_queue')
          .update({
            status: 'sent',
            processed_at: new Date().toISOString(),
          })
          .eq('id', notification.id);
      } else if (result.blocked) {
        stats.blocked++;
        // Mark as blocked and update user
        await supabase
          .from('notification_queue')
          .update({
            status: 'blocked',
            last_error: result.error,
            processed_at: new Date().toISOString(),
          })
          .eq('id', notification.id);

        // Update user as blocked
        if (notification.user_id) {
          await supabase
            .from('bolt_users')
            .update({ bot_blocked: true })
            .eq('id', notification.user_id);
        }
      } else if (result.rateLimited) {
        stats.rateLimited++;
        // Reschedule for later
        await supabase
          .from('notification_queue')
          .update({
            attempts: notification.attempts + 1,
            last_error: result.error,
            scheduled_for: new Date(Date.now() + 60000).toISOString(), // Retry in 1 minute
          })
          .eq('id', notification.id);
        
        // Stop processing if rate limited
        console.log('Rate limited, stopping batch processing');
        break;
      } else {
        stats.failed++;
        // Increment attempts
        await supabase
          .from('notification_queue')
          .update({
            attempts: notification.attempts + 1,
            last_error: result.error,
            status: notification.attempts + 1 >= MAX_RETRIES ? 'failed' : 'pending',
          })
          .eq('id', notification.id);
      }
    }

    const duration = Date.now() - startTime;
    console.log(`Queue processing completed in ${duration}ms:`, stats);

    return new Response(
      JSON.stringify({
        success: true,
        ...stats,
        duration_ms: duration,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Queue processing error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
