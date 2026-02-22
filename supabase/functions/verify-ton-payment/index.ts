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

// Normalize TON address for comparison
function normalizeAddress(addr: string): string {
  return addr.replace(/^(UQ|EQ)/, '').toLowerCase();
}

// Try to get real TX hash from BOC
async function getTxHashFromBoc(boc: string): Promise<string | null> {
  try {
    const response = await fetch('https://toncenter.com/api/v2/sendBocReturnHash', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ boc }),
    });
    if (response.ok) {
      const data = await response.json();
      if (data.ok && data.result?.hash) return data.result.hash;
    }
  } catch (e) {
    console.log('Could not get hash from BOC:', e);
  }
  return null;
}

// Verify transaction on TON blockchain using comment matching
async function verifyOnBlockchain(params: {
  boc: string;
  expectedAmount: number;
  senderAddress?: string;
  paymentCreatedAt: string;
  paymentComment?: string;
}): Promise<{ verified: boolean; txHash?: string; actualAmount?: number; senderAddress?: string; reason?: string }> {
  const { boc, expectedAmount, senderAddress, paymentCreatedAt, paymentComment } = params;

  // Try to get real TX hash
  const realTxHash = await getTxHashFromBoc(boc);
  console.log('Real TX hash from BOC:', realTxHash);

  try {
    // Query recent transactions to our address
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

      // Must be within 15 minutes
      if (timeDiff > 900) continue;

      // Amount must match within 0.01 TON tolerance
      if (Math.abs(inValue - expectedAmount) > 0.01) continue;

      // If we have a payment comment, try to match it (strongest verification)
      if (paymentComment && tx.in_msg?.decoded_body?.text) {
        const txComment = tx.in_msg.decoded_body.text;
        if (txComment === paymentComment) {
          console.log('COMMENT MATCHED! Strong verification for:', paymentComment);
          return {
            verified: true,
            txHash: realTxHash || tx.hash || boc.slice(0, 64),
            actualAmount: inValue,
            senderAddress: tx.in_msg?.source?.address,
          };
        }
      }

      // Also check raw message body for comment
      if (paymentComment && tx.in_msg?.message) {
        try {
          const msgText = tx.in_msg.message;
          if (msgText.includes(paymentComment)) {
            console.log('COMMENT found in message body:', paymentComment);
            return {
              verified: true,
              txHash: realTxHash || tx.hash || boc.slice(0, 64),
              actualAmount: inValue,
              senderAddress: tx.in_msg?.source?.address,
            };
          }
        } catch {}
      }

      // Fallback: match by sender + amount + time (weaker but still valid)
      if (senderAddress) {
        const txSender = tx.in_msg?.source?.address || '';
        if (txSender && txSender.toLowerCase().includes(normalizeAddress(senderAddress))) {
          console.log('Matched by sender + amount + time');
          return {
            verified: true,
            txHash: realTxHash || tx.hash || boc.slice(0, 64),
            actualAmount: inValue,
            senderAddress: tx.in_msg?.source?.address,
          };
        }
      }
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
    const { paymentId, txHash, walletAddress, paymentComment } = body as {
      paymentId: string;
      txHash?: string;
      walletAddress?: string;
      paymentComment?: string;
    };
    const telegramIdHeader = req.headers.get('x-telegram-id');

    if (!paymentId) {
      return new Response(JSON.stringify({ error: "paymentId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Telegram ID is optional - don't block if missing
    const telegramId = telegramIdHeader ? Number(telegramIdHeader) : null;

    // Rate limiting (use telegramId or paymentId)
    const rateLimitKey = telegramIdHeader || paymentId;
    if (!checkRateLimit(rateLimitKey)) {
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

    // Already confirmed
    if (payment.status === "confirmed") {
      return new Response(JSON.stringify({ ok: true, status: "already_confirmed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify destination address
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

    // Check replay attacks
    const { data: existingPaymentWithTx } = await supabaseClient
      .from("ton_payments")
      .select("id")
      .eq("tx_hash", txHash)
      .neq("id", paymentId)
      .maybeSingle();

    if (existingPaymentWithTx) {
      return new Response(JSON.stringify({ error: "Transaction already used" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check payment_verifications_log for replay
    const { data: existingVerification } = await supabaseClient
      .from("payment_verifications_log")
      .select("id, payment_id")
      .eq("tx_hash", txHash)
      .maybeSingle();

    if (existingVerification && existingVerification.payment_id !== paymentId) {
      return new Response(JSON.stringify({ error: "Transaction already used" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get comment from payment metadata or request body
    const comment = paymentComment || payment.metadata?.payment_comment;

    // === BLOCKCHAIN VERIFICATION ===
    console.log('Starting blockchain verification:', {
      paymentId,
      amount: payment.amount_ton,
      comment,
    });
    
    const verificationResult = await verifyOnBlockchain({
      boc: txHash,
      expectedAmount: payment.amount_ton,
      senderAddress: walletAddress || payment.wallet_address,
      paymentCreatedAt: payment.created_at,
      paymentComment: comment,
    });

    console.log('Verification result:', verificationResult);

    if (!verificationResult.verified) {
      // Log failed attempt
      await supabaseClient.from("payment_verifications_log").insert({
        payment_id: paymentId,
        user_id: payment.user_id,
        product_type: payment.product_type,
        amount_ton: payment.amount_ton,
        tx_hash: null,
        blockchain_verified: false,
        sender_address: walletAddress,
      }).catch(console.error);

      return new Response(JSON.stringify({
        ok: false,
        status: "pending",
        message: verificationResult.reason || "Transaction not yet confirmed",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === PAYMENT VERIFIED ===
    const confirmedTxHash = verificationResult.txHash || txHash;

    // Log verification
    const { error: logError } = await supabaseClient
      .from("payment_verifications_log")
      .insert({
        payment_id: paymentId,
        user_id: payment.user_id,
        product_type: payment.product_type,
        amount_ton: verificationResult.actualAmount || payment.amount_ton,
        tx_hash: confirmedTxHash,
        blockchain_verified: true,
        sender_address: verificationResult.senderAddress || walletAddress,
        verified_at: new Date().toISOString(),
      });

    if (logError?.code === '23505') {
      return new Response(JSON.stringify({ error: "Transaction already used" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update payment to confirmed
    const { data: updated, error: updErr } = await supabaseClient
      .from("ton_payments")
      .update({
        status: "confirmed",
        tx_hash: confirmedTxHash,
        confirmed_at: new Date().toISOString(),
        wallet_address: walletAddress,
        metadata: {
          ...payment.metadata,
          verified_by: "blockchain",
          actual_amount: verificationResult.actualAmount,
          sender_address: verificationResult.senderAddress,
          verified_at: new Date().toISOString(),
          payment_comment: comment,
        },
      })
      .eq("id", paymentId)
      .eq("status", "pending")
      .select()
      .single();

    if (updErr || !updated) {
      return new Response(JSON.stringify({ error: "Payment may have already been processed" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark servers as verified
    await supabaseClient
      .from("user_servers")
      .update({ payment_verified: true })
      .eq("payment_id", paymentId)
      .catch(console.error);

    // Handle AI credits
    if (payment.product_type === 'ai_credits' && payment.metadata?.credits) {
      const credits = Number(payment.metadata.credits) || 0;
      // Find user by telegram_id (stored in user_id field)
      const telegramIdStr = payment.user_id;
      const { data: user } = await supabaseClient
        .from('bolt_users')
        .select('id, token_balance')
        .eq('telegram_id', parseInt(telegramIdStr, 10))
        .maybeSingle();
      if (user) {
        await supabaseClient
          .from('bolt_users')
          .update({ token_balance: (user.token_balance || 0) + credits })
          .eq('id', user.id);
      }
    }

    // Referral commission (50%)
    try {
      const telegramIdStr = payment.user_id;
      const { data: payingUser } = await supabaseClient
        .from('bolt_users')
        .select('id, referred_by')
        .eq('telegram_id', parseInt(telegramIdStr, 10))
        .maybeSingle();

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
      console.error('Commission error:', commissionError);
    }

    console.log(`Payment ${paymentId} VERIFIED with comment: ${comment}, txHash: ${confirmedTxHash}`);

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
