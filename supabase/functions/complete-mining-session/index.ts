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

    const { sessionId } = await req.json();

    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: 'Session ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get the mining session
    const { data: session, error: sessionError } = await supabaseClient
      .from('viral_mining_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('is_active', true)
      .single();

    if (sessionError || !session) {
      console.error('Session not found:', sessionError);
      return new Response(
        JSON.stringify({ error: 'Mining session not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Calculate the reward using the database function
    const { data: rewardData, error: rewardError } = await supabaseClient
      .rpc('calculate_mining_reward', { session_id: sessionId });

    if (rewardError) {
      console.error('Error calculating reward:', rewardError);
      return new Response(
        JSON.stringify({ error: 'Failed to calculate reward' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const totalReward = rewardData || 0;

    // Update the mining session as completed
    const { error: updateSessionError } = await supabaseClient
      .from('viral_mining_sessions')
      .update({
        is_active: false,
        completed_at: new Date().toISOString(),
        total_tokens_mined: totalReward
      })
      .eq('id', sessionId);

    if (updateSessionError) {
      console.error('Error updating session:', updateSessionError);
      return new Response(
        JSON.stringify({ error: 'Failed to complete session' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Update user's token balance (no raw SQL; fetch and increment)
    const { data: userRow, error: userFetchError } = await supabaseClient
      .from('viral_users')
      .select('token_balance')
      .eq('id', session.user_id)
      .single();

    if (userFetchError) {
      console.error('Error fetching user balance:', userFetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch user balance' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const newBalance = (Number(userRow?.token_balance) || 0) + Number(totalReward);

    const { error: updateBalanceError } = await supabaseClient
      .from('viral_users')
      .update({ token_balance: newBalance })
      .eq('id', session.user_id);

    if (updateBalanceError) {
      console.error('Error updating balance:', updateBalanceError);
      return new Response(
        JSON.stringify({ error: 'Failed to update balance' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Mining session ${sessionId} completed. Reward: ${totalReward} VIRAL`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        totalReward,
        message: 'Mining session completed successfully'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in complete-mining-session:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});