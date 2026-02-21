import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const STARS_BOT_TOKEN = Deno.env.get('STARS_BOT_TOKEN');

function getSupabaseClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
}

async function sendTelegramMessage(chatId: number, text: string) {
  const url = `https://api.telegram.org/bot${STARS_BOT_TOKEN}/sendMessage`;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  });
}

async function answerPreCheckoutQuery(preCheckoutQueryId: string, ok: boolean, errorMessage?: string) {
  const url = `https://api.telegram.org/bot${STARS_BOT_TOKEN}/answerPreCheckoutQuery`;
  const body: Record<string, unknown> = {
    pre_checkout_query_id: preCheckoutQueryId,
    ok,
  };
  if (!ok && errorMessage) {
    body.error_message = errorMessage;
  }
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const update = await req.json();
    console.log('Stars webhook update:', JSON.stringify(update));

    // Handle /start command
    if (update.message?.text === '/start') {
      const chatId = update.message.chat.id;
      await sendTelegramMessage(chatId,
        `⭐ <b>Bolt Stars Payment Bot</b>\n\n` +
        `This bot is used exclusively for receiving Telegram Stars payments.\n\n` +
        `💡 To make a purchase with Stars, use the app and select "Pay with Stars" option.\n\n` +
        `🔗 <a href="https://t.me/Boltminingbot/App">Open Bolt App</a>`
      );
      return new Response('OK', { headers: corsHeaders });
    }

    // Handle pre_checkout_query - approve all valid payments
    if (update.pre_checkout_query) {
      const query = update.pre_checkout_query;
      console.log('Pre-checkout query:', JSON.stringify(query));
      
      // Always approve - payment validation happens on successful_payment
      await answerPreCheckoutQuery(query.id, true);
      return new Response('OK', { headers: corsHeaders });
    }

    // Handle successful_payment
    if (update.message?.successful_payment) {
      const payment = update.message.successful_payment;
      const telegramId = update.message.from.id;
      const supabase = getSupabaseClient();

      console.log('Successful Stars payment:', JSON.stringify(payment));

      // payload is now just the paymentId string (not JSON)
      const paymentId = payment.invoice_payload;

      if (!paymentId) {
        console.error('Missing paymentId in payload');
        return new Response('OK', { headers: corsHeaders });
      }

      // Fetch the payment record to get userId, productType, etc.
      const { data: paymentRecord, error: fetchError } = await supabase
        .from('stars_payments')
        .select('*')
        .eq('id', paymentId)
        .single();

      if (fetchError || !paymentRecord) {
        console.error('Payment record not found:', paymentId, fetchError);
        return new Response('OK', { headers: corsHeaders });
      }

      const userId = paymentRecord.user_id;
      const productType = paymentRecord.product_type;
      const description = paymentRecord.product_id;

      // Update stars_payments record
      await supabase
        .from('stars_payments')
        .update({
          status: 'completed',
          telegram_payment_id: payment.telegram_payment_charge_id,
        })
        .eq('id', paymentId);

      // Get bolt user
      const { data: boltUser } = await supabase
        .from('bolt_users')
        .select('id, token_balance, usdt_balance, ton_balance, eth_balance, viral_balance')
        .eq('id', userId)
        .single();

      if (!boltUser) {
        console.error('User not found:', userId);
        return new Response('OK', { headers: corsHeaders });
      }

      // Handle product-specific logic based on productType
      if (productType === 'spin_tickets') {
        // Extract tickets from description or calculate from amountTon
        const ticketsMatch = description?.match(/(\d+)\s*ticket/i);
        const tickets = ticketsMatch ? parseInt(ticketsMatch[1]) : 3;
        const isProTicket = description?.toLowerCase().includes('pro');

        const ticketColumn = isProTicket ? 'pro_tickets_count' : 'tickets_count';
        
        const { data: existing } = await supabase
          .from('user_spin_tickets')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (existing) {
          await supabase
            .from('user_spin_tickets')
            .update({ [ticketColumn]: (existing[ticketColumn] || 0) + tickets })
            .eq('user_id', userId);
        } else {
          await supabase
            .from('user_spin_tickets')
            .upsert({ user_id: userId, [ticketColumn]: tickets }, { onConflict: 'user_id' });
        }

        // Record in spin_history with payment_id for withdrawal verification
        await supabase.from('spin_history').insert({
          user_id: userId,
          reward_type: 'stars_purchase',
          reward_amount: 0,
          wheel_type: isProTicket ? 'pro' : 'normal',
          payment_id: paymentId,
        });
      } else if (productType === 'server_hosting') {
        // Server purchase via stars - mark as verified
        // Find the latest unverified server for this user
        await supabase
          .from('user_servers')
          .update({ payment_verified: true })
          .eq('user_id', userId)
          .eq('payment_verified', false)
          .order('purchased_at', { ascending: false })
          .limit(1);
      }

      // Notify admin
      try {
        const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
        const adminIds = [6657246146, 6090594286];
        const msg = `⭐ <b>Stars Payment Received!</b>\n\n` +
          `👤 User: ${telegramId}\n` +
          `💰 Amount: ${payment.total_amount} Stars\n` +
          `📦 Product: ${productType}\n` +
          `📝 ${description || 'N/A'}`;
        
        for (const adminId of adminIds) {
          await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: adminId, text: msg, parse_mode: 'HTML' }),
          }).catch(() => {});
        }
      } catch {}

      // Confirm to user
      await sendTelegramMessage(telegramId,
        `✅ <b>Payment Successful!</b>\n\n` +
        `⭐ ${payment.total_amount} Stars\n` +
        `📦 ${description || productType}\n\n` +
        `Thank you for your purchase! 🎉`
      );

      return new Response('OK', { headers: corsHeaders });
    }

    return new Response('OK', { headers: corsHeaders });
  } catch (error) {
    console.error('Stars webhook error:', error);
    return new Response('OK', { headers: corsHeaders });
  }
});
