import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-telegram-id',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user ID from request
    const { user_id } = await req.json();
    
    if (!user_id) {
      console.error('[claim-server-rewards] No user_id provided');
      return new Response(
        JSON.stringify({ error: 'User ID required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[claim-server-rewards] Processing claim for user: ${user_id}`);

    // Get all active servers for user
    const { data: servers, error: serversError } = await supabase
      .from('user_servers')
      .select('*')
      .eq('user_id', user_id)
      .eq('is_active', true);

    if (serversError) {
      console.error('[claim-server-rewards] Error fetching servers:', serversError);
      throw serversError;
    }

    if (!servers || servers.length === 0) {
      console.log('[claim-server-rewards] No active servers found');
      return new Response(
        JSON.stringify({ error: 'No active servers', claimed_bolt: 0, claimed_usdt: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const now = new Date();
    let totalBoltClaimed = 0;
    let totalUsdtClaimed = 0;
    const MIN_HOURS = 1; // Minimum 1 hour between claims
    const MAX_HOURS = 24; // Maximum accumulation of 24 hours

    for (const server of servers) {
      // Use last_claim_at or purchased_at as baseline
      const lastClaim = server.last_claim_at 
        ? new Date(server.last_claim_at) 
        : new Date(server.purchased_at);
      
      const hoursSinceLastClaim = (now.getTime() - lastClaim.getTime()) / (1000 * 60 * 60);
      
      // Skip if less than minimum wait time
      if (hoursSinceLastClaim < MIN_HOURS) {
        console.log(`[claim-server-rewards] Server ${server.server_name}: Only ${hoursSinceLastClaim.toFixed(2)} hours since last claim, skipping`);
        continue;
      }

      // Cap at max hours to encourage daily claims
      const claimableHours = Math.min(hoursSinceLastClaim, MAX_HOURS);
      
      // Calculate pro-rated rewards (daily_yield / 24 hours * claimable hours)
      const boltReward = (server.daily_bolt_yield / 24) * claimableHours;
      const usdtReward = (server.daily_usdt_yield / 24) * claimableHours;

      console.log(`[claim-server-rewards] Server ${server.server_name}: ${claimableHours.toFixed(2)} hours = +${boltReward.toFixed(2)} BOLT, +${usdtReward.toFixed(4)} USDT`);

      totalBoltClaimed += boltReward;
      totalUsdtClaimed += usdtReward;

      // Update last_claim_at
      await supabase
        .from('user_servers')
        .update({ last_claim_at: now.toISOString() })
        .eq('id', server.id);
    }

    // Round to reasonable precision
    totalBoltClaimed = Math.floor(totalBoltClaimed);
    totalUsdtClaimed = Math.round(totalUsdtClaimed * 100) / 100;

    if (totalBoltClaimed > 0 || totalUsdtClaimed > 0) {
      // Update user balances
      const { data: userData, error: userError } = await supabase
        .from('bolt_users')
        .select('token_balance, usdt_balance')
        .eq('id', user_id)
        .single();

      if (userError) {
        console.error('[claim-server-rewards] Error fetching user:', userError);
        throw userError;
      }

      const newBoltBalance = (userData.token_balance || 0) + totalBoltClaimed;
      const newUsdtBalance = (userData.usdt_balance || 0) + totalUsdtClaimed;

      const { error: updateError } = await supabase
        .from('bolt_users')
        .update({
          token_balance: newBoltBalance,
          usdt_balance: newUsdtBalance,
          updated_at: now.toISOString(),
        })
        .eq('id', user_id);

      if (updateError) {
        console.error('[claim-server-rewards] Error updating balances:', updateError);
        throw updateError;
      }

      console.log(`[claim-server-rewards] Successfully claimed: ${totalBoltClaimed} BOLT, ${totalUsdtClaimed} USDT for user ${user_id}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        claimed_bolt: totalBoltClaimed,
        claimed_usdt: totalUsdtClaimed,
        servers_count: servers.length,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[claim-server-rewards] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
