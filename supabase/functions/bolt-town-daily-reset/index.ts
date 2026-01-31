import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
const ADMIN_TELEGRAM_ID = 6657246146;
const PRIZE_USDT = 2.5;

async function sendTelegramMessage(chatId: number, text: string, parseMode = "HTML") {
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: parseMode,
        }),
      }
    );
    return response.ok;
  } catch (error) {
    console.error("Error sending Telegram message:", error);
    return false;
  }
}

async function broadcastToAllUsers(
  supabase: any,
  message: string,
  excludeBlocked = true
) {
  const BATCH_SIZE = 500;
  const DELAY_MS = 25;
  let sent = 0;
  let failed = 0;
  let offset = 0;

  while (true) {
    let query = supabase
      .from("bolt_users")
      .select("telegram_id")
      .range(offset, offset + BATCH_SIZE - 1);

    if (excludeBlocked) {
      query = query.or("bot_blocked.is.null,bot_blocked.eq.false");
    }

    const { data: users, error } = await query;

    if (error || !users || users.length === 0) break;

    for (const user of users) {
      if (user.telegram_id) {
        const success = await sendTelegramMessage(user.telegram_id, message);
        if (success) sent++;
        else failed++;

        await new Promise((r) => setTimeout(r, DELAY_MS));
      }
    }

    offset += BATCH_SIZE;
    if (users.length < BATCH_SIZE) break;
  }

  return { sent, failed };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get yesterday's date (since this runs at midnight UTC)
    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    const today = new Date().toISOString().split("T")[0];

    console.log(`Processing Bolt Town daily reset for ${yesterdayStr}`);

    // 1. Find the winner (highest points for yesterday)
    const { data: topPlayer, error: topError } = await supabase
      .from("bolt_town_daily_points")
      .select("user_id, total_points")
      .eq("date", yesterdayStr)
      .order("total_points", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (topError) {
      console.error("Error finding winner:", topError);
      throw topError;
    }

    if (!topPlayer || topPlayer.total_points === 0) {
      console.log("No participants with points yesterday, skipping winner selection");
      
      // Still broadcast that new competition started
      const newRoundMessage = `
⚡ <b>Bolt Town Daily Competition</b>

🎯 New round starts NOW!
💵 Today's prize: <b>2.5 USDT</b>

Complete tasks, invite friends & watch ads to win!

Tap to join! 👇
/start
      `.trim();

      const broadcastResult = await broadcastToAllUsers(supabase, newRoundMessage);
      console.log(`Broadcast result: sent=${broadcastResult.sent}, failed=${broadcastResult.failed}`);

      return new Response(
        JSON.stringify({ success: true, message: "No winner today, new round started" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Get winner's full details
    const { data: winnerUser, error: userError } = await supabase
      .from("bolt_users")
      .select("id, telegram_id, telegram_username, first_name, usdt_balance")
      .eq("id", topPlayer.user_id)
      .single();

    if (userError || !winnerUser) {
      console.error("Error getting winner details:", userError);
      throw userError || new Error("Winner not found");
    }

    // 3. Get winner's wallet address (if they have one connected)
    // We'll try to get it from their most recent ton payment or withdrawal
    const { data: walletData } = await supabase
      .from("ton_payments")
      .select("wallet_address")
      .eq("user_id", winnerUser.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const walletAddress = walletData?.wallet_address || "Not connected";

    // 4. Add prize to winner's USDT balance
    const newBalance = (Number(winnerUser.usdt_balance) || 0) + PRIZE_USDT;
    const { error: updateError } = await supabase
      .from("bolt_users")
      .update({
        usdt_balance: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq("id", winnerUser.id);

    if (updateError) {
      console.error("Error updating winner balance:", updateError);
      throw updateError;
    }

    // 5. Save winner to history
    const { error: winnerError } = await supabase
      .from("bolt_town_daily_winners")
      .insert({
        user_id: winnerUser.id,
        telegram_id: winnerUser.telegram_id,
        telegram_username: winnerUser.telegram_username,
        wallet_address: walletAddress,
        date: yesterdayStr,
        total_points: topPlayer.total_points,
        prize_usdt: PRIZE_USDT,
      });

    if (winnerError) {
      console.error("Error saving winner:", winnerError);
      // Don't throw - prize already added to balance
    }

    // 6. Send admin notification (with wallet details)
    const adminMessage = `
🔔 <b>Bolt Town Daily Winner</b>

👤 @${winnerUser.telegram_username || winnerUser.first_name || "Anonymous"}
🆔 Telegram ID: <code>${winnerUser.telegram_id}</code>
📊 Points: <b>${topPlayer.total_points}</b>
💰 Prize: <b>${PRIZE_USDT} USDT</b>
📬 Wallet: <code>${walletAddress}</code>
📅 Date: ${yesterdayStr}

✅ Auto-credited to balance
    `.trim();

    await sendTelegramMessage(ADMIN_TELEGRAM_ID, adminMessage);

    // Update admin_notified flag
    await supabase
      .from("bolt_town_daily_winners")
      .update({ admin_notified: true })
      .eq("date", yesterdayStr);

    // 7. Broadcast to all users
    const winnerName = winnerUser.telegram_username
      ? `@${winnerUser.telegram_username}`
      : winnerUser.first_name || "a lucky player";

    const publicMessage = `
🏆 <b>Bolt Town Daily Winner!</b>

🎉 Congrats ${winnerName}!
💰 Won: <b>2.5 USDT</b>
📊 Points: ${topPlayer.total_points}

⚡ <b>New competition starts NOW!</b>
🎯 Complete tasks, invite friends & watch ads
💵 Today's prize: <b>2.5 USDT</b>

Tap to join! 👇
/start
    `.trim();

    const broadcastResult = await broadcastToAllUsers(supabase, publicMessage);
    console.log(`Broadcast result: sent=${broadcastResult.sent}, failed=${broadcastResult.failed}`);

    // Update all_users_notified flag
    await supabase
      .from("bolt_town_daily_winners")
      .update({ all_users_notified: true })
      .eq("date", yesterdayStr);

    return new Response(
      JSON.stringify({
        success: true,
        winner: {
          telegram_id: winnerUser.telegram_id,
          username: winnerUser.telegram_username,
          points: topPlayer.total_points,
          prize: PRIZE_USDT,
        },
        broadcast: broadcastResult,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in bolt-town-daily-reset:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
