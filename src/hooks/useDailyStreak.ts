import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOptionalUserContext } from '@/contexts/UserContext';

// Rewards increase each day up to day 7, then reset
const STREAK_REWARDS = [5, 10, 15, 25, 35, 50, 75];

export const useDailyStreak = () => {
  // Use centralized context if available
  const userContext = useOptionalUserContext();
  
  const userId = userContext?.userId || null;
  const contextStreakData = userContext?.streakData;
  
  // Local state for claiming and optimistic updates
  const [claiming, setClaiming] = useState(false);
  const [localStreak, setLocalStreak] = useState<{
    currentStreak: number;
    canClaim: boolean;
    lastClaimDate: string | null;
  } | null>(null);

  // Use context data or local override
  const streakData = localStreak || contextStreakData;
  const currentStreak = streakData?.currentStreak || 0;
  const canClaim = streakData?.canClaim ?? false;
  const lastClaimDate = streakData?.lastClaimDate || null;
  const loading = userContext?.isLoading ?? true;

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const loadStreakData = useCallback(async () => {
    // Data is now loaded via UserContext, this is just for manual refresh
    if (userContext) {
      userContext.refreshUser();
      setLocalStreak(null); // Clear local override to use fresh context data
    }
  }, [userContext]);

  const claimDailyReward = useCallback(async () => {
    if (!userId || !canClaim || claiming) return false;

    try {
      setClaiming(true);

      const nextDay = (currentStreak % 7) + 1;
      const reward = STREAK_REWARDS[nextDay - 1];

      // Insert claim record
      const { error: insertError } = await supabase
        .from('daily_login_rewards')
        .insert({
          user_id: userId,
          streak_day: nextDay,
          reward_claimed: reward,
        });

      if (insertError) throw insertError;

      // Get current balance
      const { data: userData } = await supabase
        .from('bolt_users')
        .select('token_balance')
        .eq('id', userId)
        .single();

      // Update user balance
      const currentBalance = userData?.token_balance || 0;
      const newBalance = currentBalance + reward;
      
      const { error: updateError } = await supabase
        .from('bolt_users')
        .update({ 
          token_balance: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Optimistic update via local state
      setLocalStreak({
        currentStreak: nextDay,
        canClaim: false,
        lastClaimDate: getTodayDate(),
      });

      // Update context balance if available
      if (userContext) {
        userContext.updateUserBalance(newBalance);
      }

      return reward;
    } catch (err) {
      console.error('Error claiming reward:', err);
      return false;
    } finally {
      setClaiming(false);
    }
  }, [userId, canClaim, claiming, currentStreak, userContext]);

  // Claim with x2 bonus (after watching ad)
  const claimDailyRewardWithBonus = useCallback(async () => {
    if (!userId || !canClaim || claiming) return false;

    try {
      setClaiming(true);

      const nextDay = (currentStreak % 7) + 1;
      const baseReward = STREAK_REWARDS[nextDay - 1];
      const reward = baseReward * 2; // Double reward

      // Insert claim record with is_doubled flag
      const { error: insertError } = await supabase
        .from('daily_login_rewards')
        .insert({
          user_id: userId,
          streak_day: nextDay,
          reward_claimed: reward,
          is_doubled: true,
        });

      if (insertError) throw insertError;

      // Get current balance
      const { data: userData } = await supabase
        .from('bolt_users')
        .select('token_balance')
        .eq('id', userId)
        .single();

      // Update user balance
      const currentBalance = userData?.token_balance || 0;
      const newBalance = currentBalance + reward;
      
      const { error: updateError } = await supabase
        .from('bolt_users')
        .update({ 
          token_balance: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Optimistic update via local state
      setLocalStreak({
        currentStreak: nextDay,
        canClaim: false,
        lastClaimDate: getTodayDate(),
      });

      // Update context balance if available
      if (userContext) {
        userContext.updateUserBalance(newBalance);
      }

      return reward;
    } catch (err) {
      console.error('Error claiming bonus reward:', err);
      return false;
    } finally {
      setClaiming(false);
    }
  }, [userId, canClaim, claiming, currentStreak, userContext]);

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
