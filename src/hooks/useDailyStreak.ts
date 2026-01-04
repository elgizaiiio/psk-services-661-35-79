import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';

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
  
  const [userId, setUserId] = useState<string | null>(null);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [canClaim, setCanClaim] = useState(false);
  const [lastClaimDate, setLastClaimDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);

  // Get user ID from telegram user
  useEffect(() => {
    const fetchUserId = async () => {
      if (!telegramUser?.id) {
        setLoading(false);
        return;
      }
      
      try {
        const { data } = await supabase
          .from('bolt_users')
          .select('id')
          .eq('telegram_id', telegramUser.id)
          .maybeSingle();
        
        if (data) {
          setUserId(data.id);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching user ID:', err);
        setLoading(false);
      }
    };
    
    fetchUserId();
  }, [telegramUser?.id]);

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const getYesterdayDate = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  };

  const loadStreakData = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      
      // Get the most recent claim
      const { data, error } = await supabase
        .from('daily_login_rewards')
        .select('*')
        .eq('user_id', userId)
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
  }, [userId]);

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

      // Refresh data
      setCurrentStreak(nextDay);
      setCanClaim(false);
      setLastClaimDate(getTodayDate());

      return reward;
    } catch (err) {
      console.error('Error claiming reward:', err);
      return false;
    } finally {
      setClaiming(false);
    }
  }, [userId, canClaim, claiming, currentStreak]);

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

      // Refresh data
      setCurrentStreak(nextDay);
      setCanClaim(false);
      setLastClaimDate(getTodayDate());

      return reward;
    } catch (err) {
      console.error('Error claiming bonus reward:', err);
      return false;
    } finally {
      setClaiming(false);
    }
  }, [userId, canClaim, claiming, currentStreak]);

  useEffect(() => {
    if (userId) {
      loadStreakData();
    }
  }, [userId, loadStreakData]);

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
