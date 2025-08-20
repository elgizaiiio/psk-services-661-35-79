import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LeaderboardEntry {
  id: string;
  telegram_username?: string;
  first_name?: string;
  last_name?: string;
  photo_url?: string;
  token_balance: number;
  mining_power_multiplier: number;
  created_at: string;
  rank?: number;
}

export const useLeaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('viral_users')
        .select('id, telegram_username, first_name, last_name, photo_url, token_balance, mining_power_multiplier, created_at')
        .order('token_balance', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Add rank to each entry
      const rankedData = (data || []).map((entry, index) => ({
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
        .from('viral_users')
        .select('token_balance')
        .eq('id', userId)
        .single();

      if (!user) return null;

      const { count } = await supabase
        .from('viral_users')
        .select('*', { count: 'exact', head: true })
        .gt('token_balance', user.token_balance);

      return (count || 0) + 1;
    } catch (err: any) {
      console.error('Error getting user rank:', err);
      return null;
    }
  }, []);

  useEffect(() => {
    loadLeaderboard();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadLeaderboard, 30000);
    return () => clearInterval(interval);
  }, [loadLeaderboard]);

  return {
    leaderboard,
    loading,
    error,
    refreshLeaderboard: loadLeaderboard,
    getUserRank,
    clearError: () => setError(null)
  };
};