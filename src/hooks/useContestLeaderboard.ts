import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ContestPrize {
  rank: number;
  prize_usd: number;
}

interface Contest {
  id: string;
  name: string;
  name_ar: string | null;
  description: string | null;
  description_ar: string | null;
  prize_pool_usd: number;
  prizes_config: ContestPrize[];
  start_date: string;
  end_date: string;
  status: string;
  is_active: boolean;
}

interface LeaderboardEntry {
  user_id: string;
  referral_count: number;
  rank: number;
  username: string | null;
  first_name: string | null;
  photo_url: string | null;
}

interface UserRank {
  rank: number;
  referral_count: number;
  prize_usd: number | null;
}

export const useContestLeaderboard = (userId?: string) => {
  const [contest, setContest] = useState<Contest | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<UserRank | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActiveContest = useCallback(async () => {
    const { data, error } = await supabase
      .from('referral_contests' as any)
      .select('*')
      .eq('status', 'active')
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching contest:', error);
      return null;
    }

    return data as unknown as Contest;
  }, []);

  const fetchLeaderboard = useCallback(async (contestId: string) => {
    // Get all participants with their referral counts
    const { data: participants, error: partError } = await supabase
      .from('contest_participants' as any)
      .select('user_id, referral_count')
      .eq('contest_id', contestId)
      .order('referral_count', { ascending: false })
      .limit(50);

    if (partError) {
      console.error('Error fetching participants:', partError);
      return [];
    }

    if (!participants || participants.length === 0) return [];

    // Get user details for all participants
    const userIds = (participants as any[]).map(p => p.user_id);
    const { data: users } = await supabase
      .from('bolt_users' as any)
      .select('id, telegram_username, first_name, photo_url')
      .in('id', userIds);

    const usersMap: Record<string, any> = {};
    ((users || []) as any[]).forEach(u => {
      usersMap[u.id] = u;
    });

    return (participants as any[]).map((p, index) => ({
      user_id: p.user_id,
      referral_count: p.referral_count,
      rank: index + 1,
      username: usersMap[p.user_id]?.telegram_username || null,
      first_name: usersMap[p.user_id]?.first_name || null,
      photo_url: usersMap[p.user_id]?.photo_url || null,
    }));
  }, []);

  const calculateUserRank = useCallback(async (contestId: string, userId: string, prizes: ContestPrize[]) => {
    // Get user's participation
    const { data: userPart } = await supabase
      .from('contest_participants' as any)
      .select('referral_count')
      .eq('contest_id', contestId)
      .eq('user_id', userId)
      .single();

    if (!userPart) {
      return { rank: 0, referral_count: 0, prize_usd: null };
    }

    const userCount = (userPart as any).referral_count;

    // Count how many have more referrals
    const { count } = await supabase
      .from('contest_participants' as any)
      .select('*', { count: 'exact', head: true })
      .eq('contest_id', contestId)
      .gt('referral_count', userCount);

    const rank = (count || 0) + 1;
    const prize = prizes.find(p => p.rank === rank);

    return {
      rank,
      referral_count: userCount,
      prize_usd: prize?.prize_usd || null,
    };
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const activeContest = await fetchActiveContest();
      if (!activeContest) {
        setContest(null);
        setLoading(false);
        return;
      }

      setContest(activeContest);

      const leaderboardData = await fetchLeaderboard(activeContest.id);
      setLeaderboard(leaderboardData);

      if (userId) {
        const userRankData = await calculateUserRank(
          activeContest.id,
          userId,
          activeContest.prizes_config
        );
        setUserRank(userRankData);
      }
    } catch (err: any) {
      console.error('Error loading contest data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId, fetchActiveContest, fetchLeaderboard, calculateUserRank]);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Realtime subscription for live updates
  useEffect(() => {
    if (!contest?.id) return;

    const channel = supabase
      .channel('contest-leaderboard')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contest_participants',
          filter: `contest_id=eq.${contest.id}`,
        },
        () => {
          // Refresh leaderboard on any change
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [contest?.id, loadData]);

  return {
    contest,
    leaderboard,
    userRank,
    loading,
    error,
    refresh: loadData,
  };
};
