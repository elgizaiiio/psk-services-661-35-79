import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { userId } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get current user data
    const { data: user, error: userError } = await supabaseClient
      .from('viral_users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      console.error('User not found:', userError);
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check if user can upgrade
    if (user.mining_power_multiplier >= 200) {
      return new Response(
        JSON.stringify({ error: 'Maximum mining power reached' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Calculate next multiplier level
    let nextMultiplier: number;
    const current = user.mining_power_multiplier;
    
    if (current < 10) {
      nextMultiplier = current + 2;
    } else if (current < 50) {
      nextMultiplier = current + 10;
    } else if (current < 100) {
      nextMultiplier = current + 25;
    } else {
      nextMultiplier = Math.min(200, current + 50);
    }

    // In a real implementation, you would:
    // 1. Verify TON payment transaction
    // 2. Check transaction hash and amount
    // For now, we'll simulate the upgrade

    // Record the upgrade
    const { error: upgradeError } = await supabaseClient
      .from('viral_upgrades')
      .insert({
        user_id: userId,
        upgrade_type: 'mining_power',
        upgrade_level: nextMultiplier,
        cost_ton: 0.5,
        // transaction_hash: 'simulated_hash_' + Date.now()
      });

    if (upgradeError) {
      console.error('Error recording upgrade:', upgradeError);
      return new Response(
        JSON.stringify({ error: 'Failed to record upgrade' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Update user's mining power
    const { error: updateError } = await supabaseClient
      .from('viral_users')
      .update({
        mining_power_multiplier: nextMultiplier
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating mining power:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update mining power' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Mining power upgraded for user ${userId}: ${current} -> ${nextMultiplier}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        previousMultiplier: current,
        newMultiplier: nextMultiplier,
        message: 'Mining power upgraded successfully'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in upgrade-mining-power:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});