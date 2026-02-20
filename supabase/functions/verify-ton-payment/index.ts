import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-telegram-id",
};

// The ONLY valid TON payment address
const EXPECTED_TON_ADDRESS = 'UQCiVNm22dMF9S3YsHPcgrmqXEQHt4MIdk_N7VJu88NrLr4R';

// Rate limiting per user
const verificationAttempts = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = verificationAttempts.get(userId);
  if (!entry || now > entry.resetTime) {
    verificationAttempts.set(userId, { count: 1, resetTime: now + 60000 });
    return true;
  }
  if (entry.count >= 10) return false;
  entry.count++;
  return true;
}

// Normalize TON address for comparison (handles UQ/EQ prefix differences)
function normalizeAddress(addr: string): string {
  return addr.replace(/^(UQ|EQ)/, '').toLowerCase();
}

// Try to get real TX hash from BOC via TON API
async function getTxHashFromBoc(boc: string): Promise<string | null> {
  try {
    const response = await fetch('https://toncenter.com/api/v2/sendBocReturnHash', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ boc }),
    });
    if (response.ok) {
      const data = await response.json();
      if (data.ok && data.result?.hash) {
        return data.result.hash;
      }
    }
  } catch (e) {
    console.log('Could not get hash from BOC via toncenter:', e);
  }
  return null;
}

// Verify transaction on TON blockchain - strict verification
async function verifyOnBlockchain(params: {
  boc: string;
  expectedAmount: number;
  senderAddress?: string;
  paymentCreatedAt: string;
}): Promise<{ verified: boolean; txHash?: string; actualAmount?: number; senderAddress?: string; reason?: string }> {
  const { boc, expectedAmount, senderAddress, paymentCreatedAt } = params;

  // 1. Try to get real TX hash from BOC
  const realTxHash = await getTxHashFromBoc(boc);
  console.log('Real TX hash from BOC:', realTxHash);

  // 2. Query TON API for recent transactions to our address
  try {
    const tonApiUrl = `https://tonapi.io/v2/blockchain/accounts/${EXPECTED_TON_ADDRESS}/transactions?limit=50`;
    const response = await fetch(tonApiUrl, {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      console.error('TON API returned non-OK:', response.status);
      return { verified: false, reason: 'TON API unavailable' };
    }

    const txData = await response.json();
    const transactions = txData.transactions || [];
    const paymentTimestamp = new Date(paymentCreatedAt).getTime() / 1000;

    for (const tx of transactions) {
      const inValue = tx.in_msg?.value ? Number(tx.in_msg.value) / 1e9 : 0;
      const txTimestamp = tx.utime || 0;
      const timeDiff = Math.abs(txTimestamp - paymentTimestamp);

      // Must be within 15 minutes of payment creation
      if (timeDiff > 900) continue;

      // Amount must match within 0.01 TON tolerance
      if (Math.abs(inValue - expectedAmount) > 0.01) continue;

      // Verify destination is our address
      const txDestination = tx.account?.address || '';
      if (!txDestination.toLowerCase().includes(normalizeAddress(EXPECTED_TON_ADDRESS))) {
        console.log('Destination mismatch:', txDestination);
        continue;
      }

      // If sender address provided, verify it matches
      if (senderAddress) {
        const txSender = tx.in_msg?.source?.address || '';
        if (txSender && !txSender.toLowerCase().includes(normalizeAddress(senderAddress))) {
          console.log('Sender address mismatch:', { expected: senderAddress, actual: txSender });
          continue; // Skip if sender doesn't match
        }
      }

      console.log('Transaction verified on blockchain:', {
        hash: tx.hash,
        amount: inValue,
        timeDiff,
      });

      return {
        verified: true,
        txHash: realTxHash || tx.hash || boc.slice(0, 64),
        actualAmount: inValue,
        senderAddress: tx.in_msg?.source?.address,
      };
    }

    return { verified: false, reason: 'No matching transaction found on blockchain' };
  } catch (e) {
    console.error('Blockchain verification error:', e);
    return { verified: false, reason: 'Verification error: ' + String(e) };
  }
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
    const telegramIdHeader = req.headers.get('x-telegram-id');

    if (!paymentId) {
      return new Response(JSON.stringify({ error: "paymentId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!telegramIdHeader) {
      return new Response(JSON.stringify({ error: "x-telegram-id header is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const telegramId = Number(telegramIdHeader);
    if (!Number.isFinite(telegramId) || telegramId <= 0) {
      return new Response(JSON.stringify({ error: "Invalid x-telegram-id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Rate limiting
    if (!checkRateLimit(telegramIdHeader)) {
      return new Response(JSON.stringify({ error: "Too many verification attempts" }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Verifying payment:", paymentId, "telegramId:", telegramId);

    // Get the payment record
    const { data: payment, error: payErr } = await supabaseClient
      .from("ton_payments")
      .select("*")
      .eq("id", paymentId)
      .single();

    if (payErr || !payment) {
      return new Response(JSON.stringify({ error: "Payment not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // SECURITY: Verify the payment belongs to the requesting Telegram user
    const { data: requester } = await supabaseClient
      .from('bolt_users')
      .select('id')
      .eq('telegram_id', telegramId)
      .maybeSingle();

    if (!requester) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (payment.user_id !== requester.id) {
      console.error('User mismatch on payment verification', {
        paymentUserId: payment.user_id,
        requesterId: requester.id,
      });
      // Alert admin about suspicious attempt
      await supabaseClient.functions.invoke('notify-suspicious-payment', {
        body: {
          paymentId,
          userId: requester.id,
          amount: payment.amount_ton,
          productType: payment.product_type,
          walletAddress,
          reason: 'user_id_mismatch',
        },
      }).catch(() => {});
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

    // SECURITY: Verify destination address
    if (payment.destination_address !== EXPECTED_TON_ADDRESS) {
      console.error('SECURITY ALERT: Payment destination mismatch!');
      return new Response(JSON.stringify({ error: "Invalid payment destination" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!txHash) {
      return new Response(JSON.stringify({ ok: false, status: "pending" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // SECURITY: Check if txHash already used in payment_verifications_log (replay attack prevention)
    const { data: existingVerification } = await supabaseClient
      .from("payment_verifications_log")
      .select("id, payment_id")
      .eq("tx_hash", txHash)
      .maybeSingle();

    if (existingVerification && existingVerification.payment_id !== paymentId) {
      console.error('REPLAY ATTACK: txHash already used for another payment:', txHash);
      await supabaseClient.functions.invoke('notify-suspicious-payment', {
        body: {
          paymentId,
          userId: requester.id,
          amount: payment.amount_ton,
          productType: payment.product_type,
          walletAddress,
          txHash,
          reason: 'replay_attack_tx_reuse',
        },
      }).catch(() => {});
      return new Response(JSON.stringify({ error: "Transaction already used" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // SECURITY: Check existing ton_payments for same txHash
    const { data: existingPaymentWithTx } = await supabaseClient
      .from("ton_payments")
      .select("id")
      .eq("tx_hash", txHash)
      .neq("id", paymentId)
      .maybeSingle();

    if (existingPaymentWithTx) {
      console.error('txHash already used by another payment:', txHash);
      return new Response(JSON.stringify({ error: "Transaction already used" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === STRICT BLOCKCHAIN VERIFICATION ===
    console.log('Starting blockchain verification for payment:', paymentId, 'amount:', payment.amount_ton);
    
    const verificationResult = await verifyOnBlockchain({
      boc: txHash, // txHash here is actually the BOC
      expectedAmount: payment.amount_ton,
      senderAddress: walletAddress || payment.wallet_address,
      paymentCreatedAt: payment.created_at,
    });

    console.log('Blockchain verification result:', verificationResult);

    if (!verificationResult.verified) {
      console.log('Payment NOT verified on blockchain:', verificationResult.reason);
      
      // Log the failed verification attempt
      await supabaseClient.from("payment_verifications_log").insert({
        payment_id: paymentId,
        user_id: requester.id,
        product_type: payment.product_type,
        amount_ton: payment.amount_ton,
        tx_hash: null, // No verified hash
        blockchain_verified: false,
        sender_address: walletAddress,
      }).catch(console.error);

      return new Response(JSON.stringify({
        ok: false,
        status: "pending",
        message: verificationResult.reason || "Transaction not yet confirmed on blockchain",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === PAYMENT VERIFIED ON BLOCKCHAIN ===
    const confirmedTxHash = verificationResult.txHash || txHash;

    // Log to payment_verifications_log (with UNIQUE tx_hash constraint)
    const { error: logError } = await supabaseClient
      .from("payment_verifications_log")
      .insert({
        payment_id: paymentId,
        user_id: requester.id,
        product_type: payment.product_type,
        amount_ton: verificationResult.actualAmount || payment.amount_ton,
        tx_hash: confirmedTxHash,
        blockchain_verified: true,
        sender_address: verificationResult.senderAddress || walletAddress,
        verified_at: new Date().toISOString(),
      });

    if (logError) {
      // If unique constraint violated, means this tx was already used
      if (logError.code === '23505') {
        console.error('DUPLICATE TX: tx_hash already in verifications log:', confirmedTxHash);
        return new Response(JSON.stringify({ error: "Transaction already used" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.error('Error logging verification:', logError);
    }

    // Update ton_payments to confirmed
    const { data: updated, error: updErr } = await supabaseClient
      .from("ton_payments")
      .update({
        status: "confirmed",
        tx_hash: confirmedTxHash,
        confirmed_at: new Date().toISOString(),
        wallet_address: walletAddress,
        metadata: {
          verified_by: "blockchain",
          actual_amount: verificationResult.actualAmount,
          sender_address: verificationResult.senderAddress,
          verified_at: new Date().toISOString(),
        },
      })
      .eq("id", paymentId)
      .eq("status", "pending")
      .select()
      .single();

    if (updErr || !updated) {
      console.error("Failed to update payment:", updErr);
      return new Response(JSON.stringify({ error: "Payment may have already been processed" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark user_servers with payment_verified = true for this payment
    await supabaseClient
      .from("user_servers")
      .update({ payment_verified: true })
      .eq("payment_id", paymentId)
      .catch(console.error);

    // Handle product-specific rewards
    if (payment.product_type === 'ai_credits' && payment.metadata?.credits) {
      const credits = Number(payment.metadata.credits) || 0;
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

    // === REFERRAL COMMISSION: 50% to referrer ===
    try {
      const { data: payingUser } = await supabaseClient
        .from('bolt_users')
        .select('id, referred_by')
        .eq('id', requester.id)
        .single();

      if (payingUser?.referred_by) {
        const commissionAmount = (payment.amount_ton * 50) / 100;
        await supabaseClient.from('referral_commissions').insert({
          referrer_id: payingUser.referred_by,
          referred_id: payingUser.id,
          payment_id: paymentId,
          payment_type: 'ton',
          original_amount: payment.amount_ton,
          commission_amount: commissionAmount,
          commission_percent: 50,
          currency: 'TON',
          status: 'paid',
          paid_at: new Date().toISOString(),
        });

        const { data: referrer } = await supabaseClient
          .from('bolt_users')
          .select('id, ton_balance, total_commission_ton')
          .eq('id', payingUser.referred_by)
          .single();

        if (referrer) {
          await supabaseClient
            .from('bolt_users')
            .update({
              ton_balance: (referrer.ton_balance || 0) + commissionAmount,
              total_commission_ton: (referrer.total_commission_ton || 0) + commissionAmount,
            })
            .eq('id', referrer.id);
        }
      }
    } catch (commissionError) {
      console.error('Error processing referral commission:', commissionError);
    }

    console.log(`Payment ${paymentId} BLOCKCHAIN VERIFIED with txHash: ${confirmedTxHash}`);

    return new Response(JSON.stringify({ ok: true, status: "confirmed", payment: updated }), {
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
