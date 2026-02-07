import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { BoltUser, BoltTask } from '@/types/bolt';
import { USER_DASHBOARD_KEY, TASKS_KEY } from '@/contexts/UserContext';

// Cache configuration
const STALE_TIME = 5 * 60 * 1000; // 5 minutes
const GC_TIME = 30 * 60 * 1000; // 30 minutes

/**
 * Hook for fetching all tasks (with caching)
 * Tasks are shared across users, so we cache them globally
 */
export function useTasks() {
  return useQuery<BoltTask[]>({
    queryKey: [TASKS_KEY],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bolt_tasks')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as BoltTask[];
    },
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });
}

/**
 * Hook for user balance updates with optimistic UI
 */
export function useUpdateBalance() {
  const queryClient = useQueryClient();
  const { user: telegramUser } = useTelegramAuth();

  const updateBalance = async (
    userId: string,
    updates: {
      token_balance?: number;
      ton_balance?: number;
      usdt_balance?: number;
    }
  ) => {
    // Optimistically update the cache
    queryClient.setQueryData([USER_DASHBOARD_KEY, telegramUser?.id], (old: any) => {
      if (!old?.user) return old;
      return {
        ...old,
        user: { ...old.user, ...updates },
      };
    });

    // Perform the actual update
    const { error } = await supabase
      .from('bolt_users')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) {
      // Revert on error
      queryClient.invalidateQueries({ queryKey: [USER_DASHBOARD_KEY] });
      throw error;
    }
  };

  return { updateBalance };
}

/**
 * Hook for TON price with longer cache time
 */
export function useTonPrice() {
  return useQuery<number>({
    queryKey: ['ton-price'],
    queryFn: async () => {
      try {
        const response = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=usd'
        );
        const data = await response.json();
        return data['the-open-network']?.usd || 0;
      } catch {
        return 0;
      }
    },
    staleTime: 15 * 60 * 1000, // 15 minutes (increased from 5)
    gcTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook for referral data (lazy loaded)
 */
export function useReferrals(userId: string | null) {
  return useQuery({
    queryKey: ['referrals', userId],
    queryFn: async () => {
      if (!userId) return { referrals: [], count: 0 };

      const { data, error, count } = await supabase
        .from('bolt_referrals')
        .select('*, referred:referred_id(telegram_username, first_name, created_at)', {
          count: 'exact',
        })
        .eq('referrer_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return { referrals: data || [], count: count || 0 };
    },
    enabled: !!userId,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });
}

/**
 * Hook for leaderboard data (with longer cache)
 */
export function useLeaderboard(limit = 100) {
  return useQuery({
    queryKey: ['leaderboard', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bolt_users')
        .select('id, telegram_username, first_name, photo_url, token_balance')
        .order('token_balance', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
