import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-telegram-id',
};

const STARS_BOT_TOKEN = Deno.env.get('STARS_BOT_TOKEN');

// 100 Stars = 1 TON
const STARS_PER_TON = 100;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { amountTon, description, productType, productId, userId, telegramId } = await req.json();

    if (!amountTon || !description || !productType || !userId || !telegramId) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calculate stars amount: 100 stars = 1 TON
    const starsAmount = Math.ceil(amountTon * STARS_PER_TON);

    // Create a record in stars_payments
    const { data: paymentRecord, error: insertError } = await supabase
      .from('stars_payments')
      .insert({
        user_id: userId,
        telegram_id: telegramId,
        amount_stars: starsAmount,
        amount_usd: amountTon, // Store TON amount for reference
        product_type: productType,
        product_id: productId || null,
        status: 'pending',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating payment record:', insertError);
      return new Response(JSON.stringify({ error: 'Failed to create payment' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create invoice link using Telegram Bot API
    const payload = JSON.stringify({
      paymentId: paymentRecord.id,
      userId,
      productType,
      amountTon,
      description,
    });

    const invoiceResponse = await fetch(`https://api.telegram.org/bot${STARS_BOT_TOKEN}/createInvoiceLink`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: description,
        description: `${description} - ${starsAmount} ⭐`,
        payload,
        currency: 'XTR', // Telegram Stars currency code
        prices: [{ label: description, amount: starsAmount }],
      }),
    });

    const invoiceData = await invoiceResponse.json();
    console.log('Invoice response:', JSON.stringify(invoiceData));

    if (!invoiceData.ok) {
      console.error('Failed to create invoice:', invoiceData);
      return new Response(JSON.stringify({ error: 'Failed to create invoice' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      invoiceUrl: invoiceData.result,
      paymentId: paymentRecord.id,
      starsAmount,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Create stars invoice error:', error);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
