import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: "Session ID is required" }),
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

    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      return new Response(
        JSON.stringify({ error: "Session not found" }),
        { 
          status: 404, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Update order status if payment successful
    if (session.payment_status === "paid") {
      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      try {
        await supabaseClient
          .from("server_orders")
          .update({ 
            status: "paid",
            updated_at: new Date().toISOString(),
            customer_email: session.customer_details?.email || null
          })
          .eq("stripe_session_id", sessionId);
      } catch (dbError) {
        console.log("Database update failed:", dbError);
      }
    }

    return new Response(
      JSON.stringify({
        paymentStatus: session.payment_status,
        customerEmail: session.customer_details?.email,
        success: session.payment_status === "paid",
        metadata: session.metadata
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Payment verification error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to verify payment",
        details: error.message 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});