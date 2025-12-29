import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-telegram-id',
};

interface PaymentRequest {
  amount: number;
  currency: string; // 'BTC', 'ETH', 'USDT', 'TON', etc.
  description: string;
  productType: string;
  productId?: string;
  orderId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('NOWPAYMENTS_API_KEY');
    if (!apiKey) {
      console.error('NOWPAYMENTS_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Payment service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const telegramId = req.headers.get('x-telegram-id');
    if (!telegramId) {
      return new Response(
        JSON.stringify({ error: 'Telegram ID required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { amount, currency, description, productType, productId, orderId }: PaymentRequest = await req.json();

    console.log('Creating NOWPayments invoice:', { amount, currency, productType, orderId });

    // Create payment with NOWPayments
    const nowPaymentsResponse = await fetch('https://api.nowpayments.io/v1/invoice', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        price_amount: amount,
        price_currency: 'USD',
        pay_currency: currency.toLowerCase(),
        order_id: orderId,
        order_description: description,
        ipn_callback_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/nowpayments-webhook`,
        success_url: 'https://t.me/ViralMiningBot',
        cancel_url: 'https://t.me/ViralMiningBot',
      }),
    });

    if (!nowPaymentsResponse.ok) {
      const errorText = await nowPaymentsResponse.text();
      console.error('NOWPayments API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to create payment' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const invoiceData = await nowPaymentsResponse.json();
    console.log('NOWPayments invoice created:', invoiceData);

    // Store payment in database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error: dbError } = await supabase
      .from('ton_payments')
      .insert({
        user_id: telegramId,
        amount_ton: amount,
        description,
        product_type: productType,
        product_id: productId,
        destination_address: 'nowpayments',
        payment_method: 'nowpayments',
        payment_currency: currency,
        nowpayments_id: invoiceData.id?.toString(),
        status: 'pending',
        metadata: {
          invoice_url: invoiceData.invoice_url,
          order_id: orderId,
          nowpayments_data: invoiceData,
        },
      });

    if (dbError) {
      console.error('Database error:', dbError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        invoiceUrl: invoiceData.invoice_url,
        invoiceId: invoiceData.id,
        payAddress: invoiceData.pay_address,
        payAmount: invoiceData.pay_amount,
        payCurrency: invoiceData.pay_currency,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error creating payment:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
