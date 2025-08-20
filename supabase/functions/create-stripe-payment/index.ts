import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentRequest {
  amount: number;
  currency: string;
  productName: string;
  productDescription: string;
  serverId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { amount, currency = "usd", productName, productDescription, serverId }: PaymentRequest = await req.json();

    // Validate request
    if (!amount || !productName || !serverId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: productName,
              description: productDescription,
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.get("origin")}/server-store?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/server-store?canceled=true`,
      metadata: {
        serverId: serverId,
        productName: productName,
      },
    });

    // Optional: Store order in database
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    try {
      await supabaseClient.from("server_orders").insert({
        stripe_session_id: session.id,
        server_id: serverId,
        product_name: productName,
        amount: amount,
        currency: currency,
        status: "pending",
        created_at: new Date().toISOString(),
      });
    } catch (dbError) {
      console.log("Database insert failed (optional):", dbError);
      // Continue even if DB insert fails
    }

    return new Response(
      JSON.stringify({ 
        sessionId: session.id,
        url: session.url,
        success: true 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Stripe payment creation error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to create payment session",
        details: error.message 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});