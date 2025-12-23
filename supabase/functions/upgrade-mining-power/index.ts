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

    const { userId, txHash } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get current user data - using bolt_users table
    const { data: user, error: userError } = await supabaseClient
      .from('bolt_users')
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

    // Check if user can upgrade (max mining power is 200)
    if (user.mining_power >= 200) {
      return new Response(
        JSON.stringify({ error: 'Maximum mining power reached' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Calculate next power level
    let nextPower: number;
    const current = Number(user.mining_power) || 2;
    
    if (current < 10) {
      nextPower = current + 2;
    } else if (current < 50) {
      nextPower = current + 10;
    } else if (current < 100) {
      nextPower = current + 25;
    } else {
      nextPower = Math.min(200, current + 50);
    }

    // Record the upgrade purchase - using bolt_upgrade_purchases table
    const { error: upgradeError } = await supabaseClient
      .from('bolt_upgrade_purchases')
      .insert({
        user_id: userId,
        upgrade_type: 'mining_power',
        amount_paid: 0.5
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

    // Update user's mining power - using bolt_users table
    const { error: updateError } = await supabaseClient
      .from('bolt_users')
      .update({
        mining_power: nextPower
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

    console.log(`Mining power upgraded for user ${userId}: ${current} -> ${nextPower}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        previousPower: current,
        newPower: nextPower,
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
