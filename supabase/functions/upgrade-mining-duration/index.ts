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

    // Check if user can upgrade (max duration is 24 hours)
    if (user.mining_duration_hours >= 24) {
      return new Response(
        JSON.stringify({ error: 'Maximum mining duration reached' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Calculate next duration level
    let nextDuration: number;
    const current = user.mining_duration_hours;
    
    if (current === 4) {
      nextDuration = 12;
    } else if (current === 12) {
      nextDuration = 24;
    } else {
      nextDuration = 24; // Max
    }

    // Record the upgrade purchase - using bolt_upgrade_purchases table
    const { error: upgradeError } = await supabaseClient
      .from('bolt_upgrade_purchases')
      .insert({
        user_id: userId,
        upgrade_type: 'mining_duration',
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

    // Update user's mining duration - using bolt_users table
    const { error: updateError } = await supabaseClient
      .from('bolt_users')
      .update({
        mining_duration_hours: nextDuration
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating mining duration:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update mining duration' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Mining duration upgraded for user ${userId}: ${current}h -> ${nextDuration}h`);

    return new Response(
      JSON.stringify({ 
        success: true,
        previousDuration: current,
        newDuration: nextDuration,
        message: 'Mining duration upgraded successfully'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in upgrade-mining-duration:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
