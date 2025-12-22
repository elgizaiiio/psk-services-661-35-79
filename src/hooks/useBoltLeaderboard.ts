import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BoltUser } from '@/types/bolt';

interface LeaderboardEntry extends BoltUser {
  rank?: number;
}

export const useBoltLeaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('bolt_users' as any)
        .select('*')
        .order('token_balance', { ascending: false })
        .limit(100);

      if (error) throw error;

      const rankedData = ((data || []) as unknown as BoltUser[]).map((entry, index) => ({
        ...entry,
        rank: index + 1
      }));

      setLeaderboard(rankedData);
    } catch (err: any) {
      console.error('Error loading leaderboard:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const getUserRank = useCallback(async (userId: string) => {
    try {
      const { data: user } = await supabase
        .from('bolt_users' as any)
        .select('token_balance')
        .eq('id', userId)
        .single();

      if (!user) return null;

      const userData = user as unknown as { token_balance: number };

      const { count } = await supabase
        .from('bolt_users' as any)
        .select('*', { count: 'exact', head: true })
        .gt('token_balance', userData.token_balance);

      return (count || 0) + 1;
    } catch (err: any) {
      console.error('Error getting user rank:', err);
      return null;
    }
  }, []);

  useEffect(() => {
    loadLeaderboard();
    const interval = setInterval(loadLeaderboard, 30000);
    return () => clearInterval(interval);
  }, [loadLeaderboard]);

  return { leaderboard, loading, error, refreshLeaderboard: loadLeaderboard, getUserRank, clearError: () => setError(null) };
};
