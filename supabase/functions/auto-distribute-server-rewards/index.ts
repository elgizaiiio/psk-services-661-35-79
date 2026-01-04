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
    const userRewards: Record<string, { bolt: number; usdt: number; serverIds: string[] }> = {};

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

      if (!userRewards[server.user_id]) {
        userRewards[server.user_id] = { bolt: 0, usdt: 0, serverIds: [] };
      }

      userRewards[server.user_id].bolt += boltReward;
      userRewards[server.user_id].usdt += usdtReward;
      userRewards[server.user_id].serverIds.push(server.id);
    }

    const usersToUpdate = Object.keys(userRewards);
    console.log(`[auto-distribute] Distributing rewards to ${usersToUpdate.length} users...`);

    let totalBoltDistributed = 0;
    let totalUsdtDistributed = 0;
    let usersUpdated = 0;

    for (const userId of usersToUpdate) {
      const rewards = userRewards[userId];
      const boltToAdd = Math.floor(rewards.bolt);
      const usdtToAdd = Math.round(rewards.usdt * 100) / 100;

      if (boltToAdd <= 0 && usdtToAdd <= 0) {
        continue;
      }

      // Get current balance
      const { data: userData, error: userError } = await supabase
        .from('bolt_users')
        .select('token_balance, usdt_balance')
        .eq('id', userId)
        .single();

      if (userError) {
        console.error(`[auto-distribute] Error fetching user ${userId}:`, userError);
        continue;
      }

      // Update user balance
      const { error: updateError } = await supabase
        .from('bolt_users')
        .update({
          token_balance: (userData.token_balance || 0) + boltToAdd,
          usdt_balance: (userData.usdt_balance || 0) + usdtToAdd,
          updated_at: now.toISOString(),
        })
        .eq('id', userId);

      if (updateError) {
        console.error(`[auto-distribute] Error updating user ${userId}:`, updateError);
        continue;
      }

      // Update last_claim_at for all user's servers
      const { error: serverUpdateError } = await supabase
        .from('user_servers')
        .update({ last_claim_at: now.toISOString() })
        .in('id', rewards.serverIds);

      if (serverUpdateError) {
        console.error(`[auto-distribute] Error updating servers for user ${userId}:`, serverUpdateError);
      }

      totalBoltDistributed += boltToAdd;
      totalUsdtDistributed += usdtToAdd;
      usersUpdated++;

      console.log(`[auto-distribute] User ${userId}: +${boltToAdd} BOLT, +${usdtToAdd} USDT`);
    }

    console.log(`[auto-distribute] Complete! Distributed ${totalBoltDistributed} BOLT and ${totalUsdtDistributed} USDT to ${usersUpdated} users`);

    return new Response(
      JSON.stringify({
        success: true,
        users_updated: usersUpdated,
        total_bolt_distributed: totalBoltDistributed,
        total_usdt_distributed: totalUsdtDistributed,
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
