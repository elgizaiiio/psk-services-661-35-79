import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useBoltMining } from '@/hooks/useBoltMining';

// Rewards increase each day up to day 7, then reset
const STREAK_REWARDS = [5, 10, 15, 25, 35, 50, 75];

interface DailyLoginReward {
  id: string;
  user_id: string;
  streak_day: number;
  reward_claimed: number;
  claimed_at: string;
}

export const useDailyStreak = () => {
  const { user: telegramUser } = useTelegramAuth();
  const { user, refreshUser } = useBoltMining(telegramUser);
  
  const [currentStreak, setCurrentStreak] = useState(0);
  const [canClaim, setCanClaim] = useState(false);
  const [lastClaimDate, setLastClaimDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const getYesterdayDate = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  };

  const loadStreakData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      
      // Get the most recent claim
      const { data, error } = await supabase
        .from('daily_login_rewards' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('claimed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      const lastClaim = data as unknown as DailyLoginReward | null;
      const today = getTodayDate();
      const yesterday = getYesterdayDate();

      if (!lastClaim) {
        setCurrentStreak(0);
        setCanClaim(true);
        setLastClaimDate(null);
      } else {
        const claimDate = new Date(lastClaim.claimed_at).toISOString().split('T')[0];
        setLastClaimDate(claimDate);

        if (claimDate === today) {
          setCurrentStreak(lastClaim.streak_day);
          setCanClaim(false);
        } else if (claimDate === yesterday) {
          setCurrentStreak(lastClaim.streak_day);
          setCanClaim(true);
        } else {
          setCurrentStreak(0);
          setCanClaim(true);
        }
      }
    } catch (err) {
      console.error('Error loading streak data:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const claimDailyReward = useCallback(async () => {
    if (!user?.id || !canClaim || claiming) return false;

    try {
      setClaiming(true);

      const nextDay = (currentStreak % 7) + 1;
      const reward = STREAK_REWARDS[nextDay - 1];

      // Insert claim record
      const { error: insertError } = await supabase
        .from('daily_login_rewards' as any)
        .insert({
          user_id: user.id,
          streak_day: nextDay,
          reward_claimed: reward,
        });

      if (insertError) throw insertError;

      // Update user balance
      const newBalance = (Number(user.token_balance) || 0) + reward;
      const { error: updateError } = await supabase
        .from('bolt_users' as any)
        .update({ 
          token_balance: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Refresh data
      setCurrentStreak(nextDay);
      setCanClaim(false);
      setLastClaimDate(getTodayDate());
      await refreshUser();

      return reward;
    } catch (err) {
      console.error('Error claiming reward:', err);
      return false;
    } finally {
      setClaiming(false);
    }
  }, [user, canClaim, claiming, currentStreak, refreshUser]);

  // Claim with x2 bonus (after watching ad)
  const claimDailyRewardWithBonus = useCallback(async () => {
    if (!user?.id || !canClaim || claiming) return false;

    try {
      setClaiming(true);

      const nextDay = (currentStreak % 7) + 1;
      const baseReward = STREAK_REWARDS[nextDay - 1];
      const reward = baseReward * 2; // Double reward

      // Insert claim record with is_doubled flag
      const { error: insertError } = await supabase
        .from('daily_login_rewards' as any)
        .insert({
          user_id: user.id,
          streak_day: nextDay,
          reward_claimed: reward,
          is_doubled: true,
        });

      if (insertError) throw insertError;

      // Update user balance
      const newBalance = (Number(user.token_balance) || 0) + reward;
      const { error: updateError } = await supabase
        .from('bolt_users' as any)
        .update({ 
          token_balance: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Refresh data
      setCurrentStreak(nextDay);
      setCanClaim(false);
      setLastClaimDate(getTodayDate());
      await refreshUser();

      return reward;
    } catch (err) {
      console.error('Error claiming bonus reward:', err);
      return false;
    } finally {
      setClaiming(false);
    }
  }, [user, canClaim, claiming, currentStreak, refreshUser]);

  useEffect(() => {
    loadStreakData();
  }, [loadStreakData]);

  const getNextReward = () => {
    const nextDay = (currentStreak % 7) + 1;
    return STREAK_REWARDS[nextDay - 1];
  };

  const getRewardForDay = (day: number) => {
    return STREAK_REWARDS[(day - 1) % 7];
  };

  return {
    currentStreak,
    canClaim,
    lastClaimDate,
    loading,
    claiming,
    claimDailyReward,
    claimDailyRewardWithBonus,
    getNextReward,
    getRewardForDay,
    streakRewards: STREAK_REWARDS,
    refresh: loadStreakData,
  };
};
