import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-telegram-init-data',
};

interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { telegramUser } = await req.json() as { telegramUser: TelegramUser };

    if (!telegramUser?.id) {
      return new Response(
        JSON.stringify({ error: 'Telegram user ID required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const telegramId = telegramUser.id;

    // Start all queries in parallel for maximum efficiency
    const [userResult, miningResult, completedTasksResult, streakResult] = await Promise.all([
      // 1. Get or create user
      supabase
        .from('bolt_users')
        .select('*')
        .eq('telegram_id', telegramId)
        .maybeSingle(),
      
      // 2. Get active mining session (will filter by user later)
      supabase
        .from('bolt_mining_sessions')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false }),
      
      // 3. Get completed task IDs (will filter by user later)
      supabase
        .from('bolt_completed_tasks')
        .select('task_id'),
      
      // 4. Get streak data (will filter by user later)
      supabase
        .from('daily_login_rewards')
        .select('*')
        .order('claimed_at', { ascending: false })
        .limit(1),
    ]);

    let user = userResult.data;
    let completedSession = null;

    // Create user if not exists
    if (!user) {
      const { data: newUser, error: createError } = await supabase
        .from('bolt_users')
        .insert({
          telegram_id: telegramId,
          telegram_username: telegramUser.username || null,
          first_name: telegramUser.first_name || null,
          last_name: telegramUser.last_name || null,
          photo_url: telegramUser.photo_url || null,
          token_balance: 0,
          usdt_balance: 0,
          mining_power: 1,
          mining_duration_hours: 4,
          total_referrals: 0,
          referral_bonus: 0,
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating user:', createError);
        return new Response(
          JSON.stringify({ error: 'Failed to create user' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      user = newUser;
    } else {
      // Update user info if changed
      const updates: Record<string, any> = {};
      if (telegramUser.username && telegramUser.username !== user.telegram_username) {
        updates.telegram_username = telegramUser.username;
      }
      if (telegramUser.first_name && telegramUser.first_name !== user.first_name) {
        updates.first_name = telegramUser.first_name;
      }
      if (telegramUser.photo_url && telegramUser.photo_url !== user.photo_url) {
        updates.photo_url = telegramUser.photo_url;
      }

      if (Object.keys(updates).length > 0) {
        updates.updated_at = new Date().toISOString();
        await supabase.from('bolt_users').update(updates).eq('id', user.id);
        user = { ...user, ...updates };
      }
    }

    // Filter mining session for this user
    const allMiningSessions = miningResult.data || [];
    let miningSession = allMiningSessions.find((s: any) => s.user_id === user.id) || null;

    // Check if mining session is complete
    if (miningSession) {
      const endTime = new Date(miningSession.end_time);
      const now = new Date();

      if (now >= endTime) {
        // Auto-complete the session
        const hoursActive = (endTime.getTime() - new Date(miningSession.start_time).getTime()) / (1000 * 60 * 60);
        const tokensEarned = Math.max(0, hoursActive * miningSession.tokens_per_hour * miningSession.mining_power);

        // Update session
        await supabase
          .from('bolt_mining_sessions')
          .update({
            is_active: false,
            completed_at: now.toISOString(),
            total_mined: tokensEarned,
          })
          .eq('id', miningSession.id);

        // Update user balance
        const newBalance = (user.token_balance || 0) + tokensEarned;
        await supabase
          .from('bolt_users')
          .update({ token_balance: newBalance, updated_at: now.toISOString() })
          .eq('id', user.id);

        user = { ...user, token_balance: newBalance };
        completedSession = { totalReward: tokensEarned };
        miningSession = null;
      }
    }

    // Filter completed tasks for this user
    const allCompletedTasks = completedTasksResult.data || [];
    // Re-query with proper filter since we now have user.id
    const { data: userCompletedTasks } = await supabase
      .from('bolt_completed_tasks')
      .select('task_id')
      .eq('user_id', user.id);
    
    const completedTaskIds = (userCompletedTasks || []).map((t: any) => t.task_id);

    // Filter streak data for this user
    const { data: userStreakData } = await supabase
      .from('daily_login_rewards')
      .select('*')
      .eq('user_id', user.id)
      .order('claimed_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Calculate streak info
    let streakData = null;
    if (user) {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      if (!userStreakData) {
        streakData = { currentStreak: 0, canClaim: true, lastClaimDate: null };
      } else {
        const claimDate = new Date(userStreakData.claimed_at).toISOString().split('T')[0];
        
        if (claimDate === today) {
          streakData = {
            currentStreak: userStreakData.streak_day,
            canClaim: false,
            lastClaimDate: claimDate,
          };
        } else if (claimDate === yesterday) {
          streakData = {
            currentStreak: userStreakData.streak_day,
            canClaim: true,
            lastClaimDate: claimDate,
          };
        } else {
          streakData = { currentStreak: 0, canClaim: true, lastClaimDate: claimDate };
        }
      }
    }

    console.log(`Dashboard loaded for user ${telegramId}: balance=${user.token_balance}, session=${!!miningSession}, tasks=${completedTaskIds.length}`);

    return new Response(
      JSON.stringify({
        user,
        miningSession,
        completedTaskIds,
        streakData,
        completedSession,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Dashboard error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
