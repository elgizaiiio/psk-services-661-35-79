import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useBoltMining } from '@/hooks/useBoltMining';

export interface BoltTownPoints {
  id: string;
  user_id: string;
  date: string;
  referral_points: number;
  referral_bonus_points: number;
  task_points: number;
  special_task_points: number;
  ad_points: number;
  activity_points: number;
  streak_bonus: number;
  total_points: number;
  special_task_done: boolean;
}

export interface LeaderboardEntry {
  user_id: string;
  telegram_username: string | null;
  first_name: string | null;
  total_points: number;
  rank: number;
}

export interface DailyWinner {
  id: string;
  telegram_username: string | null;
  total_points: number;
  prize_usdt: number;
  date: string;
}

export const useBoltTown = () => {
  const { user: telegramUser } = useTelegramAuth();
  const { user: boltUser } = useBoltMining(telegramUser);

  const [myPoints, setMyPoints] = useState<BoltTownPoints | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [previousWinners, setPreviousWinners] = useState<DailyWinner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  // Get or create today's points record
  const getOrCreateTodayPoints = useCallback(async () => {
    if (!boltUser?.id) return null;

    const today = getTodayDate();

    try {
      // Try to get existing record
      const { data: existing } = await supabase
        .from('bolt_town_daily_points')
        .select('*')
        .eq('user_id', boltUser.id)
        .eq('date', today)
        .maybeSingle();

      if (existing) {
        return existing as unknown as BoltTownPoints;
      }

      // Create new record for today
      const { data: created, error: createError } = await supabase
        .from('bolt_town_daily_points')
        .insert({
          user_id: boltUser.id,
          date: today,
        })
        .select()
        .single();

      if (createError) {
        // Handle race condition - another request might have created it
        if (createError.code === '23505') {
          const { data: retryGet } = await supabase
            .from('bolt_town_daily_points')
            .select('*')
            .eq('user_id', boltUser.id)
            .eq('date', today)
            .maybeSingle();
          return retryGet as unknown as BoltTownPoints;
        }
        throw createError;
      }

      return created as unknown as BoltTownPoints;
    } catch (err) {
      console.error('Error getting/creating today points:', err);
      return null;
    }
  }, [boltUser?.id]);

  // Load leaderboard
  const loadLeaderboard = useCallback(async () => {
    const today = getTodayDate();

    try {
      // Get top 50 users for today with their user info
      const { data: pointsData, error: pointsError } = await supabase
        .from('bolt_town_daily_points')
        .select('user_id, total_points')
        .eq('date', today)
        .order('total_points', { ascending: false })
        .limit(50);

      if (pointsError) throw pointsError;

      if (!pointsData || pointsData.length === 0) {
        setLeaderboard([]);
        return;
      }

      // Get user details for all users in leaderboard
      const userIds = pointsData.map(p => p.user_id);
      const { data: usersData } = await supabase
        .from('bolt_users')
        .select('id, telegram_username, first_name')
        .in('id', userIds);

      const usersMap = new Map((usersData || []).map(u => [u.id, u]));

      const entries: LeaderboardEntry[] = pointsData.map((p, idx) => {
        const user = usersMap.get(p.user_id);
        return {
          user_id: p.user_id,
          telegram_username: (user as any)?.telegram_username || null,
          first_name: (user as any)?.first_name || null,
          total_points: p.total_points || 0,
          rank: idx + 1,
        };
      });

      setLeaderboard(entries);

      // Find my rank
      if (boltUser?.id) {
        const myEntry = entries.find(e => e.user_id === boltUser.id);
        if (myEntry) {
          setMyRank(myEntry.rank);
        } else {
          // User not in top 50, calculate their rank
          const { count } = await supabase
            .from('bolt_town_daily_points')
            .select('*', { count: 'exact', head: true })
            .eq('date', today)
            .gt('total_points', myPoints?.total_points || 0);

          setMyRank((count || 0) + 1);
        }
      }
    } catch (err) {
      console.error('Error loading leaderboard:', err);
    }
  }, [boltUser?.id, myPoints?.total_points]);

  // Load previous winners
  const loadPreviousWinners = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('bolt_town_daily_winners')
        .select('id, telegram_username, total_points, prize_usdt, date')
        .order('date', { ascending: false })
        .limit(7);

      if (error) throw error;
      setPreviousWinners((data || []) as unknown as DailyWinner[]);
    } catch (err) {
      console.error('Error loading previous winners:', err);
    }
  }, []);

  // Add points for different activities
  const addReferralPoints = useCallback(async (bonusForTask = false) => {
    if (!boltUser?.id) return false;

    try {
      const todayPoints = await getOrCreateTodayPoints();
      if (!todayPoints) return false;

      const updates: Record<string, any> = {
        referral_points: (todayPoints.referral_points || 0) + 10,
      };

      if (bonusForTask) {
        updates.referral_bonus_points = (todayPoints.referral_bonus_points || 0) + 5;
      }

      const { error } = await supabase
        .from('bolt_town_daily_points')
        .update(updates)
        .eq('id', todayPoints.id);

      if (error) throw error;
      await loadMyPoints();
      return true;
    } catch (err) {
      console.error('Error adding referral points:', err);
      return false;
    }
  }, [boltUser?.id, getOrCreateTodayPoints]);

  const addTaskPoints = useCallback(async (isSpecialTask = false) => {
    if (!boltUser?.id) return false;

    try {
      const todayPoints = await getOrCreateTodayPoints();
      if (!todayPoints) return false;

      const updates: Record<string, any> = {};

      if (isSpecialTask) {
        if (todayPoints.special_task_done) return false; // Already done today
        updates.special_task_points = 10;
        updates.special_task_done = true;
      } else {
        updates.task_points = (todayPoints.task_points || 0) + 5;
      }

      const { error } = await supabase
        .from('bolt_town_daily_points')
        .update(updates)
        .eq('id', todayPoints.id);

      if (error) throw error;
      await loadMyPoints();
      return true;
    } catch (err) {
      console.error('Error adding task points:', err);
      return false;
    }
  }, [boltUser?.id, getOrCreateTodayPoints]);

  const addAdPoints = useCallback(async () => {
    if (!boltUser?.id) return false;

    try {
      const todayPoints = await getOrCreateTodayPoints();
      if (!todayPoints) return false;

      // No limit on ads - just add 2 points per ad
      const { error } = await supabase
        .from('bolt_town_daily_points')
        .update({
          ad_points: (todayPoints.ad_points || 0) + 2,
        })
        .eq('id', todayPoints.id);

      if (error) throw error;
      await loadMyPoints();
      return true;
    } catch (err) {
      console.error('Error adding ad points:', err);
      return false;
    }
  }, [boltUser?.id, getOrCreateTodayPoints]);

  const addActivityPoints = useCallback(async (isStreak = false) => {
    if (!boltUser?.id) return false;

    try {
      const todayPoints = await getOrCreateTodayPoints();
      if (!todayPoints) return false;

      const updates: Record<string, any> = {
        activity_points: (todayPoints.activity_points || 0) + 1,
      };

      if (isStreak) {
        updates.streak_bonus = (todayPoints.streak_bonus || 0) + 5;
      }

      const { error } = await supabase
        .from('bolt_town_daily_points')
        .update(updates)
        .eq('id', todayPoints.id);

      if (error) throw error;
      await loadMyPoints();
      return true;
    } catch (err) {
      console.error('Error adding activity points:', err);
      return false;
    }
  }, [boltUser?.id, getOrCreateTodayPoints]);

  const addServerPurchasePoints = useCallback(async () => {
    if (!boltUser?.id) return false;

    try {
      const todayPoints = await getOrCreateTodayPoints();
      if (!todayPoints) return false;

      // Add 100 points for server purchase under task_points
      const { error } = await supabase
        .from('bolt_town_daily_points')
        .update({
          task_points: (todayPoints.task_points || 0) + 100,
        })
        .eq('id', todayPoints.id);

      if (error) throw error;
      await loadMyPoints();
      return true;
    } catch (err) {
      console.error('Error adding server purchase points:', err);
      return false;
    }
  }, [boltUser?.id, getOrCreateTodayPoints]);

  // Load my points
  const loadMyPoints = useCallback(async () => {
    if (!boltUser?.id) return;

    const today = getTodayDate();

    try {
      const { data } = await supabase
        .from('bolt_town_daily_points')
        .select('*')
        .eq('user_id', boltUser.id)
        .eq('date', today)
        .maybeSingle();

      setMyPoints(data as unknown as BoltTownPoints | null);
    } catch (err) {
      console.error('Error loading my points:', err);
    }
  }, [boltUser?.id]);

  // Calculate time until midnight UTC
  const getTimeUntilReset = useCallback(() => {
    const now = new Date();
    const midnight = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1,
      0, 0, 0, 0
    ));
    return midnight.getTime() - now.getTime();
  }, []);

  // Initial load
  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      try {
        await Promise.all([
          getOrCreateTodayPoints(),
          loadMyPoints(),
          loadLeaderboard(),
          loadPreviousWinners(),
        ]);
      } catch (err) {
        setError('Failed to load competition data');
      } finally {
        setLoading(false);
      }
    };

    if (boltUser?.id) {
      loadAll();
    } else {
      setLoading(false);
    }
  }, [boltUser?.id, getOrCreateTodayPoints, loadMyPoints, loadLeaderboard, loadPreviousWinners]);

  // Subscribe to realtime updates for leaderboard
  useEffect(() => {
    const today = getTodayDate();

    const channel = supabase
      .channel('bolt-town-leaderboard')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bolt_town_daily_points',
          filter: `date=eq.${today}`,
        },
        () => {
          loadLeaderboard();
          loadMyPoints();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadLeaderboard, loadMyPoints]);

  return {
    myPoints,
    leaderboard,
    myRank,
    previousWinners,
    loading,
    error,
    addReferralPoints,
    addTaskPoints,
    addAdPoints,
    addActivityPoints,
    addServerPurchasePoints,
    getTimeUntilReset,
    refreshLeaderboard: loadLeaderboard,
    refreshMyPoints: loadMyPoints,
  };
};
