import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('[auto-distribute] Starting hourly server rewards distribution...');

    const now = new Date();
    const MIN_HOURS = 1;

    // Get all active servers with their owners
    const { data: servers, error: serversError } = await supabase
      .from('user_servers')
      .select('*')
      .eq('is_active', true);

    if (serversError) {
      console.error('[auto-distribute] Error fetching servers:', serversError);
      throw serversError;
    }

    if (!servers || servers.length === 0) {
      console.log('[auto-distribute] No active servers found');
      return new Response(
        JSON.stringify({ message: 'No active servers', distributed: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[auto-distribute] Processing ${servers.length} active servers...`);

    // Group servers by user
    const userRewards: Record<string, { bolt: number; usdt: number; ton: number; serverIds: string[] }> = {};

    for (const server of servers) {
      const lastClaim = server.last_claim_at 
        ? new Date(server.last_claim_at) 
        : new Date(server.purchased_at);
      
      const hoursSinceLastClaim = (now.getTime() - lastClaim.getTime()) / (1000 * 60 * 60);
      
      // Only process if at least 1 hour has passed
      if (hoursSinceLastClaim < MIN_HOURS) {
        continue;
      }

      // Calculate hourly reward (no cap for auto-distribution, just the actual hours)
      const boltReward = (server.daily_bolt_yield / 24) * hoursSinceLastClaim;
      const usdtReward = (server.daily_usdt_yield / 24) * hoursSinceLastClaim;
      const tonReward = ((server.daily_ton_yield || 0) / 24) * hoursSinceLastClaim;

      if (!userRewards[server.user_id]) {
        userRewards[server.user_id] = { bolt: 0, usdt: 0, ton: 0, serverIds: [] };
      }

      userRewards[server.user_id].bolt += boltReward;
      userRewards[server.user_id].usdt += usdtReward;
      userRewards[server.user_id].ton += tonReward;
      userRewards[server.user_id].serverIds.push(server.id);
    }

    const usersToUpdate = Object.keys(userRewards);
    console.log(`[auto-distribute] Distributing rewards to ${usersToUpdate.length} users...`);

    let totalBoltDistributed = 0;
    let totalUsdtDistributed = 0;
    let totalTonDistributed = 0;
    let usersUpdated = 0;

    for (const odUser of usersToUpdate) {
      const rewards = userRewards[odUser];
      const boltToAdd = Math.floor(rewards.bolt);
      const usdtToAdd = Math.round(rewards.usdt * 100) / 100;
      const tonToAdd = Math.round(rewards.ton * 10000) / 10000;

      if (boltToAdd <= 0 && usdtToAdd <= 0 && tonToAdd <= 0) {
        continue;
      }

      // Get current balance
      const { data: userData, error: userError } = await supabase
        .from('bolt_users')
        .select('token_balance, usdt_balance, ton_balance')
        .eq('id', odUser)
        .single();

      if (userError) {
        console.error(`[auto-distribute] Error fetching user ${odUser}:`, userError);
        continue;
      }

      // Update user balance
      const { error: updateError } = await supabase
        .from('bolt_users')
        .update({
          token_balance: (userData.token_balance || 0) + boltToAdd,
          usdt_balance: (userData.usdt_balance || 0) + usdtToAdd,
          ton_balance: (userData.ton_balance || 0) + tonToAdd,
          updated_at: now.toISOString(),
        })
        .eq('id', odUser);

      if (updateError) {
        console.error(`[auto-distribute] Error updating user ${odUser}:`, updateError);
        continue;
      }

      // Update last_claim_at for all user's servers
      const { error: serverUpdateError } = await supabase
        .from('user_servers')
        .update({ last_claim_at: now.toISOString() })
        .in('id', rewards.serverIds);

      if (serverUpdateError) {
        console.error(`[auto-distribute] Error updating servers for user ${odUser}:`, serverUpdateError);
      }

      totalBoltDistributed += boltToAdd;
      totalUsdtDistributed += usdtToAdd;
      totalTonDistributed += tonToAdd;
      usersUpdated++;

      console.log(`[auto-distribute] User ${odUser}: +${boltToAdd} BOLT, +${usdtToAdd} USDT, +${tonToAdd} TON`);
    }

    console.log(`[auto-distribute] Complete! Distributed ${totalBoltDistributed} BOLT, ${totalUsdtDistributed} USDT, ${totalTonDistributed} TON to ${usersUpdated} users`);

    return new Response(
      JSON.stringify({
        success: true,
        users_updated: usersUpdated,
        total_bolt_distributed: totalBoltDistributed,
        total_usdt_distributed: totalUsdtDistributed,
        total_ton_distributed: totalTonDistributed,
        servers_processed: servers.length,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[auto-distribute] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
