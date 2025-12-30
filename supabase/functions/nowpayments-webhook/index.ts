import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-nowpayments-sig',
};

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');

async function sendTelegramNotification(telegramId: number, text: string): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN) {
    console.log('TELEGRAM_BOT_TOKEN not configured, skipping notification');
    return false;
  }

  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    const body = {
      chat_id: telegramId,
      text: text,
      parse_mode: 'HTML',
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const result = await response.json();
    console.log('Telegram notification sent:', result.ok);
    return result.ok;
  } catch (error) {
    console.error('Error sending Telegram notification:', error);
    return false;
  }
}

// Helper function to sort object keys for signature verification
function sortObject(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.keys(obj)
    .sort()
    .reduce((result: Record<string, unknown>, key: string) => {
      result[key] = obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])
        ? sortObject(obj[key] as Record<string, unknown>)
        : obj[key];
      return result;
    }, {});
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ipnSecret = Deno.env.get('NOWPAYMENTS_IPN_SECRET');
    const signature = req.headers.get('x-nowpayments-sig');
    const body = await req.text();

    console.log('Received NOWPayments webhook');

    // Verify signature if IPN secret is configured
    if (ipnSecret && signature) {
      const sortedData = JSON.stringify(sortObject(JSON.parse(body)));
      const hmac = createHmac('sha512', ipnSecret);
      hmac.update(new TextEncoder().encode(sortedData));
      const calculatedSig = Array.from(hmac.digest())
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      if (calculatedSig !== signature) {
        console.error('Invalid webhook signature');
        return new Response(
          JSON.stringify({ error: 'Invalid signature' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const payload = JSON.parse(body);
    console.log('Webhook payload:', payload);

    const { payment_id, payment_status, order_id, actually_paid, pay_currency } = payload;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find the payment by nowpayments_id or order_id with user data
    const { data: payment, error: findError } = await supabase
      .from('ton_payments')
      .select('*, bolt_users!ton_payments_user_id_fkey(telegram_id, first_name)')
      .or(`nowpayments_id.eq.${payment_id},metadata->>order_id.eq.${order_id}`)
      .single();

    if (findError || !payment) {
      console.error('Payment not found:', findError);
      return new Response(
        JSON.stringify({ error: 'Payment not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Map NOWPayments status to our status
    let newStatus = payment.status;
    if (payment_status === 'finished' || payment_status === 'confirmed') {
      newStatus = 'confirmed';
    } else if (payment_status === 'failed' || payment_status === 'expired') {
      newStatus = 'failed';
    } else if (payment_status === 'waiting' || payment_status === 'confirming') {
      newStatus = 'pending';
    }

    // Update payment status
    const { error: updateError } = await supabase
      .from('ton_payments')
      .update({
        status: newStatus,
        confirmed_at: newStatus === 'confirmed' ? new Date().toISOString() : null,
        metadata: {
          ...payment.metadata,
          actually_paid,
          pay_currency,
          payment_status,
          webhook_received_at: new Date().toISOString(),
        },
      })
      .eq('id', payment.id);

    if (updateError) {
      console.error('Error updating payment:', updateError);
    }

    // Send Telegram notification based on payment status
    if (payment.bolt_users?.telegram_id) {
      const telegramId = payment.bolt_users.telegram_id;
      const productName = payment.product_type?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'Product';
      
      if (newStatus === 'confirmed') {
        const notificationMessage = `✅ <b>Payment Confirmed!</b>

📦 Product: <b>${productName}</b>
💰 Amount: <b>${actually_paid || payment.amount_ton} ${pay_currency || 'TON'}</b>

Thank you for your purchase! 🙏`;

        sendTelegramNotification(telegramId, notificationMessage);
      } else if (newStatus === 'failed') {
        const notificationMessage = `❌ <b>Payment Failed</b>

📦 Product: <b>${productName}</b>

Your payment could not be processed. Please try again or contact support.`;

        sendTelegramNotification(telegramId, notificationMessage);
      }
    }

    // If payment confirmed, credit the user
    if (newStatus === 'confirmed' && payment.product_type === 'ai_credits') {
      const credits = payment.metadata?.credits || 100;
      
      // Add credits to user (implement based on your credit system)
      console.log(`Crediting ${credits} AI credits to user ${payment.user_id}`);
    }

    console.log(`Payment ${payment.id} updated to status: ${newStatus}`);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
