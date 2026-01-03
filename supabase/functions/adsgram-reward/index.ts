import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DAILY_AD_LIMIT = 500;
const REWARD_BOLT = 10;
const REWARD_USDT = 0.01;

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');

    console.log('AdsGram reward callback received for userId:', userId);

    if (!userId) {
      console.error('Missing userId parameter');
      return new Response(
        JSON.stringify({ success: false, error: 'Missing userId parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const telegramId = parseInt(userId, 10);
    if (isNaN(telegramId)) {
      console.error('Invalid userId format:', userId);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid userId format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find user by Telegram ID
    const { data: user, error: userError } = await supabase
      .from('bolt_users')
      .select('id, token_balance, usdt_balance, telegram_id')
      .eq('telegram_id', telegramId)
      .single();

    if (userError || !user) {
      console.error('User not found for telegram_id:', telegramId, userError);
      return new Response(
        JSON.stringify({ success: false, error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Found user:', user.id, 'telegram_id:', telegramId);

    // Check daily ad limit
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    const { count, error: countError } = await supabase
      .from('ad_views')
      .select('*', { count: 'exact', head: true })
      .eq('telegram_id', telegramId)
      .gte('created_at', startOfDay.toISOString())
      .lt('created_at', endOfDay.toISOString());

    if (countError) {
      console.error('Error checking ad count:', countError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to check daily limit' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const dailyCount = count || 0;
    console.log('Daily ad count for user:', dailyCount, '/ limit:', DAILY_AD_LIMIT);

    if (dailyCount >= DAILY_AD_LIMIT) {
      console.log('Daily limit reached for user:', telegramId);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Daily limit reached',
          dailyCount,
          limit: DAILY_AD_LIMIT
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update user balance
    const newTokenBalance = (user.token_balance || 0) + REWARD_BOLT;
    const newUsdtBalance = (user.usdt_balance || 0) + REWARD_USDT;

    const { error: updateError } = await supabase
      .from('bolt_users')
      .update({
        token_balance: newTokenBalance,
        usdt_balance: newUsdtBalance,
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating user balance:', updateError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to update balance' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Record ad view
    const { error: insertError } = await supabase
      .from('ad_views')
      .insert({
        user_id: user.id,
        telegram_id: telegramId,
        ad_type: 'task_reward',
        reward_bolt: REWARD_BOLT,
        reward_usdt: REWARD_USDT,
      });

    if (insertError) {
      console.error('Error recording ad view:', insertError);
      // Don't fail the request, reward was already given
    }

    console.log('Reward given successfully to user:', user.id, 'BOLT:', REWARD_BOLT, 'USDT:', REWARD_USDT);

    return new Response(
      JSON.stringify({
        success: true,
        reward: {
          bolt: REWARD_BOLT,
          usdt: REWARD_USDT,
        },
        dailyCount: dailyCount + 1,
        limit: DAILY_AD_LIMIT,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error in adsgram-reward:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
