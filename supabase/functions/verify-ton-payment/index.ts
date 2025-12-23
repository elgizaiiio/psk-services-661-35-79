import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.json();
    const { paymentId, txHash, walletAddress } = body as { 
      paymentId: string;
      txHash?: string;
      walletAddress?: string;
    };

    if (!paymentId) {
      return new Response(JSON.stringify({ error: "paymentId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Verifying payment:", paymentId, "txHash:", txHash);

    // Get the payment record
    const { data: payment, error: payErr } = await supabaseClient
      .from("ton_payments")
      .select("*")
      .eq("id", paymentId)
      .single();

    if (payErr || !payment) {
      console.error("Payment not found:", payErr);
      return new Response(JSON.stringify({ error: "Payment not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (payment.status === "confirmed") {
      return new Response(JSON.stringify({ ok: true, status: "already_confirmed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // With TON Connect, the transaction is already confirmed when we receive the txHash
    // The frontend sends the txHash after successful wallet transaction
    if (txHash) {
      const { data: updated, error: updErr } = await supabaseClient
        .from("ton_payments")
        .update({
          status: "confirmed",
          tx_hash: txHash,
          confirmed_at: new Date().toISOString(),
          wallet_address: walletAddress,
          metadata: { 
            verified_by: "ton_connect", 
            wallet_address: walletAddress 
          }
        })
        .eq("id", paymentId)
        .select()
        .single();

      if (updErr) {
        console.error("Failed to update payment:", updErr);
        throw updErr;
      }

      // Also update any linked server purchase to paid
      await supabaseClient
        .from("server_purchases")
        .update({ status: "paid" })
        .eq("payment_id", paymentId);

      // Update user token balance if applicable
      if (payment.product_type === 'ai_credits' && payment.metadata?.credits) {
        const userId = payment.user_id;
        const credits = payment.metadata.credits;
        
        const { data: user } = await supabaseClient
          .from('bolt_users')
          .select('token_balance')
          .eq('id', userId)
          .single();
        
        if (user) {
          await supabaseClient
            .from('bolt_users')
            .update({ token_balance: (user.token_balance || 0) + credits })
            .eq('id', userId);
        }
      }

      console.log(`Payment ${paymentId} confirmed with txHash: ${txHash}`);

      return new Response(JSON.stringify({ ok: true, status: "confirmed", payment: updated }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // No txHash provided - payment not yet confirmed
    return new Response(JSON.stringify({ ok: false, status: "pending" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e: any) {
    console.error("verify-ton-payment error:", e);
    return new Response(JSON.stringify({ error: e.message || "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
