import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-telegram-id",
};

// In-memory deduplication for txHash (prevents double-spending)
const processedTxHashes = new Set<string>();

// Rate limiting per user
const verificationAttempts = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = verificationAttempts.get(userId);
  
  if (!entry || now > entry.resetTime) {
    verificationAttempts.set(userId, { count: 1, resetTime: now + 60000 }); // 1 minute window
    return true;
  }
  
  if (entry.count >= 10) { // Max 10 verification attempts per minute
    return false;
  }
  
  entry.count++;
  return true;
}

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
    const telegramId = req.headers.get('x-telegram-id');

    if (!paymentId) {
      return new Response(JSON.stringify({ error: "paymentId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Rate limiting
    if (telegramId && !checkRateLimit(telegramId)) {
      return new Response(JSON.stringify({ error: "Too many verification attempts" }), {
        status: 429,
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

    // SECURITY: Verify the payment belongs to the requesting user
    if (telegramId && payment.user_id !== telegramId) {
      console.error('User mismatch on payment verification');
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (payment.status === "confirmed") {
      return new Response(JSON.stringify({ ok: true, status: "already_confirmed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (txHash) {
      // SECURITY: Check for duplicate txHash (prevents replay attacks)
      if (processedTxHashes.has(txHash)) {
        console.error('Duplicate txHash detected:', txHash);
        return new Response(JSON.stringify({ error: "Transaction already processed" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check if txHash is already used in database
      const { data: existingTx } = await supabaseClient
        .from("ton_payments")
        .select("id")
        .eq("tx_hash", txHash)
        .neq("id", paymentId)
        .single();

      if (existingTx) {
        console.error('txHash already used by another payment:', txHash);
        return new Response(JSON.stringify({ error: "Transaction already used" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Validate txHash format (TON transaction hashes are 64 hex characters)
      if (!/^[a-fA-F0-9]{64}$/.test(txHash)) {
        console.error('Invalid txHash format:', txHash);
        return new Response(JSON.stringify({ error: "Invalid transaction hash format" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // TODO: For production, verify the transaction on-chain using TON API
      // const tonApiKey = Deno.env.get('TON_API_KEY');
      // if (tonApiKey) {
      //   const txVerified = await verifyTonTransaction(txHash, payment.destination_address, payment.amount_ton, tonApiKey);
      //   if (!txVerified) {
      //     return new Response(JSON.stringify({ error: "Transaction verification failed" }), {
      //       status: 400,
      //       headers: { ...corsHeaders, "Content-Type": "application/json" },
      //     });
      //   }
      // }

      // Mark txHash as processed
      processedTxHashes.add(txHash);

      const { data: updated, error: updErr } = await supabaseClient
        .from("ton_payments")
        .update({
          status: "confirmed",
          tx_hash: txHash,
          confirmed_at: new Date().toISOString(),
          wallet_address: walletAddress,
          metadata: { 
            verified_by: "ton_connect", 
            wallet_address: walletAddress,
            verified_at: new Date().toISOString()
          }
        })
        .eq("id", paymentId)
        .eq("status", "pending") // Only update if still pending
        .select()
        .single();

      if (updErr || !updated) {
        processedTxHashes.delete(txHash); // Rollback
        console.error("Failed to update payment:", updErr);
        return new Response(JSON.stringify({ error: "Payment may have already been processed" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Update linked server purchase
      await supabaseClient
        .from("server_purchases")
        .update({ status: "paid", activated_at: new Date().toISOString() })
        .eq("payment_id", paymentId);

      // Handle product-specific rewards
      if (payment.product_type === 'ai_credits' && payment.metadata?.credits) {
        const credits = Number(payment.metadata.credits) || 0;
        
        // Get user by telegram_id (user_id in ton_payments is telegram_id string)
        const { data: user } = await supabaseClient
          .from('bolt_users')
          .select('id, token_balance')
          .eq('telegram_id', parseInt(payment.user_id, 10))
          .single();
        
        if (user) {
          await supabaseClient
            .from('bolt_users')
            .update({ token_balance: (user.token_balance || 0) + credits })
            .eq('id', user.id);
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

  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : "Unknown error";
    console.error("verify-ton-payment error:", e);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
