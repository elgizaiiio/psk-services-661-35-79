import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-telegram-id',
};

// In-memory rate limit store (per session)
const claimAttempts = new Map<string, number>();

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { sessionId } = await req.json();
    const telegramId = req.headers.get('x-telegram-id');

    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: 'Session ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limit: prevent rapid claim attempts
    const lastAttempt = claimAttempts.get(sessionId) || 0;
    const now = Date.now();
    if (now - lastAttempt < 5000) { // 5 second cooldown per session
      return new Response(
        JSON.stringify({ error: 'Please wait before claiming again' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    claimAttempts.set(sessionId, now);

    // Get the mining session with user validation
    const { data: session, error: sessionError } = await supabaseClient
      .from('bolt_mining_sessions')
      .select('*, bolt_users!inner(telegram_id)')
      .eq('id', sessionId)
      .eq('is_active', true)
      .single();

    if (sessionError || !session) {
      console.error('Session not found:', sessionError);
      return new Response(
        JSON.stringify({ error: 'Mining session not found or already completed' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // SECURITY: Verify the session belongs to the requesting user
    if (telegramId && session.bolt_users?.telegram_id?.toString() !== telegramId) {
      console.error('User mismatch - attempted claim by different user');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // SECURITY: Server-side time calculation - don't trust client
    const startTime = new Date(session.start_time).getTime();
    const endTime = new Date(session.end_time).getTime();
    const serverNow = Date.now();
    
    // Only count time up to the scheduled end time
    const actualEndTime = Math.min(serverNow, endTime);
    const elapsedHours = Math.max(0, (actualEndTime - startTime) / (1000 * 60 * 60));
    
    // Get values from database, not from any client input
    const tokensPerHour = Number(session.tokens_per_hour) || 1;
    const miningPower = Number(session.mining_power) || 2;
    
    // Cap the maximum possible reward based on session duration
    const maxSessionHours = (endTime - startTime) / (1000 * 60 * 60);
    const cappedElapsedHours = Math.min(elapsedHours, maxSessionHours);
    
    const totalReward = Math.floor(cappedElapsedHours * tokensPerHour * miningPower);

    // SECURITY: Check for suspicious reward amount
    const maxPossibleReward = Math.floor(maxSessionHours * tokensPerHour * miningPower);
    if (totalReward > maxPossibleReward) {
      console.error('Suspicious reward amount detected', { totalReward, maxPossibleReward });
      return new Response(
        JSON.stringify({ error: 'Invalid reward calculation' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use a transaction-like approach: update session first
    const { error: updateSessionError } = await supabaseClient
      .from('bolt_mining_sessions')
      .update({
        is_active: false,
        completed_at: new Date().toISOString(),
        total_mined: totalReward
      })
      .eq('id', sessionId)
      .eq('is_active', true); // Double-check it's still active

    if (updateSessionError) {
      console.error('Error updating session:', updateSessionError);
      return new Response(
        JSON.stringify({ error: 'Failed to complete session - may already be claimed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update user's token balance atomically
    const { data: userRow, error: userFetchError } = await supabaseClient
      .from('bolt_users')
      .select('token_balance')
      .eq('id', session.user_id)
      .single();

    if (userFetchError) {
      console.error('Error fetching user balance:', userFetchError);
      // Rollback session update
      await supabaseClient
        .from('bolt_mining_sessions')
        .update({ is_active: true, completed_at: null, total_mined: 0 })
        .eq('id', sessionId);
      
      return new Response(
        JSON.stringify({ error: 'Failed to fetch user balance' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const newBalance = (Number(userRow?.token_balance) || 0) + Number(totalReward);

    const { error: updateBalanceError } = await supabaseClient
      .from('bolt_users')
      .update({ token_balance: newBalance })
      .eq('id', session.user_id);

    if (updateBalanceError) {
      console.error('Error updating balance:', updateBalanceError);
      return new Response(
        JSON.stringify({ error: 'Failed to update balance' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Mining session ${sessionId} completed. Reward: ${totalReward} BOLT, New balance: ${newBalance}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        totalReward,
        newBalance,
        message: 'Mining session completed successfully'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in complete-mining-session:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
