import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { createLogger } from '@/lib/logger';

const logger = createLogger('ContestLeaderboard');

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

interface BoltUser {
  id: string;
  telegram_username: string | null;
  first_name: string | null;
  photo_url: string | null;
}

interface Participant {
  user_id: string;
  referral_count: number;
}

export const useContestLeaderboard = (userId?: string) => {
  const [contest, setContest] = useState<Contest | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<UserRank | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActiveContest = useCallback(async (): Promise<Contest | null> => {
    const { data, error: fetchError } = await supabase
      .from('referral_contests')
      .select('*')
      .eq('status', 'active')
      .eq('is_active', true)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      logger.error('Error fetching contest', fetchError);
      return null;
    }

    return data as unknown as Contest;
  }, []);

  const fetchLeaderboard = useCallback(async (contestId: string): Promise<LeaderboardEntry[]> => {
    const { data: participants, error: partError } = await supabase
      .from('contest_participants')
      .select('user_id, referral_count')
      .eq('contest_id', contestId)
      .order('referral_count', { ascending: false })
      .limit(50);

    if (partError) {
      logger.error('Error fetching participants', partError);
      return [];
    }

    if (!participants || participants.length === 0) return [];

    const typedParticipants = participants as unknown as Participant[];
    const userIds = typedParticipants.map(p => p.user_id);
    
    const { data: users } = await supabase
      .from('bolt_users')
      .select('id, telegram_username, first_name, photo_url')
      .in('id', userIds);

    const usersMap: Record<string, BoltUser> = {};
    ((users || []) as unknown as BoltUser[]).forEach(u => {
      usersMap[u.id] = u;
    });

    return typedParticipants.map((p, index) => ({
      user_id: p.user_id,
      referral_count: p.referral_count,
      rank: index + 1,
      username: usersMap[p.user_id]?.telegram_username || null,
      first_name: usersMap[p.user_id]?.first_name || null,
      photo_url: usersMap[p.user_id]?.photo_url || null,
    }));
  }, []);

  const calculateUserRank = useCallback(async (
    contestId: string, 
    targetUserId: string, 
    prizes: ContestPrize[]
  ): Promise<UserRank> => {
    const { data: userPart } = await supabase
      .from('contest_participants')
      .select('referral_count')
      .eq('contest_id', contestId)
      .eq('user_id', targetUserId)
      .single();

    if (!userPart) {
      return { rank: 0, referral_count: 0, prize_usd: null };
    }

    const typedUserPart = userPart as unknown as { referral_count: number };
    const userCount = typedUserPart.referral_count;

    const { count } = await supabase
      .from('contest_participants')
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
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Error loading contest data', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [userId, fetchActiveContest, fetchLeaderboard, calculateUserRank]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
