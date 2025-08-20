
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.1";

const SUPABASE_URL = "https://gzzwjopalvopvgofepvj.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6endqb3BhbHZvcHZnb2ZlcHZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MzQ2NTAsImV4cCI6MjA3MDUxMDY1MH0.tU-a1FG6FOB8WdcXWcl2ZYV8eb4x8-1_mcLkcvbYtOs";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TONCENTER_API_KEY = Deno.env.get("TONCENTER_API_KEY") || "";

async function checkPaymentOnToncenter(destination: string, minAmountNano: number, since: string) {
  // Fetch last 50 transactions to destination address from toncenter
  // NOTE: Requires TONCENTER_API_KEY to be set in Supabase secrets
  const url = `https://toncenter.com/api/v2/getTransactions?address=${destination}&limit=50`;
  const res = await fetch(url, {
    headers: TONCENTER_API_KEY ? { "X-API-Key": TONCENTER_API_KEY } : {}
  });
  if (!res.ok) {
    console.error("Toncenter error:", await res.text());
    throw new Error("Failed to query Toncenter");
  }
  const data = await res.json();
  const txs = data?.result || [];
  console.log("Fetched transactions:", txs.length);

  const sinceTs = new Date(since).getTime() / 1000;
  // Try to find any tx with at least minAmountNano after 'since'
  for (const tx of txs) {
    const utime = tx.utime || tx.now || 0;
    if (utime < sinceTs) continue;

    const inMsg = tx.in_msg || tx.inMsg;
    if (!inMsg) continue;

    const value = Number(inMsg.value || 0);
    const dest = inMsg.destination || inMsg.dest || "";
    if (!dest) continue;

    if (dest === destination && value >= minAmountNano) {
      // Found a matching transaction
      return {
        txHash: tx.transaction_id?.hash || tx.transaction_id?.lt || tx.hash || null,
        amount: value
      };
    }
  }
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { paymentId } = body as { paymentId: string };

    if (!paymentId) {
      return new Response(JSON.stringify({ error: "paymentId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Verifying payment:", paymentId);

    const { data: payment, error: payErr } = await supabase
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

    const destinationAddress = payment.destination_address as string;
    const amountTon = Number(payment.amount_ton);
    const minAmountNano = Math.floor(amountTon * 1e9);

    const since = payment.created_at as string;

    const match = await checkPaymentOnToncenter(destinationAddress, minAmountNano, since);

    if (match) {
      const { data: updated, error: updErr } = await supabase
        .from("ton_payments")
        .update({
          status: "confirmed",
          tx_hash: match.txHash,
          confirmed_at: new Date().toISOString(),
          metadata: { verified_by: "toncenter", amount: match.amount }
        })
        .eq("id", paymentId)
        .select()
        .single();

      if (updErr) {
        console.error("Failed to update payment:", updErr);
        throw updErr;
      }

      // Also update any linked server purchase to paid
      await supabase
        .from("server_purchases")
        .update({
          status: "paid"
        })
        .eq("payment_id", paymentId);

      return new Response(JSON.stringify({ ok: true, status: "confirmed", payment: updated }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: false, status: "not_found" }), {
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
