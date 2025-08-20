import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function getOrCreatePlayer(payload: any) {
  const { telegram_id, username, user_id } = payload || {};

  // Try to find existing by telegram_id first, then user_id
  let player = null as any;

  if (telegram_id) {
    const { data } = await supabase
      .from("game_players")
      .select("*")
      .eq("telegram_id", telegram_id)
      .maybeSingle();
    player = data;
  }

  if (!player && user_id) {
    const { data } = await supabase
      .from("game_players")
      .select("*")
      .eq("user_id", user_id)
      .maybeSingle();
    player = data;
  }

  if (!player) {
    const insertPayload: any = {
      telegram_id: telegram_id || null,
      username: username || null,
      user_id: user_id || null,
    };
    const { data, error } = await supabase
      .from("game_players")
      .insert(insertPayload)
      .select("*")
      .single();
    if (error) throw error;
    player = data;
  }

  // Refill energy based on last_energy_at and rate
  player = await refillEnergyIfNeeded(player);

  return player;
}

async function refillEnergyIfNeeded(player: any) {
  const now = new Date();
  const last = new Date(player.last_energy_at);
  const minutes = player.energy_refill_rate_minutes || 10;
  const maxEnergy = player.max_energy || 5;

  if (player.energy >= maxEnergy) return player; // nothing to do

  const diffMs = now.getTime() - last.getTime();
  const refillUnits = Math.floor(diffMs / (minutes * 60 * 1000));
  if (refillUnits <= 0) return player;

  const newEnergy = Math.min(maxEnergy, player.energy + refillUnits);
  const nextLast = new Date(last.getTime() + refillUnits * minutes * 60 * 1000);

  const { data, error } = await supabase
    .from("game_players")
    .update({ energy: newEnergy, last_energy_at: nextLast.toISOString() })
    .eq("id", player.id)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

async function submitScore(player_id: string, score: number) {
  const { error } = await supabase.from("game_scores").insert({ player_id, score });
  if (error) throw error;
}

async function spendEnergy(player: any) {
  if (player.energy <= 0) {
    const err = new Error("Not enough energy");
    // @ts-ignore
    err.status = 400;
    throw err;
  }
  const { data, error } = await supabase
    .from("game_players")
    .update({ energy: player.energy - 1 })
    .eq("id", player.id)
    .select("*")
    .single();
  if (error) throw error;

  // log purchase as energy_spend (free)
  await supabase.from("game_purchases").insert({
    player_id: player.id,
    item_type: "energy_spend",
    amount_ton: 0,
    status: "completed",
  });
  return data;
}

async function claimDaily(player: any) {
  // Has claimed today?
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const { data: existing } = await supabase
    .from("game_daily_rewards")
    .select("*")
    .eq("player_id", player.id)
    .eq("date", todayStr)
    .maybeSingle();
  if (existing) {
    return { player, alreadyClaimed: true };
  }

  // Find yesterday claim to continue streak
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const yStr = yesterday.toISOString().slice(0, 10);
  const { data: yClaim } = await supabase
    .from("game_daily_rewards")
    .select("*")
    .eq("player_id", player.id)
    .eq("date", yStr)
    .maybeSingle();

  let streak = 1;
  if (yClaim && yClaim.streak_count) streak = yClaim.streak_count + 1;
  if (streak > 7) streak = 1;

  const rewardCoins = streak; // simple: 1..7 coins

  // Update player coins
  const { data: updatedPlayer, error: updErr } = await supabase
    .from("game_players")
    .update({ coins: (Number(player.coins) || 0) + rewardCoins })
    .eq("id", player.id)
    .select("*")
    .single();
  if (updErr) throw updErr;

  // Record reward
  await supabase.from("game_daily_rewards").insert({
    player_id: player.id,
    day_index: streak,
    streak_count: streak,
    reward_type: "coins",
    reward_amount: rewardCoins,
  });

  return { player: updatedPlayer, streak, rewardCoins };
}

async function purchaseItem(player: any, body: any) {
  const { item_type, item_key, amount_ton = 0, tx_hash } = body;

  // TODO: Verify TON tx_hash if TONCENTER_API_KEY and RECEIVER are configured
  // For MVP, accept purchase and grant benefits
  const metadata: any = { item_key, tx_hash };

  if (item_type === "energy") {
    // instant refill to max
    const { data, error } = await supabase
      .from("game_players")
      .update({ energy: player.max_energy, last_energy_at: new Date().toISOString() })
      .eq("id", player.id)
      .select("*")
      .single();
    if (error) throw error;
    await supabase.from("game_purchases").insert({
      player_id: player.id,
      item_type,
      item_key: item_key || "refill",
      amount_ton,
      status: "completed",
      metadata,
    });
    return data;
  }

  if (item_type === "booster") {
    // boosters are client-interpreted; just record purchase and add coins as placeholder
    const { data, error } = await supabase
      .from("game_players")
      .update({ coins: (Number(player.coins) || 0) + 0 })
      .eq("id", player.id)
      .select("*")
      .single();
    if (error) throw error;
    await supabase.from("game_purchases").insert({
      player_id: player.id,
      item_type,
      item_key: item_key || "undo",
      amount_ton,
      status: "completed",
      metadata,
    });
    return data;
  }

  if (item_type === "skin") {
    // Check skin exists and active
    const { data: skin } = await supabase
      .from("game_skins")
      .select("*")
      .eq("skin_key", item_key)
      .eq("is_active", true)
      .maybeSingle();
    if (!skin) {
      const err = new Error("Skin not found");
      // @ts-ignore
      err.status = 404;
      throw err;
    }

    const { data, error } = await supabase
      .from("game_players")
      .update({ current_skin: item_key })
      .eq("id", player.id)
      .select("*")
      .single();
    if (error) throw error;

    await supabase.from("game_purchases").insert({
      player_id: player.id,
      item_type,
      item_key,
      amount_ton: amount_ton || skin.price_ton || 0,
      status: "completed",
      metadata,
    });
    return data;
  }

  if (item_type === "streak_restore") {
    // No-op: simply record purchase; client can allow restore
    await supabase.from("game_purchases").insert({
      player_id: player.id,
      item_type,
      item_key: item_key || "daily",
      amount_ton,
      status: "completed",
      metadata,
    });
    return player;
  }

  // default: record
  await supabase.from("game_purchases").insert({
    player_id: player.id,
    item_type,
    item_key: item_key || "generic",
    amount_ton,
    status: "completed",
    metadata,
  });
  return player;
}

async function ensureDefaultSkins() {
  const { data, error } = await supabase
    .from("game_skins")
    .select("count")
    .limit(1);
  if (error) return;
  // @ts-ignore
  const hasAny = Array.isArray(data) ? data.length > 0 : true;
  if (!hasAny) {
    await supabase.from("game_skins").insert([
      { skin_key: "classic", name: "Classic", price_ton: 0, is_active: true },
      { skin_key: "neon", name: "Neon", price_ton: 0.05, is_active: true },
      { skin_key: "gold", name: "Gold", price_ton: 0.1, is_active: true },
    ]);
  }
}

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, payload } = body || {};

    await ensureDefaultSkins();

    if (!action) {
      return new Response(JSON.stringify({ error: "Missing action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get or create player
    const player = await getOrCreatePlayer(payload || {});

    if (action === "get_player") {
      // leaderboard (top 50 this week)
      const { data: leaderboard } = await supabase
        .from("game_scores")
        .select("score, created_at, player:player_id(username, telegram_id)")
        .eq("week_start", new Date(Date.now() - (new Date().getDay()) * 24 * 60 * 60 * 1000).toISOString().slice(0,10))
        .order("score", { ascending: false })
        .limit(50);

      const { data: skins } = await supabase
        .from("game_skins")
        .select("*")
        .eq("is_active", true);

      return new Response(
        JSON.stringify({ player, leaderboard: leaderboard || [], skins: skins || [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "spend_energy") {
      const updated = await spendEnergy(player);
      return new Response(JSON.stringify({ player: updated }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "submit_score") {
      const { score } = payload || {};
      if (typeof score !== "number" || score < 0) {
        return new Response(JSON.stringify({ error: "Invalid score" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      await submitScore(player.id, score);
      
      // Give 10 viral coins for every 1000 score points
      const coinsToAdd = Math.floor(score / 1000) * 10;
      if (coinsToAdd > 0) {
        const { data: updatedPlayer, error: updateError } = await supabase
          .from("game_players")
          .update({ coins: (Number(player.coins) || 0) + coinsToAdd })
          .eq("id", player.id)
          .select("*")
          .single();
        if (updateError) throw updateError;
        
        return new Response(JSON.stringify({ 
          ok: true, 
          coinsEarned: coinsToAdd,
          player: updatedPlayer 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ ok: true, coinsEarned: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "claim_daily") {
      const result = await claimDaily(player);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "purchase") {
      const updated = await purchaseItem(player, payload || {});
      return new Response(JSON.stringify({ player: updated }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "leaderboard") {
      const { data: leaderboard } = await supabase
        .from("game_scores")
        .select("score, created_at, player:player_id(username, telegram_id)")
        .order("score", { ascending: false })
        .limit(50);
      return new Response(JSON.stringify({ leaderboard: leaderboard || [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "list_skins") {
      const { data: skins } = await supabase
        .from("game_skins")
        .select("*")
        .eq("is_active", true);
      return new Response(JSON.stringify({ skins: skins || [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("game-api error", e);
    const status = (e as any)?.status || 500;
    return new Response(JSON.stringify({ error: (e as any)?.message || "Server error" }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
