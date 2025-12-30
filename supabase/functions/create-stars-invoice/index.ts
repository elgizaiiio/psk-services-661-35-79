import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, description, payload, amount } = await req.json();
    
    console.log('Received request:', { title, description, payload, amount });

    if (!title || !payload || !amount) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Payload must be a simple string (1-128 bytes) for Telegram
    // Use base64 encoding to ensure valid payload
    const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const safePayload = btoa(payloadString).slice(0, 128);

    console.log('Creating invoice with payload:', safePayload);

    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/createInvoiceLink`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: String(title).slice(0, 32),
        description: String(description || title).slice(0, 255),
        payload: safePayload,
        currency: 'XTR',
        prices: [{ label: String(title).slice(0, 32), amount: Number(amount) }],
      }),
    });

    const result = await response.json();
    console.log('Telegram API response:', JSON.stringify(result));

    if (!result.ok) {
      console.error('Telegram API error:', result);
      throw new Error(result.description || 'Failed to create invoice');
    }

    return new Response(
      JSON.stringify({ invoice_link: result.result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error creating Stars invoice:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
